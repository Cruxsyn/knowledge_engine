use crate::db::connection::DbState;
use crate::search::indexer::{SearchIndex, SearchResult};
use std::sync::Mutex;
use tauri::State;

/// Managed state wrapper for the search index.
pub struct SearchState {
    pub index: Mutex<SearchIndex>,
}

/// Execute a full-text search query.
///
/// - `query`: the search string (tantivy query syntax supported)
/// - `entity_type`: optional filter — "concept", "note", or "capture"
/// - `limit`: max results to return (default 20)
#[tauri::command]
pub fn search_query(
    state: State<SearchState>,
    query: String,
    entity_type: Option<String>,
    limit: Option<usize>,
) -> Result<Vec<SearchResult>, String> {
    let index = state.index.lock().map_err(|e| e.to_string())?;
    let limit = limit.unwrap_or(20);
    let results = index.search(&query, entity_type.as_deref(), limit);
    Ok(results)
}

/// Rebuild the entire search index from the database.
#[tauri::command]
pub fn search_reindex(
    search_state: State<SearchState>,
    db_state: State<DbState>,
) -> Result<(), String> {
    let index = search_state.index.lock().map_err(|e| e.to_string())?;
    let conn = db_state.conn.lock().map_err(|e| e.to_string())?;
    index.reindex_all(&conn);
    Ok(())
}
