use git2::{Repository, Signature, StatusOptions};
use serde::Serialize;

#[derive(Serialize)]
pub struct GitLogEntry {
    pub hash: String,
    pub message: String,
    pub author: String,
    pub date: String,
}

#[tauri::command]
pub fn git_init(vault_path: String) -> Result<bool, String> {
    Repository::init(&vault_path).map_err(|e| e.to_string())?;
    log::info!("Initialized git repo at {}", vault_path);
    Ok(true)
}

#[tauri::command]
pub fn git_commit(vault_path: String, message: String) -> Result<String, String> {
    let repo = Repository::open(&vault_path).map_err(|e| e.to_string())?;

    // Stage all changes
    let mut index = repo.index().map_err(|e| e.to_string())?;
    index.add_all(["*"].iter(), git2::IndexAddOption::DEFAULT, None)
        .map_err(|e| e.to_string())?;
    index.write().map_err(|e| e.to_string())?;
    let tree_oid = index.write_tree().map_err(|e| e.to_string())?;
    let tree = repo.find_tree(tree_oid).map_err(|e| e.to_string())?;

    let sig = Signature::now("Arkvim", "arkvim@local").map_err(|e| e.to_string())?;

    let parent = repo.head().ok().and_then(|h| h.peel_to_commit().ok());
    let parents: Vec<&git2::Commit> = parent.iter().collect();

    let oid = repo.commit(Some("HEAD"), &sig, &sig, &message, &tree, &parents)
        .map_err(|e| e.to_string())?;

    Ok(oid.to_string())
}

#[tauri::command]
pub fn git_history(file_path: String, limit: Option<usize>) -> Result<Vec<GitLogEntry>, String> {
    // Find repo root by walking up
    let path = std::path::Path::new(&file_path);
    let repo_path = path.ancestors()
        .find(|p| p.join(".git").exists())
        .ok_or_else(|| "Not in a git repository".to_string())?;

    let repo = Repository::open(repo_path).map_err(|e| e.to_string())?;
    let mut revwalk = repo.revwalk().map_err(|e| e.to_string())?;
    revwalk.push_head().map_err(|e| e.to_string())?;
    revwalk.set_sorting(git2::Sort::TIME).map_err(|e| e.to_string())?;

    let limit = limit.unwrap_or(50);
    let mut entries = Vec::new();

    for oid in revwalk.take(limit) {
        let oid = oid.map_err(|e| e.to_string())?;
        let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;

        entries.push(GitLogEntry {
            hash: oid.to_string()[..8].to_string(),
            message: commit.message().unwrap_or("").to_string(),
            author: commit.author().name().unwrap_or("Unknown").to_string(),
            date: chrono::DateTime::from_timestamp(commit.time().seconds(), 0)
                .map(|d| d.format("%Y-%m-%d %H:%M").to_string())
                .unwrap_or_default(),
        });
    }

    Ok(entries)
}

#[tauri::command]
pub fn git_diff(file_path: String, commit_hash: String) -> Result<String, String> {
    let path = std::path::Path::new(&file_path);
    let repo_path = path.ancestors()
        .find(|p| p.join(".git").exists())
        .ok_or_else(|| "Not in a git repository".to_string())?;

    let repo = Repository::open(repo_path).map_err(|e| e.to_string())?;
    let oid = git2::Oid::from_str(&commit_hash).map_err(|e| e.to_string())?;
    let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;
    let tree = commit.tree().map_err(|e| e.to_string())?;

    let diff = repo.diff_tree_to_workdir(Some(&tree), None)
        .map_err(|e| e.to_string())?;

    let mut diff_text = String::new();
    diff.print(git2::DiffFormat::Patch, |_delta, _hunk, line| {
        diff_text.push_str(std::str::from_utf8(line.content()).unwrap_or(""));
        true
    }).map_err(|e| e.to_string())?;

    Ok(diff_text)
}

#[tauri::command]
pub fn git_restore(file_path: String, commit_hash: String) -> Result<bool, String> {
    let path = std::path::Path::new(&file_path);
    let repo_path = path.ancestors()
        .find(|p| p.join(".git").exists())
        .ok_or_else(|| "Not in a git repository".to_string())?;

    let repo = Repository::open(repo_path).map_err(|e| e.to_string())?;
    let oid = git2::Oid::from_str(&commit_hash).map_err(|e| e.to_string())?;
    let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;
    let tree = commit.tree().map_err(|e| e.to_string())?;

    let rel_path = path.strip_prefix(repo_path)
        .map_err(|_| "File not in repo".to_string())?;

    let entry = tree.get_path(rel_path).map_err(|e| e.to_string())?;
    let blob = repo.find_blob(entry.id()).map_err(|e| e.to_string())?;
    let content = blob.content();

    std::fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(true)
}
