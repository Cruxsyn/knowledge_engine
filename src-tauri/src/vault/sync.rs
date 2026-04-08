use crate::vault::markdown::{parse_document, to_markdown, ParsedDocument};
use rusqlite::Connection;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// Bidirectional sync engine between the filesystem vault and SQLite.
pub struct VaultSync {
    pub vault_path: PathBuf,
}

impl VaultSync {
    pub fn new(vault_path: PathBuf) -> Self {
        VaultSync { vault_path }
    }
}

// ---------------------------------------------------------------------------
// Filesystem -> Database
// ---------------------------------------------------------------------------

/// Read a markdown file, parse it, and upsert the corresponding row in the
/// database.  The entity type is inferred from the file's parent directory:
///   - `concepts/<name>.md` -> `concepts` table
///   - `notes/<title>.md`   -> `atomic_notes` table
///   - `captures/<title>.md` -> `captures` table
pub fn sync_file_to_db(path: &Path, conn: &Connection) -> Result<(), String> {
    let content = std::fs::read_to_string(path).map_err(|e| {
        format!("Failed to read {}: {}", path.display(), e)
    })?;

    let doc = parse_document(&content);

    // Determine entity type from parent directory name.
    let parent_name = path
        .parent()
        .and_then(|p| p.file_name())
        .and_then(|n| n.to_str())
        .unwrap_or("");

    let file_stem = path
        .file_stem()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();

    match parent_name {
        "concepts" => upsert_concept(&file_stem, &doc, conn)?,
        "notes" => upsert_note(&file_stem, &doc, conn)?,
        "captures" => upsert_capture(&file_stem, &doc, conn)?,
        _ => {
            log::debug!(
                "Skipping sync for file outside known dirs: {}",
                path.display()
            );
        }
    }

    Ok(())
}

fn upsert_concept(name: &str, doc: &ParsedDocument, conn: &Connection) -> Result<(), String> {
    let id = doc
        .frontmatter
        .get("id")
        .cloned()
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

    let definition = &doc.body;
    let intuition = doc.frontmatter.get("intuition").cloned();
    let pitfalls = doc.frontmatter.get("pitfalls").cloned();
    let mastery = doc
        .frontmatter
        .get("mastery")
        .cloned()
        .unwrap_or_else(|| "unknown".to_string());

    conn.execute(
        "INSERT INTO concepts (id, name, definition, intuition, pitfalls, mastery, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))
         ON CONFLICT(name) DO UPDATE SET
           definition = excluded.definition,
           intuition  = excluded.intuition,
           pitfalls   = excluded.pitfalls,
           mastery    = excluded.mastery,
           updated_at = datetime('now')",
        rusqlite::params![id, name, definition, intuition, pitfalls, mastery],
    )
    .map_err(|e| format!("Failed to upsert concept '{}': {}", name, e))?;

    log::debug!("Synced concept '{}' to DB", name);
    Ok(())
}

fn upsert_note(title: &str, doc: &ParsedDocument, conn: &Connection) -> Result<(), String> {
    let id = doc
        .frontmatter
        .get("id")
        .cloned()
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

    let note_type = doc
        .frontmatter
        .get("type")
        .cloned()
        .unwrap_or_else(|| "other".to_string());

    let confidence: i32 = doc
        .frontmatter
        .get("confidence")
        .and_then(|v| v.parse().ok())
        .unwrap_or(3);

    let content = &doc.body;

    conn.execute(
        "INSERT INTO atomic_notes (id, title, note_type, content, confidence, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           title      = excluded.title,
           note_type  = excluded.note_type,
           content    = excluded.content,
           confidence = excluded.confidence,
           updated_at = datetime('now')",
        rusqlite::params![id, title, note_type, content, confidence],
    )
    .map_err(|e| format!("Failed to upsert note '{}': {}", title, e))?;

    log::debug!("Synced note '{}' to DB", title);
    Ok(())
}

fn upsert_capture(title: &str, doc: &ParsedDocument, conn: &Connection) -> Result<(), String> {
    let id = doc
        .frontmatter
        .get("id")
        .cloned()
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

    let cap_type = doc
        .frontmatter
        .get("type")
        .cloned()
        .unwrap_or_else(|| "thought".to_string());

    let priority = doc
        .frontmatter
        .get("priority")
        .cloned()
        .unwrap_or_else(|| "medium".to_string());

    let status = doc
        .frontmatter
        .get("status")
        .cloned()
        .unwrap_or_else(|| "new".to_string());

    let content = &doc.body;

    conn.execute(
        "INSERT INTO captures (id, title, type, content, priority, status, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           title      = excluded.title,
           type       = excluded.type,
           content    = excluded.content,
           priority   = excluded.priority,
           status     = excluded.status,
           updated_at = datetime('now')",
        rusqlite::params![id, title, cap_type, content, priority, status],
    )
    .map_err(|e| format!("Failed to upsert capture '{}': {}", title, e))?;

    log::debug!("Synced capture '{}' to DB", title);
    Ok(())
}

// ---------------------------------------------------------------------------
// Database -> Filesystem
// ---------------------------------------------------------------------------

/// Write a database entity back to the vault as a markdown file.
/// `entity_type` is one of `"concept"`, `"note"`, or `"capture"`.
pub fn sync_db_to_file(
    id: &str,
    entity_type: &str,
    conn: &Connection,
    vault_path: &Path,
) -> Result<(), String> {
    let (subdir, doc) = match entity_type {
        "concept" => ("concepts", concept_to_doc(id, conn)?),
        "note" => ("notes", note_to_doc(id, conn)?),
        "capture" => ("captures", capture_to_doc(id, conn)?),
        other => return Err(format!("Unknown entity type: {}", other)),
    };

    let filename = doc
        .frontmatter
        .get("_filename")
        .cloned()
        .unwrap_or_else(|| sanitize_filename(id));

    let dir = vault_path.join(subdir);
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create dir {}: {}", dir.display(), e))?;

    let file_path = dir.join(format!("{}.md", filename));

    // Build a clean doc (without the internal _filename key).
    let mut clean_fm = doc.frontmatter.clone();
    clean_fm.remove("_filename");

    let clean_doc = ParsedDocument {
        frontmatter: clean_fm,
        body: doc.body.clone(),
        wikilinks: doc.wikilinks.clone(),
        tags: doc.tags.clone(),
    };

    let markdown = to_markdown(&clean_doc);
    std::fs::write(&file_path, &markdown).map_err(|e| {
        format!("Failed to write {}: {}", file_path.display(), e)
    })?;

    log::debug!("Synced {} '{}' to {}", entity_type, id, file_path.display());
    Ok(())
}

fn concept_to_doc(id: &str, conn: &Connection) -> Result<ParsedDocument, String> {
    let (name, definition, intuition, pitfalls, mastery): (
        String,
        String,
        Option<String>,
        Option<String>,
        String,
    ) = conn
        .query_row(
            "SELECT name, definition, intuition, pitfalls, mastery FROM concepts WHERE id = ?1",
            rusqlite::params![id],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                ))
            },
        )
        .map_err(|e| format!("Concept '{}' not found: {}", id, e))?;

    let mut fm = HashMap::new();
    fm.insert("id".to_string(), id.to_string());
    fm.insert("mastery".to_string(), mastery);
    fm.insert("_filename".to_string(), name.clone());
    if let Some(i) = intuition {
        fm.insert("intuition".to_string(), i);
    }
    if let Some(p) = pitfalls {
        fm.insert("pitfalls".to_string(), p);
    }

    Ok(ParsedDocument {
        frontmatter: fm,
        body: definition,
        wikilinks: Vec::new(),
        tags: Vec::new(),
    })
}

fn note_to_doc(id: &str, conn: &Connection) -> Result<ParsedDocument, String> {
    let (title, note_type, content, confidence): (String, String, String, i32) = conn
        .query_row(
            "SELECT title, note_type, content, confidence FROM atomic_notes WHERE id = ?1",
            rusqlite::params![id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )
        .map_err(|e| format!("Note '{}' not found: {}", id, e))?;

    let mut fm = HashMap::new();
    fm.insert("id".to_string(), id.to_string());
    fm.insert("type".to_string(), note_type);
    fm.insert("confidence".to_string(), confidence.to_string());
    fm.insert("_filename".to_string(), title.clone());

    Ok(ParsedDocument {
        frontmatter: fm,
        body: content,
        wikilinks: Vec::new(),
        tags: Vec::new(),
    })
}

fn capture_to_doc(id: &str, conn: &Connection) -> Result<ParsedDocument, String> {
    let (title, cap_type, content, priority, status): (
        String,
        String,
        String,
        String,
        String,
    ) = conn
        .query_row(
            "SELECT title, type, content, priority, status FROM captures WHERE id = ?1",
            rusqlite::params![id],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                ))
            },
        )
        .map_err(|e| format!("Capture '{}' not found: {}", id, e))?;

    let mut fm = HashMap::new();
    fm.insert("id".to_string(), id.to_string());
    fm.insert("type".to_string(), cap_type);
    fm.insert("priority".to_string(), priority);
    fm.insert("status".to_string(), status);
    fm.insert("_filename".to_string(), title.clone());

    Ok(ParsedDocument {
        frontmatter: fm,
        body: content,
        wikilinks: Vec::new(),
        tags: Vec::new(),
    })
}

// ---------------------------------------------------------------------------
// Full index
// ---------------------------------------------------------------------------

/// Walk every `.md` file under `vault_path` and sync each one into the
/// database.  Also indexes backlinks via [`crate::vault::linker`].
pub fn full_index(vault_path: &Path, conn: &Connection) -> Result<usize, String> {
    let mut count = 0usize;

    for entry in WalkDir::new(vault_path)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("md") {
            continue;
        }

        if let Err(e) = sync_file_to_db(path, conn) {
            log::warn!("Failed to sync {}: {}", path.display(), e);
            continue;
        }

        // Also index links for backlink tracking.
        if let Ok(content) = std::fs::read_to_string(path) {
            let doc = parse_document(&content);
            let source = path
                .strip_prefix(vault_path)
                .unwrap_or(path)
                .to_string_lossy()
                .to_string();
            if let Err(e) = crate::vault::linker::index_links(&doc, &source, conn) {
                log::warn!("Failed to index links for {}: {}", path.display(), e);
            }
        }

        count += 1;
    }

    log::info!("Full index complete: {} files indexed", count);
    Ok(count)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Make a string safe for use as a filename.
fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            _ => c,
        })
        .collect()
}
