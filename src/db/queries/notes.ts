import { query, queryOne, execute, transaction } from '../database'
import { generateId } from '@/lib/utils'
import type { AtomicNote, CreateAtomicNote, Concept, NoteType, NoteContent } from '@/types'

interface NoteRow {
  id: string
  title: string
  note_type: string
  content: string
  confidence: number
  source_id: string | null
  created_at: string
  updated_at: string
  last_reviewed: string | null
  // Legacy fields for migration
  summary?: string
  key_claim?: string
  example?: string | null
}

interface ConceptRow {
  id: string
  name: string
  definition: string
  intuition: string | null
  pitfalls: string | null
  mastery: string
  created_at: string
  updated_at: string
}

function parseContent(row: NoteRow): NoteContent {
  if (row.content && row.content !== '{}') {
    try {
      return JSON.parse(row.content)
    } catch {
      // Fall through to legacy handling
    }
  }

  if (row.summary || row.key_claim) {
    return {
      summary: row.summary || '',
      key_claim: row.key_claim || '',
      example: row.example || undefined,
    }
  }

  return { summary: '', key_claim: '' }
}

function rowToNote(row: NoteRow, concepts?: Concept[]): AtomicNote {
  return {
    id: row.id,
    title: row.title,
    note_type: (row.note_type || 'other') as NoteType,
    content: parseContent(row),
    confidence: row.confidence,
    source_id: row.source_id || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_reviewed: row.last_reviewed || undefined,
    concepts,
  }
}

export async function getAllNotes(): Promise<AtomicNote[]> {
  const rows = await query<NoteRow>(`
    SELECT * FROM atomic_notes
    ORDER BY created_at DESC
  `)

  const conceptLinks = await query<{ note_id: string; concept_id: string; name: string; definition: string; intuition: string | null; pitfalls: string | null; mastery: string; created_at: string; updated_at: string }>(`
    SELECT cn.note_id, c.id as concept_id, c.name, c.definition, c.intuition, c.pitfalls, c.mastery, c.created_at, c.updated_at
    FROM concept_notes cn
    INNER JOIN concepts c ON c.id = cn.concept_id
  `)

  const conceptsByNoteId = new Map<string, Concept[]>()
  for (const link of conceptLinks) {
    const concepts = conceptsByNoteId.get(link.note_id) || []
    concepts.push({
      id: link.concept_id,
      name: link.name,
      definition: link.definition,
      intuition: link.intuition || undefined,
      pitfalls: link.pitfalls || undefined,
      mastery: link.mastery as Concept['mastery'],
      created_at: link.created_at,
      updated_at: link.updated_at,
    })
    conceptsByNoteId.set(link.note_id, concepts)
  }

  return rows.map(row => rowToNote(row, conceptsByNoteId.get(row.id)))
}

export async function getNoteById(id: string): Promise<AtomicNote | null> {
  const row = await queryOne<NoteRow>(`
    SELECT * FROM atomic_notes WHERE id = ?
  `, [id])

  if (!row) return null

  const conceptRows = await query<ConceptRow>(`
    SELECT c.* FROM concepts c
    INNER JOIN concept_notes cn ON c.id = cn.concept_id
    WHERE cn.note_id = ?
  `, [id])

  const concepts: Concept[] = conceptRows.map(c => ({
    id: c.id,
    name: c.name,
    definition: c.definition,
    intuition: c.intuition || undefined,
    pitfalls: c.pitfalls || undefined,
    mastery: c.mastery as Concept['mastery'],
    created_at: c.created_at,
    updated_at: c.updated_at,
  }))

  return rowToNote(row, concepts)
}

export async function getNotesByConfidence(minConfidence: number, maxConfidence: number = 5): Promise<AtomicNote[]> {
  const rows = await query<NoteRow>(`
    SELECT * FROM atomic_notes
    WHERE confidence >= ? AND confidence <= ?
    ORDER BY confidence ASC, created_at DESC
  `, [minConfidence, maxConfidence])
  return rows.map(row => rowToNote(row))
}

export async function getRecentNotes(limit: number = 10): Promise<AtomicNote[]> {
  const rows = await query<NoteRow>(`
    SELECT * FROM atomic_notes
    ORDER BY created_at DESC
    LIMIT ?
  `, [limit])
  return rows.map(row => rowToNote(row))
}

export async function getNotesNeedingReview(days: number = 7): Promise<AtomicNote[]> {
  const rows = await query<NoteRow>(`
    SELECT * FROM atomic_notes
    WHERE last_reviewed IS NULL
       OR datetime(last_reviewed) < datetime('now', '-' || ? || ' days')
    ORDER BY last_reviewed ASC NULLS FIRST, created_at ASC
  `, [days])
  return rows.map(row => rowToNote(row))
}

export async function createNote(data: CreateAtomicNote): Promise<AtomicNote> {
  const id = generateId()
  const now = new Date().toISOString()
  const noteType = data.note_type || 'other'
  const contentJson = JSON.stringify(data.content)

  const statements: Array<{ sql: string; params?: unknown[] }> = [
    {
      sql: `INSERT INTO atomic_notes (id, title, note_type, content, confidence, source_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [id, data.title, noteType, contentJson, data.confidence, data.source_id || null, now, now],
    },
  ]

  if (data.concept_ids && data.concept_ids.length > 0) {
    for (const conceptId of data.concept_ids) {
      statements.push({
        sql: `INSERT OR IGNORE INTO concept_notes (concept_id, note_id) VALUES (?, ?)`,
        params: [conceptId, id],
      })
    }
  }

  await transaction(statements)

  return (await getNoteById(id))!
}

export async function updateNote(id: string, updates: Partial<Omit<AtomicNote, 'id' | 'created_at' | 'concepts'>>): Promise<AtomicNote | null> {
  const existing = await getNoteById(id)
  if (!existing) return null

  const now = new Date().toISOString()
  const fields: string[] = ['updated_at = ?']
  const values: (string | number | null)[] = [now]

  if (updates.title !== undefined) {
    fields.push('title = ?')
    values.push(updates.title)
  }
  if (updates.note_type !== undefined) {
    fields.push('note_type = ?')
    values.push(updates.note_type)
  }
  if (updates.content !== undefined) {
    fields.push('content = ?')
    values.push(JSON.stringify(updates.content))
  }
  if (updates.confidence !== undefined) {
    fields.push('confidence = ?')
    values.push(updates.confidence)
  }
  if (updates.last_reviewed !== undefined) {
    fields.push('last_reviewed = ?')
    values.push(updates.last_reviewed)
  }

  values.push(id)
  await execute(`UPDATE atomic_notes SET ${fields.join(', ')} WHERE id = ?`, values)

  return getNoteById(id)
}

export async function markNoteReviewed(id: string): Promise<AtomicNote | null> {
  return updateNote(id, { last_reviewed: new Date().toISOString() })
}

export async function deleteNote(id: string): Promise<boolean> {
  const existing = await getNoteById(id)
  if (!existing) return false

  await execute('DELETE FROM atomic_notes WHERE id = ?', [id])
  return true
}

export async function linkNoteToConcept(noteId: string, conceptId: string): Promise<void> {
  await execute(`
    INSERT OR IGNORE INTO concept_notes (concept_id, note_id)
    VALUES (?, ?)
  `, [conceptId, noteId])
}

export async function unlinkNoteFromConcept(noteId: string, conceptId: string): Promise<void> {
  await execute(`
    DELETE FROM concept_notes
    WHERE concept_id = ? AND note_id = ?
  `, [conceptId, noteId])
}

export async function searchNotes(searchTerm: string): Promise<AtomicNote[]> {
  const pattern = `%${searchTerm}%`
  const rows = await query<NoteRow>(`
    SELECT * FROM atomic_notes
    WHERE title LIKE ?
       OR content LIKE ?
    ORDER BY created_at DESC
  `, [pattern, pattern])
  return rows.map(row => rowToNote(row))
}

export async function getNotesByType(noteType: NoteType): Promise<AtomicNote[]> {
  const rows = await query<NoteRow>(`
    SELECT * FROM atomic_notes
    WHERE note_type = ?
    ORDER BY created_at DESC
  `, [noteType])
  return rows.map(row => rowToNote(row))
}

export async function getNoteCounts(): Promise<{ total: number; byType: Record<NoteType, number> }> {
  const totalRow = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM atomic_notes')
  const total = totalRow?.count || 0

  const typeCountRows = await query<{ note_type: string; count: number }>(`
    SELECT note_type, COUNT(*) as count FROM atomic_notes GROUP BY note_type
  `)

  const byType: Record<NoteType, number> = {
    definition: 0,
    idea: 0,
    connection: 0,
    question: 0,
    insight: 0,
    process: 0,
    example: 0,
    other: 0,
  }

  for (const row of typeCountRows) {
    if (row.note_type in byType) {
      byType[row.note_type as NoteType] = row.count
    }
  }

  return { total, byType }
}
