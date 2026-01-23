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
  // Try to parse content as JSON
  if (row.content && row.content !== '{}') {
    try {
      return JSON.parse(row.content)
    } catch {
      // Fall through to legacy handling
    }
  }
  
  // Legacy migration: convert old fields to new content format
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

export function getAllNotes(): AtomicNote[] {
  const rows = query<NoteRow>(`
    SELECT * FROM atomic_notes
    ORDER BY created_at DESC
  `)
  return rows.map(row => rowToNote(row))
}

export function getNoteById(id: string): AtomicNote | null {
  const row = queryOne<NoteRow>(`
    SELECT * FROM atomic_notes WHERE id = ?
  `, [id])
  
  if (!row) return null
  
  // Get linked concepts
  const conceptRows = query<ConceptRow>(`
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

export function getNotesByConfidence(minConfidence: number, maxConfidence: number = 5): AtomicNote[] {
  const rows = query<NoteRow>(`
    SELECT * FROM atomic_notes
    WHERE confidence >= ? AND confidence <= ?
    ORDER BY confidence ASC, created_at DESC
  `, [minConfidence, maxConfidence])
  return rows.map(row => rowToNote(row))
}

export function getRecentNotes(limit: number = 10): AtomicNote[] {
  const rows = query<NoteRow>(`
    SELECT * FROM atomic_notes
    ORDER BY created_at DESC
    LIMIT ?
  `, [limit])
  return rows.map(row => rowToNote(row))
}

export function getNotesNeedingReview(days: number = 7): AtomicNote[] {
  const rows = query<NoteRow>(`
    SELECT * FROM atomic_notes
    WHERE last_reviewed IS NULL 
       OR datetime(last_reviewed) < datetime('now', '-' || ? || ' days')
    ORDER BY last_reviewed ASC NULLS FIRST, created_at ASC
  `, [days])
  return rows.map(row => rowToNote(row))
}

export function createNote(data: CreateAtomicNote): AtomicNote {
  const id = generateId()
  const now = new Date().toISOString()
  const noteType = data.note_type || 'other'
  const contentJson = JSON.stringify(data.content)
  
  transaction(() => {
    execute(`
      INSERT INTO atomic_notes (id, title, note_type, content, confidence, source_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, data.title, noteType, contentJson, data.confidence, data.source_id || null, now, now])
    
    // Link concepts if provided
    if (data.concept_ids && data.concept_ids.length > 0) {
      for (const conceptId of data.concept_ids) {
        execute(`
          INSERT OR IGNORE INTO concept_notes (concept_id, note_id)
          VALUES (?, ?)
        `, [conceptId, id])
      }
    }
  })
  
  return getNoteById(id)!
}

export function updateNote(id: string, updates: Partial<Omit<AtomicNote, 'id' | 'created_at' | 'concepts'>>): AtomicNote | null {
  const existing = getNoteById(id)
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
  execute(`UPDATE atomic_notes SET ${fields.join(', ')} WHERE id = ?`, values)
  
  return getNoteById(id)
}

export function markNoteReviewed(id: string): AtomicNote | null {
  return updateNote(id, { last_reviewed: new Date().toISOString() })
}

export function deleteNote(id: string): boolean {
  const existing = getNoteById(id)
  if (!existing) return false
  
  execute('DELETE FROM atomic_notes WHERE id = ?', [id])
  return true
}

export function linkNoteToConcept(noteId: string, conceptId: string): void {
  execute(`
    INSERT OR IGNORE INTO concept_notes (concept_id, note_id)
    VALUES (?, ?)
  `, [conceptId, noteId])
}

export function unlinkNoteFromConcept(noteId: string, conceptId: string): void {
  execute(`
    DELETE FROM concept_notes
    WHERE concept_id = ? AND note_id = ?
  `, [conceptId, noteId])
}

export function searchNotes(searchTerm: string): AtomicNote[] {
  const pattern = `%${searchTerm}%`
  const rows = query<NoteRow>(`
    SELECT * FROM atomic_notes
    WHERE title LIKE ?
       OR content LIKE ?
    ORDER BY created_at DESC
  `, [pattern, pattern])
  return rows.map(row => rowToNote(row))
}

export function getNoteCounts(): { total: number; lowConfidence: number; needsReview: number } {
  const total = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM atomic_notes')?.count || 0
  const lowConfidence = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM atomic_notes WHERE confidence <= 2')?.count || 0
  const needsReview = queryOne<{ count: number }>(`
    SELECT COUNT(*) as count FROM atomic_notes 
    WHERE last_reviewed IS NULL 
       OR datetime(last_reviewed) < datetime('now', '-7 days')
  `)?.count || 0
  
  return { total, lowConfidence, needsReview }
}
