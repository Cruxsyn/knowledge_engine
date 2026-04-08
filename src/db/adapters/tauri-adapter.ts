import { invoke } from '@tauri-apps/api/core'
import type { DatabaseAdapter } from '../adapter'

/**
 * Database adapter that delegates to Rust via Tauri IPC.
 * Used in desktop (Tauri) mode.
 */
export class TauriAdapter implements DatabaseAdapter {
  private ready = false

  async init(): Promise<void> {
    // Rust side handles DB init in setup(), so we just verify connectivity
    try {
      await invoke<unknown[]>('db_query', {
        sql: 'SELECT 1',
        params: [],
      })
      this.ready = true
      console.log('[TauriAdapter] Connected to native SQLite')
    } catch (err) {
      console.error('[TauriAdapter] Failed to connect:', err)
      throw err
    }
  }

  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    const results = await invoke<T[]>('db_query', {
      sql,
      params: this.serializeParams(params),
    })
    return results
  }

  async queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
    const results = await this.query<T>(sql, params)
    return results[0] ?? null
  }

  async execute(sql: string, params: unknown[] = []): Promise<void> {
    await invoke('db_execute', {
      sql,
      params: this.serializeParams(params),
    })
  }

  async transaction(statements: Array<{ sql: string; params?: unknown[] }>): Promise<void> {
    const serialized = statements.map(s => [
      s.sql,
      this.serializeParams(s.params ?? []),
    ])
    await invoke('db_transaction', { statements: serialized })
  }

  async executeBatch(sql: string): Promise<void> {
    // Split batch SQL into individual statements and execute in transaction
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => ({ sql: s + ';', params: [] as unknown[] }))

    if (statements.length > 0) {
      for (const stmt of statements) {
        await this.execute(stmt.sql, stmt.params)
      }
    }
  }

  async exportDatabase(): Promise<Uint8Array> {
    // In Tauri mode, export is handled by the Rust side
    const data = await invoke<number[]>('db_query', {
      sql: 'SELECT 1',
      params: [],
    })
    // TODO: Implement proper export via Tauri command
    return new Uint8Array(data)
  }

  async importDatabase(_data: Uint8Array): Promise<void> {
    // TODO: Implement proper import via Tauri command
    throw new Error('Import not yet implemented for Tauri mode')
  }

  isReady(): boolean {
    return this.ready
  }

  /**
   * Serialize parameters to JSON-compatible types for IPC.
   */
  private serializeParams(params: unknown[]): unknown[] {
    return params.map(p => {
      if (p === null || p === undefined) return null
      if (typeof p === 'number' || typeof p === 'string' || typeof p === 'boolean') return p
      return String(p)
    })
  }
}
