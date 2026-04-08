use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

pub struct DbState {
    pub conn: Arc<Mutex<Connection>>,
}

impl DbState {
    pub fn new(app_data_dir: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        let db_dir = app_data_dir.join("arkvim");
        std::fs::create_dir_all(&db_dir)?;

        let db_path = db_dir.join("knowledge.db");
        log::info!("Opening database at: {}", db_path.display());

        let conn = Connection::open(&db_path)?;

        // Enable WAL mode for better concurrent read performance
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;

        Ok(DbState {
            conn: Arc::new(Mutex::new(conn)),
        })
    }
}
