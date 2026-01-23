import initSqlJs, { type Database, type SqlJsStatic, type SqlValue } from 'sql.js'
import { loadFromStorage, saveToStorage } from '@/lib/persistence'
import schema from './schema.sql?raw'

let SQL: SqlJsStatic | null = null
let db: Database | null = null
let saveTimeout: ReturnType<typeof setTimeout> | null = null

const DEBOUNCE_SAVE_MS = 1000

/**
 * Seed database with test data
 */
function seedTestData(database: Database): void {
  const now = new Date().toISOString()
  
  // Create test concepts
  const concepts = [
    { id: 'c1', name: 'React Hooks', definition: 'Functions that let you use state and other React features in functional components', intuition: 'Think of hooks as a way to "hook into" React features', pitfalls: 'Cannot call hooks conditionally or in loops', mastery: 'solid' },
    { id: 'c2', name: 'State Management', definition: 'The practice of managing the data that determines the behavior and appearance of an application', intuition: 'Like a central nervous system for your app', pitfalls: 'Over-engineering simple apps with complex state solutions', mastery: 'learning' },
    { id: 'c3', name: 'Component Composition', definition: 'Building complex UIs from smaller, reusable components', intuition: 'Like LEGO blocks - small pieces combine to make complex structures', pitfalls: 'Creating too many tiny components or too few large ones', mastery: 'teachable' },
    { id: 'c4', name: 'TypeScript Generics', definition: 'A way to create reusable components that work with multiple types', intuition: 'Like function parameters, but for types', pitfalls: 'Over-complicating type definitions', mastery: 'unknown' },
    { id: 'c5', name: 'Async/Await', definition: 'Syntactic sugar for working with Promises in JavaScript', intuition: 'Makes async code read like synchronous code', pitfalls: 'Forgetting error handling with try/catch', mastery: 'solid' },
    { id: 'c6', name: 'REST APIs', definition: 'Architectural style for designing networked applications using HTTP methods', intuition: 'Like a waiter taking orders between kitchen and customers', pitfalls: 'Not following proper HTTP status codes', mastery: 'teachable' },
  ]
  
  for (const c of concepts) {
    database.run(`
      INSERT INTO concepts (id, name, definition, intuition, pitfalls, mastery, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [c.id, c.name, c.definition, c.intuition, c.pitfalls, c.mastery, now, now])
  }
  
  // Create test notes with type-specific content
  const notes = [
    { 
      id: 'n1', 
      title: 'useState vs useReducer', 
      note_type: 'connection', 
      content: JSON.stringify({ item_a: 'useState', item_b: 'useReducer', relationship: 'useState is simpler for single values, useReducer is better for complex state logic with multiple sub-values. Use useReducer when state logic is complex or when the next state depends on the previous one.' }),
      confidence: 4 
    },
    { 
      id: 'n2', 
      title: 'The Rules of Hooks', 
      note_type: 'definition', 
      content: JSON.stringify({ term: 'Rules of Hooks', definition: 'Hooks must be called at the top level and only from React functions. Breaking hook rules causes unpredictable behavior because React relies on call order.' }),
      confidence: 5 
    },
    { 
      id: 'n3', 
      title: 'Props vs State', 
      note_type: 'connection', 
      content: JSON.stringify({ item_a: 'Props', item_b: 'State', relationship: 'Props are passed from parent and are read-only. State is managed internally. Both trigger re-renders when changed. Never modify props directly.' }),
      confidence: 5 
    },
    { 
      id: 'n4', 
      title: 'Generic Constraints', 
      note_type: 'definition', 
      content: JSON.stringify({ term: 'Generic Constraints', definition: 'Use the extends keyword to limit what types can be passed to a generic. Constraints let you access properties on generic types safely.' }),
      confidence: 3 
    },
    { 
      id: 'n5', 
      title: 'Error Boundaries', 
      note_type: 'definition', 
      content: JSON.stringify({ term: 'Error Boundaries', definition: 'React components that catch JavaScript errors in their child component tree. Error boundaries only catch errors during rendering, not in event handlers.' }),
      confidence: 3 
    },
    { 
      id: 'n6', 
      title: 'API Design Best Practices', 
      note_type: 'process', 
      content: JSON.stringify({ steps: '1. Use nouns for resources (e.g., /users, /posts)\n2. Use HTTP verbs for actions (GET, POST, PUT, DELETE)\n3. Use consistent naming conventions\n4. Return proper status codes', use_case: 'Good API design prioritizes predictability and developer experience' }),
      confidence: 4 
    },
    { 
      id: 'n7', 
      title: 'Promise.all vs Promise.allSettled', 
      note_type: 'connection', 
      content: JSON.stringify({ item_a: 'Promise.all', item_b: 'Promise.allSettled', relationship: 'Promise.all fails fast on first rejection, allSettled waits for all to complete. Use allSettled when you need all results regardless of individual failures.' }),
      confidence: 4 
    },
  ]
  
  for (const n of notes) {
    database.run(`
      INSERT INTO atomic_notes (id, title, note_type, content, confidence, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [n.id, n.title, n.note_type, n.content, n.confidence, now, now])
  }
  
  // Link notes to concepts
  const noteConceptLinks = [
    { note_id: 'n1', concept_id: 'c1' }, // useState vs useReducer -> React Hooks
    { note_id: 'n1', concept_id: 'c2' }, // useState vs useReducer -> State Management
    { note_id: 'n2', concept_id: 'c1' }, // Rules of Hooks -> React Hooks
    { note_id: 'n3', concept_id: 'c2' }, // Props vs State -> State Management
    { note_id: 'n3', concept_id: 'c3' }, // Props vs State -> Component Composition
    { note_id: 'n4', concept_id: 'c4' }, // Generic Constraints -> TypeScript Generics
    { note_id: 'n5', concept_id: 'c3' }, // Error Boundaries -> Component Composition
    { note_id: 'n6', concept_id: 'c6' }, // API Best Practices -> REST APIs
    { note_id: 'n7', concept_id: 'c5' }, // Promise methods -> Async/Await
  ]
  
  for (const link of noteConceptLinks) {
    database.run(`
      INSERT INTO concept_notes (concept_id, note_id)
      VALUES (?, ?)
    `, [link.concept_id, link.note_id])
  }
  
  // Create concept-to-concept links
  const conceptLinks = [
    { id: 'l1', source_id: 'c1', target_id: 'c2', relationship: 'used_in' }, // React Hooks used in State Management
    { id: 'l2', source_id: 'c3', target_id: 'c1', relationship: 'depends_on' }, // Component Composition depends on React Hooks
    { id: 'l3', source_id: 'c5', target_id: 'c6', relationship: 'used_in' }, // Async/Await used in REST APIs
    { id: 'l4', source_id: 'c4', target_id: 'c1', relationship: 'refines' }, // TypeScript Generics refines React Hooks
  ]
  
  for (const link of conceptLinks) {
    database.run(`
      INSERT INTO links (id, source_id, target_id, relationship, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [link.id, link.source_id, link.target_id, link.relationship, now])
  }
  
  console.log('[Database] Seeded test data: 6 concepts, 7 notes, 9 note-concept links, 4 concept links')
}

/**
 * Run database migrations for existing databases
 */
function runMigrations(database: Database): void {
  try {
    const result = database.exec("PRAGMA table_info(atomic_notes)")
    const columns = result[0]?.values.map(row => row[1]) || []
    
    // Add note_type column if missing
    if (!columns.includes('note_type')) {
      console.log('[Database] Running migration: adding note_type column')
      database.run("ALTER TABLE atomic_notes ADD COLUMN note_type TEXT NOT NULL DEFAULT 'other'")
    }
    
    // Add content column if missing
    if (!columns.includes('content')) {
      console.log('[Database] Running migration: adding content column')
      database.run("ALTER TABLE atomic_notes ADD COLUMN content TEXT NOT NULL DEFAULT '{}'")
      
      // Migrate existing data from summary/key_claim/example to content JSON
      const notes = database.exec("SELECT id, summary, key_claim, example FROM atomic_notes")
      if (notes[0]) {
        for (const row of notes[0].values) {
          const id = row[0]
          const content = JSON.stringify({
            summary: row[1] || '',
            key_claim: row[2] || '',
            example: row[3] || undefined,
          })
          database.run("UPDATE atomic_notes SET content = ? WHERE id = ?", [content, id])
        }
        console.log('[Database] Migrated note content to JSON format')
      }
    }
  } catch (err) {
    console.error('[Database] Migration error:', err)
  }
}

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
    // Run migrations for existing databases
    runMigrations(db)
    await persistDatabase()
  } else {
    db = new SQL.Database()
    // Run schema for new database
    db.run(schema)
    console.log('[Database] Created new database with schema')
    // Save the new database (no test data by default)
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

/**
 * Reset database and reseed with test data
 */
export async function resetAndSeedDatabase(): Promise<void> {
  if (!SQL) {
    throw new Error('SQL.js not initialized')
  }
  
  // Close existing database
  if (db) {
    db.close()
  }
  
  // Create fresh database
  db = new SQL.Database()
  db.run(schema)
  seedTestData(db)
  await persistDatabase()
  console.log('[Database] Reset and reseeded')
}

/**
 * Clear all data from the database (keeps schema, no test data)
 */
export async function clearDatabase(): Promise<void> {
  if (!SQL) {
    throw new Error('SQL.js not initialized')
  }
  
  // Close existing database
  if (db) {
    db.close()
  }
  
  // Create fresh database with just the schema
  db = new SQL.Database()
  db.run(schema)
  await persistDatabase()
  console.log('[Database] Cleared all data')
}
