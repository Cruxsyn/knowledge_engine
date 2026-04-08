/**
 * Database adapter interface for dual-mode operation.
 * SQL.js for browser development, rusqlite via Tauri IPC for desktop.
 */

export interface DatabaseAdapter {
  /** Initialize the adapter (load WASM, open connection, etc.) */
  init(): Promise<void>

  /** Execute a SELECT query and return results */
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>

  /** Execute a SELECT query returning a single row */
  queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null>

  /** Execute a write statement (INSERT, UPDATE, DELETE) */
  execute(sql: string, params?: unknown[]): Promise<void>

  /** Execute multiple statements in a transaction */
  transaction(statements: Array<{ sql: string; params?: unknown[] }>): Promise<void>

  /** Execute raw SQL batch (for migrations, schema creation) */
  executeBatch(sql: string): Promise<void>

  /** Export database as binary for backup */
  exportDatabase(): Promise<Uint8Array>

  /** Import database from binary data */
  importDatabase(data: Uint8Array): Promise<void>

  /** Whether the adapter is initialized */
  isReady(): boolean
}

let currentAdapter: DatabaseAdapter | null = null

/**
 * Detect whether we're running inside Tauri.
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

/**
 * Get the current database adapter.
 * Auto-selects based on environment on first call.
 */
export async function getAdapter(): Promise<DatabaseAdapter> {
  if (currentAdapter?.isReady()) {
    return currentAdapter
  }

  if (isTauri()) {
    const { TauriAdapter } = await import('./adapters/tauri-adapter')
    currentAdapter = new TauriAdapter()
  } else {
    const { SqlJsAdapter } = await import('./adapters/sqljs-adapter')
    currentAdapter = new SqlJsAdapter()
  }

  await currentAdapter.init()
  return currentAdapter
}

/**
 * Reset the adapter (for testing or database reset scenarios).
 */
export function resetAdapter(): void {
  currentAdapter = null
}
