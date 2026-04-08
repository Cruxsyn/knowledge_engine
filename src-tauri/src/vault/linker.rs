use crate::vault::markdown::ParsedDocument;
use rusqlite::Connection;
use serde::Serialize;

/// A backlink: another document that links *to* a given target.
#[derive(Debug, Clone, Serialize)]
pub struct Backlink {
    /// Vault-relative path of the document containing the link.
    pub source_path: String,
    /// Human-readable title extracted from frontmatter or the filename.
    pub source_title: String,
    /// A snippet of surrounding text for context.
    pub context: String,
}

// ---------------------------------------------------------------------------
// Table management
// ---------------------------------------------------------------------------

/// Ensure the `backlinks` table exists.
pub fn ensure_backlinks_table(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS backlinks (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            source_path TEXT NOT NULL,
            target      TEXT NOT NULL,
            display     TEXT,
            context     TEXT NOT NULL DEFAULT '',
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_backlinks_target ON backlinks(target);
        CREATE INDEX IF NOT EXISTS idx_backlinks_source ON backlinks(source_path);",
    )
    .map_err(|e| format!("Failed to create backlinks table: {}", e))
}

// ---------------------------------------------------------------------------
// Indexing
// ---------------------------------------------------------------------------

/// Parse all wikilinks from `doc` and record them in the `backlinks` table.
/// Previous entries for `source_path` are replaced so the index stays fresh.
pub fn index_links(
    doc: &ParsedDocument,
    source_path: &str,
    conn: &Connection,
) -> Result<(), String> {
    ensure_backlinks_table(conn)?;

    // Remove stale links for this source.
    conn.execute(
        "DELETE FROM backlinks WHERE source_path = ?1",
        rusqlite::params![source_path],
    )
    .map_err(|e| format!("Failed to clear old backlinks: {}", e))?;

    for link in &doc.wikilinks {
        // Build a context snippet: up to 80 chars around the link position.
        let context = extract_context(&doc.body, link.position, 80);

        conn.execute(
            "INSERT INTO backlinks (source_path, target, display, context)
             VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![source_path, link.target, link.display, context],
        )
        .map_err(|e| format!("Failed to insert backlink: {}", e))?;
    }

    log::debug!(
        "Indexed {} links from '{}'",
        doc.wikilinks.len(),
        source_path
    );
    Ok(())
}

// ---------------------------------------------------------------------------
// Querying
// ---------------------------------------------------------------------------

/// Return all documents that link *to* `target` (case-insensitive match on
/// the wikilink target text).
pub fn get_backlinks(target: &str, conn: &Connection) -> Result<Vec<Backlink>, String> {
    ensure_backlinks_table(conn)?;

    let mut stmt = conn
        .prepare(
            "SELECT DISTINCT source_path, context
             FROM backlinks
             WHERE LOWER(target) = LOWER(?1)
             ORDER BY source_path",
        )
        .map_err(|e| format!("Failed to prepare backlinks query: {}", e))?;

    let rows = stmt
        .query_map(rusqlite::params![target], |row| {
            let source_path: String = row.get(0)?;
            let context: String = row.get(1)?;
            // Derive a title from the path (strip directory + extension).
            let source_title = std::path::Path::new(&source_path)
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or(&source_path)
                .to_string();
            Ok(Backlink {
                source_path,
                source_title,
                context,
            })
        })
        .map_err(|e| format!("Failed to query backlinks: {}", e))?;

    let mut backlinks = Vec::new();
    for row in rows {
        backlinks.push(row.map_err(|e| format!("Row error: {}", e))?);
    }

    Ok(backlinks)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Extract a context snippet of up to `max_len` characters centred on `pos`.
fn extract_context(body: &str, pos: usize, max_len: usize) -> String {
    let half = max_len / 2;
    let start = pos.saturating_sub(half);
    let end = (pos + half).min(body.len());

    // Clamp to char boundaries.
    let start = body
        .char_indices()
        .map(|(i, _)| i)
        .find(|&i| i >= start)
        .unwrap_or(0);
    let end = body
        .char_indices()
        .map(|(i, _)| i)
        .rfind(|&i| i <= end)
        .unwrap_or(body.len());

    let snippet = &body[start..end];
    snippet.replace('\n', " ").trim().to_string()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vault::markdown::parse_document;

    fn memory_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        ensure_backlinks_table(&conn).unwrap();
        conn
    }

    #[test]
    fn test_index_and_query() {
        let conn = memory_db();
        let content = "See [[Linear Algebra]] and [[Calculus|calc]] for details.";
        let doc = parse_document(content);

        index_links(&doc, "notes/math-overview.md", &conn).unwrap();

        let links = get_backlinks("Linear Algebra", &conn).unwrap();
        assert_eq!(links.len(), 1);
        assert_eq!(links[0].source_path, "notes/math-overview.md");

        let links2 = get_backlinks("Calculus", &conn).unwrap();
        assert_eq!(links2.len(), 1);
    }

    #[test]
    fn test_reindex_replaces_old() {
        let conn = memory_db();
        let doc1 = parse_document("Link to [[A]].");
        index_links(&doc1, "test.md", &conn).unwrap();
        assert_eq!(get_backlinks("A", &conn).unwrap().len(), 1);

        // Re-index with different links
        let doc2 = parse_document("Now links to [[B]].");
        index_links(&doc2, "test.md", &conn).unwrap();
        assert_eq!(get_backlinks("A", &conn).unwrap().len(), 0);
        assert_eq!(get_backlinks("B", &conn).unwrap().len(), 1);
    }
}
