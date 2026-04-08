pub mod db;
pub mod graph;
pub mod math;
pub mod search;
pub mod vault;
pub mod git;

use db::connection::DbState;
use db::migrations;
use math::commands::MathState;
use search::commands::SearchState;
use search::indexer::SearchIndex;
use vault::commands::VaultState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Get app data directory for database storage
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            // Initialize database
            let db_state =
                DbState::new(app_data_dir.clone()).expect("Failed to initialize database");

            // Run migrations
            {
                let conn = db_state.conn.lock().expect("Failed to lock database");
                migrations::run_migrations(&conn).expect("Failed to run migrations");
            }

            app.manage(db_state);

            // Initialize vault state
            app.manage(VaultState::new());

            // Initialize search index
            let index_path = app_data_dir.join("arkvim").join("search_index");
            let search_index = SearchIndex::new(index_path);
            app.manage(SearchState {
                index: std::sync::Mutex::new(search_index),
            });

            // Initialize math state
            app.manage(MathState::new());

            log::info!("Arkvim initialized successfully");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Database
            db::commands::db_query,
            db::commands::db_execute,
            db::commands::db_transaction,
            // Search
            search::commands::search_query,
            search::commands::search_reindex,
            // Graph layout
            graph::commands::graph_layout,
            graph::commands::graph_cluster,
            // Vault
            vault::commands::vault_init,
            vault::commands::vault_open,
            vault::commands::vault_get_file,
            vault::commands::vault_save_file,
            vault::commands::vault_get_backlinks,
            vault::commands::vault_list_daily_notes,
            vault::commands::vault_create_daily_note,
            // Math
            math::commands::math_eval,
            math::commands::math_derive_steps,
            math::commands::math_simplify,
            math::commands::math_solve,
            // Git
            git::commands::git_init,
            git::commands::git_commit,
            git::commands::git_history,
            git::commands::git_diff,
            git::commands::git_restore,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
