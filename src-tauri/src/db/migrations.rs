use rusqlite::Connection;

const SCHEMA_MAIN: &str = include_str!("../../../src/db/schema.sql");
const SCHEMA_LEARNING: &str = include_str!("../../../src/db/learning-schema.sql");
const SCHEMA_JAPANESE: &str = include_str!("../../../src/db/japanese-schema.sql");

/// Run all schema migrations against the database.
/// Uses IF NOT EXISTS so they are safe to re-run.
pub fn run_migrations(conn: &Connection) -> Result<(), rusqlite::Error> {
    log::info!("Running database migrations...");

    conn.execute_batch(SCHEMA_MAIN)?;
    log::info!("Applied main schema");

    conn.execute_batch(SCHEMA_LEARNING)?;
    log::info!("Applied learning schema");

    conn.execute_batch(SCHEMA_JAPANESE)?;
    log::info!("Applied Japanese schema");

    log::info!("All migrations complete");
    Ok(())
}
