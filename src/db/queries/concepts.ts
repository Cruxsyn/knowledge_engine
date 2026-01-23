import { query, queryOne, execute, transaction } from '../database'
import { generateId } from '@/lib/utils'
import type { Concept, MasteryLevel, CreateConcept, Link, RelationshipType } from '@/types'

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

interface LinkRow {
  id: string
  source_id: string
  target_id: string
  relationship: string
  reason: string | null
  created_at: string
}

interface NoteRow {
  id: string
  title: string
  summary: string
  key_claim: string
  example: string | null
  confidence: number
  created_at: string
  updated_at: string
  last_reviewed: string | null
}

function rowToConcept(row: ConceptRow): Concept {
  return {
    id: row.id,
    name: row.name,
    definition: row.definition,
    intuition: row.intuition || undefined,
    pitfalls: row.pitfalls || undefined,
    mastery: row.mastery as MasteryLevel,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function getAllConcepts(): Concept[] {
  const rows = query<ConceptRow>(`
    SELECT * FROM concepts
    ORDER BY name ASC
  `)
  return rows.map(rowToConcept)
}

export function getConceptsByMastery(mastery: MasteryLevel): Concept[] {
  const rows = query<ConceptRow>(`
    SELECT * FROM concepts
    WHERE mastery = ?
    ORDER BY name ASC
  `, [mastery])
  return rows.map(rowToConcept)
}

export function getConceptById(id: string): Concept | null {
  const row = queryOne<ConceptRow>(`
    SELECT * FROM concepts WHERE id = ?
  `, [id])
  
  if (!row) return null
  
  const concept = rowToConcept(row)
  
  // Get prerequisites (concepts this depends on)
  const prereqRows = query<ConceptRow>(`
    SELECT c.* FROM concepts c
    INNER JOIN links l ON c.id = l.target_id
    WHERE l.source_id = ? AND l.relationship IN ('prerequisite_of', 'depends_on')
  `, [id])
  concept.prerequisites = prereqRows.map(rowToConcept)
  
  // Get dependents (concepts that depend on this)
  const dependentRows = query<ConceptRow>(`
    SELECT c.* FROM concepts c
    INNER JOIN links l ON c.id = l.source_id
    WHERE l.target_id = ? AND l.relationship IN ('prerequisite_of', 'depends_on')
  `, [id])
  concept.dependents = dependentRows.map(rowToConcept)
  
  // Get linked notes
  const noteRows = query<NoteRow>(`
    SELECT n.* FROM atomic_notes n
    INNER JOIN concept_notes cn ON n.id = cn.note_id
    WHERE cn.concept_id = ?
  `, [id])
  concept.notes = noteRows.map(n => ({
    id: n.id,
    title: n.title,
    summary: n.summary,
    key_claim: n.key_claim,
    example: n.example || undefined,
    confidence: n.confidence,
    created_at: n.created_at,
    updated_at: n.updated_at,
    last_reviewed: n.last_reviewed || undefined,
  }))
  
  return concept
}

export function getConceptByName(name: string): Concept | null {
  const row = queryOne<ConceptRow>(`
    SELECT * FROM concepts WHERE name = ?
  `, [name])
  return row ? rowToConcept(row) : null
}

export function createConcept(data: CreateConcept): Concept {
  const id = generateId()
  const now = new Date().toISOString()
  
  transaction(() => {
    execute(`
      INSERT INTO concepts (id, name, definition, intuition, pitfalls, mastery, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'unknown', ?, ?)
    `, [id, data.name, data.definition, data.intuition || null, data.pitfalls || null, now, now])
    
    // Create prerequisite links if provided
    if (data.prerequisite_ids && data.prerequisite_ids.length > 0) {
      for (const prereqId of data.prerequisite_ids) {
        const linkId = generateId()
        execute(`
          INSERT INTO links (id, source_id, target_id, relationship, created_at)
          VALUES (?, ?, ?, 'depends_on', ?)
        `, [linkId, id, prereqId, now])
      }
    }
  })
  
  return getConceptById(id)!
}

export function updateConcept(id: string, updates: Partial<Omit<Concept, 'id' | 'created_at' | 'prerequisites' | 'dependents' | 'notes'>>): Concept | null {
  const existing = getConceptById(id)
  if (!existing) return null
  
  const now = new Date().toISOString()
  const fields: string[] = ['updated_at = ?']
  const values: (string | number | null)[] = [now]
  
  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.definition !== undefined) {
    fields.push('definition = ?')
    values.push(updates.definition)
  }
  if (updates.intuition !== undefined) {
    fields.push('intuition = ?')
    values.push(updates.intuition)
  }
  if (updates.pitfalls !== undefined) {
    fields.push('pitfalls = ?')
    values.push(updates.pitfalls)
  }
  if (updates.mastery !== undefined) {
    fields.push('mastery = ?')
    values.push(updates.mastery)
  }
  
  values.push(id)
  execute(`UPDATE concepts SET ${fields.join(', ')} WHERE id = ?`, values)
  
  return getConceptById(id)
}

export function updateMastery(id: string, mastery: MasteryLevel): Concept | null {
  return updateConcept(id, { mastery })
}

export function deleteConcept(id: string): boolean {
  const existing = getConceptById(id)
  if (!existing) return false
  
  execute('DELETE FROM concepts WHERE id = ?', [id])
  return true
}

export function getConceptLinks(conceptId: string): Link[] {
  const rows = query<LinkRow>(`
    SELECT * FROM links
    WHERE source_id = ? OR target_id = ?
    ORDER BY created_at DESC
  `, [conceptId, conceptId])
  
  return rows.map(row => ({
    id: row.id,
    source_id: row.source_id,
    target_id: row.target_id,
    relationship: row.relationship as RelationshipType,
    reason: row.reason || undefined,
    created_at: row.created_at,
  }))
}

export function searchConcepts(searchTerm: string): Concept[] {
  const pattern = `%${searchTerm}%`
  const rows = query<ConceptRow>(`
    SELECT * FROM concepts
    WHERE name LIKE ?
       OR definition LIKE ?
       OR intuition LIKE ?
       OR pitfalls LIKE ?
    ORDER BY name ASC
  `, [pattern, pattern, pattern, pattern])
  return rows.map(rowToConcept)
}

export function getConceptCounts(): Record<MasteryLevel, number> {
  const results = query<{ mastery: string; count: number }>(`
    SELECT mastery, COUNT(*) as count
    FROM concepts
    GROUP BY mastery
  `)
  
  const counts: Record<MasteryLevel, number> = {
    unknown: 0,
    learning: 0,
    solid: 0,
    teachable: 0,
  }
  
  for (const row of results) {
    counts[row.mastery as MasteryLevel] = row.count
  }
  
  return counts
}

export function getConceptsWithoutPrerequisites(): Concept[] {
  const rows = query<ConceptRow>(`
    SELECT c.* FROM concepts c
    WHERE NOT EXISTS (
      SELECT 1 FROM links l 
      WHERE l.source_id = c.id 
      AND l.relationship IN ('prerequisite_of', 'depends_on')
    )
    ORDER BY name ASC
  `)
  return rows.map(rowToConcept)
}

export function getConceptsWithoutExamples(): Concept[] {
  const rows = query<ConceptRow>(`
    SELECT c.* FROM concepts c
    WHERE NOT EXISTS (
      SELECT 1 FROM concept_notes cn WHERE cn.concept_id = c.id
    )
    ORDER BY name ASC
  `)
  return rows.map(rowToConcept)
}
