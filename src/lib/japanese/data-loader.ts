import { transaction, query } from '@/db/database'
import { generateId } from '@/lib/utils'

// ── Import types ─────────────────────────────────────────────────────────────

export interface KanjiImportEntry {
  character: string
  meanings: string[]
  on_readings?: string[]
  kun_readings?: string[]
  stroke_count: number
  jlpt_level: number
  grade?: number
  frequency_rank?: number
  sort_order?: number
}

export interface VocabImportEntry {
  word: string
  reading: string
  meanings: string[]
  part_of_speech?: string
  jlpt_level?: number
  frequency_rank?: number
}

// ── Import functions ─────────────────────────────────────────────────────────

/**
 * Import a batch of kanji data into the database.
 * Used for loading JLPT-level data packs.
 * Skips entries that already exist (by character).
 */
export async function importKanjiData(kanjiEntries: KanjiImportEntry[]): Promise<number> {
  // First, find which characters already exist
  const existingRows = await query<{ character: string }>('SELECT character FROM jp_kanji')
  const existingChars = new Set(existingRows.map(r => r.character))

  const statements: Array<{ sql: string; params?: unknown[] }> = []
  let imported = 0

  for (const entry of kanjiEntries) {
    if (existingChars.has(entry.character)) continue

    const id = generateId()
    statements.push({
      sql: `INSERT INTO jp_kanji (id, character, meanings, on_readings, kun_readings, stroke_count, jlpt_level, grade, frequency_rank, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        id, entry.character, JSON.stringify(entry.meanings),
        JSON.stringify(entry.on_readings || []), JSON.stringify(entry.kun_readings || []),
        entry.stroke_count, entry.jlpt_level, entry.grade ?? null,
        entry.frequency_rank ?? null, entry.sort_order || 0,
      ],
    })
    statements.push({
      sql: `INSERT INTO jp_srs_cards (id, item_id, item_type, card_type, due) VALUES (?, ?, 'kanji', 'meaning', datetime('now'))`,
      params: [generateId(), id],
    })
    statements.push({
      sql: `INSERT INTO jp_srs_cards (id, item_id, item_type, card_type, due) VALUES (?, ?, 'kanji', 'reading', datetime('now'))`,
      params: [generateId(), id],
    })
    imported++
  }

  if (statements.length > 0) {
    await transaction(statements)
  }

  return imported
}

/**
 * Import vocabulary data.
 * Skips entries that already exist (by word + reading).
 */
export async function importVocabData(vocabEntries: VocabImportEntry[]): Promise<number> {
  // First, find which words already exist
  const existingRows = await query<{ word: string; reading: string }>('SELECT word, reading FROM jp_vocabulary')
  const existingKeys = new Set(existingRows.map(r => `${r.word}|${r.reading}`))

  const statements: Array<{ sql: string; params?: unknown[] }> = []
  let imported = 0

  for (const entry of vocabEntries) {
    if (existingKeys.has(`${entry.word}|${entry.reading}`)) continue

    const id = generateId()
    statements.push({
      sql: `INSERT INTO jp_vocabulary (id, word, reading, meanings, part_of_speech, jlpt_level, frequency_rank)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      params: [
        id, entry.word, entry.reading, JSON.stringify(entry.meanings),
        entry.part_of_speech ?? null, entry.jlpt_level ?? null, entry.frequency_rank ?? null,
      ],
    })
    statements.push({
      sql: `INSERT INTO jp_srs_cards (id, item_id, item_type, card_type, due) VALUES (?, ?, 'vocab', 'meaning', datetime('now'))`,
      params: [generateId(), id],
    })
    imported++
  }

  if (statements.length > 0) {
    await transaction(statements)
  }

  return imported
}

/**
 * Load a JSON expansion pack from a URL and import its data.
 * Expected format: { kanji?: KanjiImportEntry[], vocabulary?: VocabImportEntry[] }
 */
export async function loadExpansionPack(
  url: string
): Promise<{ kanji: number; vocab: number }> {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`Failed to fetch expansion pack: ${resp.statusText}`)

  const data = (await resp.json()) as {
    kanji?: KanjiImportEntry[]
    vocabulary?: VocabImportEntry[]
  }

  const kanjiCount = data.kanji ? await importKanjiData(data.kanji) : 0
  const vocabCount = data.vocabulary ? await importVocabData(data.vocabulary) : 0

  console.log(`[data-loader] Imported ${kanjiCount} kanji, ${vocabCount} vocab from ${url}`)
  return { kanji: kanjiCount, vocab: vocabCount }
}

/**
 * Get import status (how many items exist per JLPT level).
 */
export async function getImportStatus(): Promise<{ level: number; kanji: number; vocab: number }[]> {
  const levels = [5, 4, 3, 2, 1]
  const result: { level: number; kanji: number; vocab: number }[] = []

  for (const level of levels) {
    const kanjiRows = await query<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM jp_kanji WHERE jlpt_level = ?',
      [level]
    )
    const vocabRows = await query<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM jp_vocabulary WHERE jlpt_level = ?',
      [level]
    )

    result.push({
      level,
      kanji: kanjiRows[0]?.cnt ?? 0,
      vocab: vocabRows[0]?.cnt ?? 0,
    })
  }

  return result
}
