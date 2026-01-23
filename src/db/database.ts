import initSqlJs, { type Database, type SqlJsStatic, type SqlValue } from 'sql.js'
import { loadFromStorage, saveToStorage } from '@/lib/persistence'
import schema from './schema.sql?raw'

let SQL: SqlJsStatic | null = null
let db: Database | null = null
let saveTimeout: ReturnType<typeof setTimeout> | null = null

const DEBOUNCE_SAVE_MS = 1000

/**
 * Initialize sql.js and the database
 */
export async function initDatabase(): Promise<Database> {
  if (db) return db

  // Initialize sql.js with local WASM file (includes FTS5 support)
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file) => `/${file}`,
    })
  }

  // Try to load existing database from storage
  const existingData = await loadFromStorage()

  if (existingData) {
    db = new SQL.Database(existingData)
    console.log('[Database] Loaded existing database')
  } else {
    db = new SQL.Database()
    // Run schema for new database
    db.run(schema)
    console.log('[Database] Created new database with schema')
    // Save the new database
    await persistDatabase()
  }

  return db
}

/**
 * Get the current database instance
 */
export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

/**
 * Persist database to storage (debounced)
 */
export function schedulePersist(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(async () => {
    await persistDatabase()
  }, DEBOUNCE_SAVE_MS)
}

/**
 * Force immediate persist
 */
export async function persistDatabase(): Promise<void> {
  if (!db) return
  const data = db.export()
  await saveToStorage(data)
}

/**
 * Execute a query and return results
 */
export function query<T = Record<string, unknown>>(sql: string, params: SqlValue[] = []): T[] {
  const database = getDatabase()
  const stmt = database.prepare(sql)
  stmt.bind(params)
  
  const results: T[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject() as T
    results.push(row)
  }
  stmt.free()
  
  return results
}

/**
 * Execute a query that returns a single row
 */
export function queryOne<T = Record<string, unknown>>(sql: string, params: SqlValue[] = []): T | null {
  const results = query<T>(sql, params)
  return results[0] || null
}

/**
 * Execute a statement (INSERT, UPDATE, DELETE)
 */
export function execute(sql: string, params: SqlValue[] = []): void {
  const database = getDatabase()
  database.run(sql, params)
  schedulePersist()
}

/**
 * Execute multiple statements in a transaction
 */
export function transaction(fn: () => void): void {
  const database = getDatabase()
  database.run('BEGIN TRANSACTION')
  try {
    fn()
    database.run('COMMIT')
    schedulePersist()
  } catch (err) {
    database.run('ROLLBACK')
    throw err
  }
}

/**
 * Get the row ID of the last inserted row
 */
export function lastInsertRowId(): number {
  const database = getDatabase()
  const result = database.exec('SELECT last_insert_rowid() as id')
  return result[0]?.values[0]?.[0] as number
}

/**
 * Export database for download
 */
export function exportDatabase(): Uint8Array {
  const database = getDatabase()
  return database.export()
}

/**
 * Import database from data
 */
export async function importDatabaseData(data: Uint8Array): Promise<void> {
  if (!SQL) {
    throw new Error('SQL.js not initialized')
  }
  
  // Close existing database
  if (db) {
    db.close()
  }
  
  // Create new database from imported data
  db = new SQL.Database(data)
  await persistDatabase()
}

/**
 * Close the database
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
