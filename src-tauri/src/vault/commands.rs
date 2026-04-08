use crate::db::connection::DbState;
use crate::vault::linker::{self, Backlink};
use crate::vault::markdown::parse_document;
use crate::vault::sync;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

/// Managed state that holds the currently-open vault path.
pub struct VaultState {
    pub path: Mutex<Option<PathBuf>>,
}

impl VaultState {
    pub fn new() -> Self {
        VaultState {
            path: Mutex::new(None),
        }
    }
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

/// Create the vault directory structure at `path`.
///
/// ```text
/// <path>/
///   concepts/
///   notes/
///   captures/
///   daily/
///   templates/
///   .arkvim/
/// ```
#[tauri::command]
pub fn vault_init(path: String) -> Result<String, String> {
    let root = PathBuf::from(&path);
    let dirs = [
        "concepts",
        "notes",
        "captures",
        "daily",
        "templates",
        ".arkvim",
    ];

    for dir in &dirs {
        let full = root.join(dir);
        std::fs::create_dir_all(&full)
            .map_err(|e| format!("Failed to create {}: {}", full.display(), e))?;
    }

    // Write a default daily-note template if one doesn't exist.
    let template_path = root.join("templates").join("daily.md");
    if !template_path.exists() {
        let template = "---\ndate: {{date}}\n---\n# {{date}}\n\n## Tasks\n\n- [ ] \n\n## Notes\n\n";
        std::fs::write(&template_path, template)
            .map_err(|e| format!("Failed to write template: {}", e))?;
    }

    log::info!("Vault initialised at {}", root.display());
    Ok(path)
}

/// Open an existing vault: store its path in managed state and run a full
/// index so the DB is up to date.
#[tauri::command]
pub fn vault_open(
    path: String,
    vault_state: State<VaultState>,
    db_state: State<DbState>,
) -> Result<usize, String> {
    let vault_path = PathBuf::from(&path);
    if !vault_path.is_dir() {
        return Err(format!("Vault path does not exist: {}", path));
    }

    // Ensure backlinks table is ready.
    {
        let conn = db_state.conn.lock().map_err(|e| e.to_string())?;
        linker::ensure_backlinks_table(&conn)?;
    }

    // Run full index.
    let count = {
        let conn = db_state.conn.lock().map_err(|e| e.to_string())?;
        sync::full_index(&vault_path, &conn)?
    };

    // Store vault path.
    {
        let mut vp = vault_state.path.lock().map_err(|e| e.to_string())?;
        *vp = Some(vault_path);
    }

    Ok(count)
}

/// Read the contents of a file inside the vault.
#[tauri::command]
pub fn vault_get_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read {}: {}", path, e))
}

/// Write content to a vault file and sync changes to the database.
#[tauri::command]
pub fn vault_save_file(
    path: String,
    content: String,
    db_state: State<DbState>,
    vault_state: State<VaultState>,
) -> Result<(), String> {
    let file_path = PathBuf::from(&path);

    // Ensure parent directory exists.
    if let Some(parent) = file_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create dirs: {}", e))?;
    }

    std::fs::write(&file_path, &content)
        .map_err(|e| format!("Failed to write {}: {}", path, e))?;

    // Sync to DB.
    {
        let conn = db_state.conn.lock().map_err(|e| e.to_string())?;
        sync::sync_file_to_db(&file_path, &conn)?;

        // Re-index links.
        let doc = parse_document(&content);
        let vault_path = vault_state.path.lock().map_err(|e| e.to_string())?;
        let relative = if let Some(vp) = vault_path.as_ref() {
            file_path
                .strip_prefix(vp)
                .unwrap_or(&file_path)
                .to_string_lossy()
                .to_string()
        } else {
            path.clone()
        };
        linker::index_links(&doc, &relative, &conn)?;
    }

    Ok(())
}

/// Get backlinks for a given target name.
#[tauri::command]
pub fn vault_get_backlinks(
    target: String,
    db_state: State<DbState>,
) -> Result<Vec<Backlink>, String> {
    let conn = db_state.conn.lock().map_err(|e| e.to_string())?;
    linker::get_backlinks(&target, &conn)
}

/// List all daily notes (filenames without extension) in the `daily/`
/// subdirectory, sorted newest-first.
#[tauri::command]
pub fn vault_list_daily_notes(
    vault_state: State<VaultState>,
) -> Result<Vec<String>, String> {
    let vault_path = vault_state.path.lock().map_err(|e| e.to_string())?;
    let vault_path = vault_path
        .as_ref()
        .ok_or_else(|| "No vault is currently open".to_string())?;

    let daily_dir = vault_path.join("daily");
    if !daily_dir.is_dir() {
        return Ok(Vec::new());
    }

    let mut notes: Vec<String> = std::fs::read_dir(&daily_dir)
        .map_err(|e| format!("Failed to read daily dir: {}", e))?
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let path = entry.path();
            if path.extension()?.to_str()? == "md" {
                Some(path.file_stem()?.to_str()?.to_string())
            } else {
                None
            }
        })
        .collect();

    // Sort descending (newest date first).
    notes.sort();
    notes.reverse();

    Ok(notes)
}

/// Create today's daily note from the daily template.  Returns the file path.
#[tauri::command]
pub fn vault_create_daily_note(
    vault_state: State<VaultState>,
) -> Result<String, String> {
    let vault_path = vault_state.path.lock().map_err(|e| e.to_string())?;
    let vault_path = vault_path
        .as_ref()
        .ok_or_else(|| "No vault is currently open".to_string())?;

    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let daily_dir = vault_path.join("daily");
    std::fs::create_dir_all(&daily_dir)
        .map_err(|e| format!("Failed to create daily dir: {}", e))?;

    let file_path = daily_dir.join(format!("{}.md", today));

    if file_path.exists() {
        // Already exists -- just return its path.
        return Ok(file_path.to_string_lossy().to_string());
    }

    // Load template.
    let template_path = vault_path.join("templates").join("daily.md");
    let template = if template_path.exists() {
        std::fs::read_to_string(&template_path)
            .map_err(|e| format!("Failed to read template: {}", e))?
    } else {
        format!("---\ndate: {}\n---\n# {}\n\n", today, today)
    };

    let content = template.replace("{{date}}", &today);

    std::fs::write(&file_path, &content)
        .map_err(|e| format!("Failed to write daily note: {}", e))?;

    log::info!("Created daily note: {}", file_path.display());
    Ok(file_path.to_string_lossy().to_string())
}
