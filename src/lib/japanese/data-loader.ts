import { execute, transaction, query } from '@/db/database'
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
export function importKanjiData(kanjiEntries: KanjiImportEntry[]): number {
  let imported = 0
  transaction(() => {
    for (const entry of kanjiEntries) {
      const existing = query<{ id: string }>('SELECT id FROM jp_kanji WHERE character = ?', [entry.character])
      if (existing.length > 0) continue

      const id = generateId()
      execute(
        `INSERT INTO jp_kanji (id, character, meanings, on_readings, kun_readings, stroke_count, jlpt_level, grade, frequency_rank, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          entry.character,
          JSON.stringify(entry.meanings),
          JSON.stringify(entry.on_readings || []),
          JSON.stringify(entry.kun_readings || []),
          entry.stroke_count,
          entry.jlpt_level,
          entry.grade ?? null,
          entry.frequency_rank ?? null,
          entry.sort_order || 0,
        ]
      )

      // Create SRS cards for this kanji
      execute(
        `INSERT INTO jp_srs_cards (id, item_id, item_type, card_type, due) VALUES (?, ?, 'kanji', 'meaning', datetime('now'))`,
        [generateId(), id]
      )
      execute(
        `INSERT INTO jp_srs_cards (id, item_id, item_type, card_type, due) VALUES (?, ?, 'kanji', 'reading', datetime('now'))`,
        [generateId(), id]
      )

      imported++
    }
  })
  return imported
}

/**
 * Import vocabulary data.
 * Skips entries that already exist (by word + reading).
 */
export function importVocabData(vocabEntries: VocabImportEntry[]): number {
  let imported = 0
  transaction(() => {
    for (const entry of vocabEntries) {
      const existing = query<{ id: string }>(
        'SELECT id FROM jp_vocabulary WHERE word = ? AND reading = ?',
        [entry.word, entry.reading]
      )
      if (existing.length > 0) continue

      const id = generateId()
      execute(
        `INSERT INTO jp_vocabulary (id, word, reading, meanings, part_of_speech, jlpt_level, frequency_rank)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          entry.word,
          entry.reading,
          JSON.stringify(entry.meanings),
          entry.part_of_speech ?? null,
          entry.jlpt_level ?? null,
          entry.frequency_rank ?? null,
        ]
      )

      // Create SRS card
      execute(
        `INSERT INTO jp_srs_cards (id, item_id, item_type, card_type, due) VALUES (?, ?, 'vocab', 'meaning', datetime('now'))`,
        [generateId(), id]
      )

      imported++
    }
  })
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

  const kanjiCount = data.kanji ? importKanjiData(data.kanji) : 0
  const vocabCount = data.vocabulary ? importVocabData(data.vocabulary) : 0

  console.log(`[data-loader] Imported ${kanjiCount} kanji, ${vocabCount} vocab from ${url}`)
  return { kanji: kanjiCount, vocab: vocabCount }
}

/**
 * Get import status (how many items exist per JLPT level).
 */
export function getImportStatus(): { level: number; kanji: number; vocab: number }[] {
  const levels = [5, 4, 3, 2, 1]
  const result: { level: number; kanji: number; vocab: number }[] = []

  for (const level of levels) {
    const kanjiRows = query<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM jp_kanji WHERE jlpt_level = ?',
      [level]
    )
    const vocabRows = query<{ cnt: number }>(
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
