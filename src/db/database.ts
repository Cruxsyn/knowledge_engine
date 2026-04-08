/**
 * Database access layer.
 *
 * This module provides async database operations backed by the adapter pattern.
 * In browser mode, uses SQL.js (WASM). In Tauri mode, uses native rusqlite via IPC.
 *
 * All query modules should import from this file for database access.
 */

import { getAdapter, type DatabaseAdapter } from './adapter'

let adapter: DatabaseAdapter | null = null

/**
 * Initialize the database (auto-selects adapter based on environment).
 */
export async function initDatabase(): Promise<void> {
  adapter = await getAdapter()
  console.log('[Database] Initialized')
}

/**
 * Get the initialized adapter (throws if not ready).
 */
function getDb(): DatabaseAdapter {
  if (!adapter || !adapter.isReady()) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return adapter
}

/**
 * Execute a query and return results.
 */
export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  return getDb().query<T>(sql, params)
}

/**
 * Execute a query that returns a single row.
 */
export async function queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
  return getDb().queryOne<T>(sql, params)
}

/**
 * Execute a statement (INSERT, UPDATE, DELETE).
 */
export async function execute(sql: string, params: unknown[] = []): Promise<void> {
  return getDb().execute(sql, params)
}

/**
 * Execute multiple statements in a transaction.
 */
export async function transaction(statements: Array<{ sql: string; params?: unknown[] }>): Promise<void> {
  return getDb().transaction(statements)
}

/**
 * Export database for download.
 */
export async function exportDatabase(): Promise<Uint8Array> {
  return getDb().exportDatabase()
}

/**
 * Import database from data.
 */
export async function importDatabaseData(data: Uint8Array): Promise<void> {
  return getDb().importDatabase(data)
}

/**
 * Reset database and reseed with test data (SQL.js only).
 */
export async function resetAndSeedDatabase(): Promise<void> {
  const { SqlJsAdapter } = await import('./adapters/sqljs-adapter')
  const a = getDb()
  if (a instanceof SqlJsAdapter) {
    await a.resetAndSeed()
  } else {
    throw new Error('Reset/seed is only available in browser mode')
  }
}

/**
 * Clear all data from the database (SQL.js only).
 */
export async function clearDatabase(): Promise<void> {
  const { SqlJsAdapter } = await import('./adapters/sqljs-adapter')
  const a = getDb()
  if (a instanceof SqlJsAdapter) {
    await a.clear()
  } else {
    throw new Error('Clear is only available in browser mode')
  }
}

/**
 * Close/cleanup the database.
 */
export function closeDatabase(): void {
  adapter = null
}
