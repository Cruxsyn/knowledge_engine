pub mod db;

use db::connection::DbState;
use db::migrations;
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
                DbState::new(app_data_dir).expect("Failed to initialize database");

            // Run migrations
            {
                let conn = db_state.conn.lock().expect("Failed to lock database");
                migrations::run_migrations(&conn).expect("Failed to run migrations");
            }

            app.manage(db_state);

            log::info!("Arkvim initialized successfully");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db::commands::db_query,
            db::commands::db_execute,
            db::commands::db_transaction,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
