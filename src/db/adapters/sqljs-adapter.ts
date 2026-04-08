import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import { loadFromStorage, saveToStorage } from '@/lib/persistence'
import type { DatabaseAdapter } from '../adapter'
import schema from '../schema.sql?raw'
import learningSchema from '../learning-schema.sql?raw'
import japaneseSchema from '../japanese-schema.sql?raw'
import { seedJapaneseData } from '@/db/seed/japanese-seed'
import { seedAllMathCurricula } from '@/db/seed/math/index'

const DEBOUNCE_SAVE_MS = 1000

/**
 * Database adapter using SQL.js (SQLite compiled to WASM).
 * Used in browser development mode.
 */
export class SqlJsAdapter implements DatabaseAdapter {
  private SQL: SqlJsStatic | null = null
  private db: Database | null = null
  private saveTimeout: ReturnType<typeof setTimeout> | null = null
  private ready = false

  async init(): Promise<void> {
    if (this.db) {
      this.ready = true
      return
    }

    // Initialize sql.js
    if (!this.SQL) {
      this.SQL = await initSqlJs({
        locateFile: (file) => `/${file}`,
      })
    }

    // Try to load existing database from storage
    const existingData = await loadFromStorage()

    if (existingData) {
      this.db = new this.SQL.Database(existingData)
      console.log('[SqlJsAdapter] Loaded existing database')
      this.runMigrations()
      this.runLearningMigrations()
      this.runJapaneseMigrations()
      // Seed Japanese data if empty
      try {
        const kanjiCount = this.db.exec('SELECT COUNT(*) as count FROM jp_kanji')
        if (kanjiCount.length === 0 || kanjiCount[0].values[0][0] === 0) {
          console.log('[SqlJsAdapter] Seeding Japanese starter data...')
          seedJapaneseData(this.db)
        }
      } catch (err) {
        console.error('[SqlJsAdapter] Japanese seed check error:', err)
      }
      // Seed math curricula if empty
      try {
        seedAllMathCurricula(this.db)
      } catch (err) {
        console.error('[SqlJsAdapter] Math seed error:', err)
      }
      await this.persist()
    } else {
      this.db = new this.SQL.Database()
      this.db.run(schema)
      this.db.run(learningSchema)
      this.db.run(japaneseSchema)
      console.log('[SqlJsAdapter] Created new database with schema')
      await this.persist()
    }

    this.ready = true
  }

  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    const db = this.getDb()
    const stmt = db.prepare(sql)
    stmt.bind(params as Parameters<typeof stmt.bind>[0])

    const results: T[] = []
    while (stmt.step()) {
      const row = stmt.getAsObject() as T
      results.push(row)
    }
    stmt.free()

    return results
  }

  async queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
    const results = await this.query<T>(sql, params)
    return results[0] ?? null
  }

  async execute(sql: string, params: unknown[] = []): Promise<void> {
    const db = this.getDb()
    db.run(sql, params as Parameters<typeof db.run>[1])
    this.schedulePersist()
  }

  async transaction(statements: Array<{ sql: string; params?: unknown[] }>): Promise<void> {
    const db = this.getDb()
    db.run('BEGIN TRANSACTION')
    try {
      for (const stmt of statements) {
        db.run(stmt.sql, (stmt.params ?? []) as Parameters<typeof db.run>[1])
      }
      db.run('COMMIT')
      this.schedulePersist()
    } catch (err) {
      db.run('ROLLBACK')
      throw err
    }
  }

  async executeBatch(sql: string): Promise<void> {
    const db = this.getDb()
    db.run(sql)
    this.schedulePersist()
  }

  async exportDatabase(): Promise<Uint8Array> {
    const db = this.getDb()
    return db.export()
  }

  async importDatabase(data: Uint8Array): Promise<void> {
    if (!this.SQL) throw new Error('SQL.js not initialized')
    if (this.db) this.db.close()
    this.db = new this.SQL.Database(data)
    await this.persist()
  }

  isReady(): boolean {
    return this.ready
  }

  // --- Internal helpers ---

  private getDb(): Database {
    if (!this.db) throw new Error('Database not initialized')
    return this.db
  }

  private schedulePersist(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout)
    this.saveTimeout = setTimeout(() => this.persist(), DEBOUNCE_SAVE_MS)
  }

  private async persist(): Promise<void> {
    if (!this.db) return
    const data = this.db.export()
    await saveToStorage(data)
  }

  private runMigrations(): void {
    const db = this.getDb()
    try {
      const result = db.exec("PRAGMA table_info(atomic_notes)")
      const columns = result[0]?.values.map(row => row[1]) || []

      if (!columns.includes('note_type')) {
        db.run("ALTER TABLE atomic_notes ADD COLUMN note_type TEXT NOT NULL DEFAULT 'other'")
      }
      if (!columns.includes('content')) {
        db.run("ALTER TABLE atomic_notes ADD COLUMN content TEXT NOT NULL DEFAULT '{}'")
        const notes = db.exec("SELECT id, summary, key_claim, example FROM atomic_notes")
        if (notes[0]) {
          for (const row of notes[0].values) {
            const content = JSON.stringify({
              summary: row[1] || '',
              key_claim: row[2] || '',
              example: row[3] || undefined,
            })
            db.run("UPDATE atomic_notes SET content = ? WHERE id = ?", [content, row[0]])
          }
        }
      }
    } catch (err) {
      console.error('[SqlJsAdapter] Migration error:', err)
    }
  }

  private runLearningMigrations(): void {
    const db = this.getDb()
    try {
      const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='learning_paths'")
      if (tables.length === 0 || tables[0].values.length === 0) {
        db.run(learningSchema)
      }
    } catch (err) {
      console.error('[SqlJsAdapter] Learning migration error:', err)
    }
  }

  private runJapaneseMigrations(): void {
    const db = this.getDb()
    try {
      const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='jp_kanji'")
      if (tables.length === 0 || tables[0].values.length === 0) {
        db.run(japaneseSchema)
        const defaults = [
          ['desired_retention', '0.9'],
          ['new_cards_per_day', '15'],
          ['max_reviews_per_day', '9999'],
          ['daily_new_radical', '5'],
          ['daily_new_kanji', '5'],
          ['daily_new_vocab', '10'],
          ['interleave_reviews', 'true'],
          ['show_pitch_accent', 'true'],
        ]
        for (const [key, value] of defaults) {
          db.run('INSERT OR IGNORE INTO jp_settings (key, value) VALUES (?, ?)', [key, value])
        }
        const dims = ['vocabulary', 'kanji', 'grammar', 'reading', 'listening']
        for (const dim of dims) {
          db.run('INSERT OR IGNORE INTO jp_progress (dimension) VALUES (?)', [dim])
        }
      }
    } catch (err) {
      console.error('[SqlJsAdapter] Japanese migration error:', err)
    }
  }

  /**
   * Get the raw SQL.js Database for legacy code that needs direct access.
   * Only use during migration period — prefer adapter methods.
   */
  getRawDatabase(): Database {
    return this.getDb()
  }

  /**
   * Reset and reseed (for testing / development).
   */
  async resetAndSeed(): Promise<void> {
    if (!this.SQL) throw new Error('SQL.js not initialized')
    if (this.db) this.db.close()
    this.db = new this.SQL.Database()
    this.db.run(schema)
    this.db.run(learningSchema)
    this.db.run(japaneseSchema)
    this.runJapaneseMigrations()
    seedJapaneseData(this.db)
    await this.persist()
    console.log('[SqlJsAdapter] Reset and reseeded')
  }

  /**
   * Clear all data (keeps schema).
   */
  async clear(): Promise<void> {
    if (!this.SQL) throw new Error('SQL.js not initialized')
    if (this.db) this.db.close()
    this.db = new this.SQL.Database()
    this.db.run(schema)
    this.db.run(learningSchema)
    this.db.run(japaneseSchema)
    await this.persist()
    console.log('[SqlJsAdapter] Cleared all data')
  }
}
