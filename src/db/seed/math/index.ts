import type { Database } from 'sql.js'

/**
 * Check if math curricula have been seeded.
 */
export function isMathSeeded(db: Database): boolean {
  try {
    const result = db.exec("SELECT COUNT(*) as count FROM learning_paths WHERE id = 'path-linear-algebra'")
    return result.length > 0 && (result[0].values[0][0] as number) > 0
  } catch {
    return false
  }
}

/**
 * Seed all math curricula. Creates 5 learning paths with lessons,
 * concepts, and SRS review cards.
 *
 * Individual curriculum seeders are loaded dynamically as they are added.
 */
export function seedAllMathCurricula(db: Database): void {
  if (isMathSeeded(db)) {
    console.log('[Math Seed] Already seeded, skipping')
    return
  }

  // Ensure math_srs_cards table exists
  db.run(`CREATE TABLE IF NOT EXISTS math_srs_cards (
    id TEXT PRIMARY KEY,
    path_id TEXT NOT NULL,
    lesson_id TEXT,
    card_type TEXT NOT NULL DEFAULT 'definition',
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    concept_id TEXT,
    stability REAL NOT NULL DEFAULT 0,
    difficulty REAL NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    state INTEGER NOT NULL DEFAULT 0,
    due TEXT NOT NULL DEFAULT (datetime('now')),
    last_review TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
    FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE SET NULL
  )`)

  console.log('[Math Seed] Seeding math curricula...')

  try {
    const { seedLinearAlgebra } = require('./linear-algebra')
    seedLinearAlgebra(db)
    console.log('[Math Seed] Linear Algebra seeded')
  } catch { console.log('[Math Seed] Linear Algebra seed not yet available') }

  try {
    const { seedCalculusML } = require('./calculus-ml')
    seedCalculusML(db)
    console.log('[Math Seed] Calculus for ML seeded')
  } catch { console.log('[Math Seed] Calculus for ML seed not yet available') }

  try {
    const { seedProbability } = require('./probability')
    seedProbability(db)
    console.log('[Math Seed] Probability seeded')
  } catch { console.log('[Math Seed] Probability seed not yet available') }

  try {
    const { seedNeuralNetworks } = require('./neural-networks')
    seedNeuralNetworks(db)
    console.log('[Math Seed] Neural Networks seeded')
  } catch { console.log('[Math Seed] Neural Networks seed not yet available') }

  try {
    const { seedDeepLearning } = require('./deep-learning')
    seedDeepLearning(db)
    console.log('[Math Seed] Deep Learning seeded')
  } catch { console.log('[Math Seed] Deep Learning seed not yet available') }

  console.log('[Math Seed] Done')
}
