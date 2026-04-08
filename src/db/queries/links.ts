import { query, queryOne, execute } from '../database'
import { generateId } from '@/lib/utils'
import type { Link, RelationshipType, CreateLink } from '@/types'

interface LinkRow {
  id: string
  source_id: string
  target_id: string
  relationship: string
  reason: string | null
  created_at: string
}

function rowToLink(row: LinkRow): Link {
  return {
    id: row.id,
    source_id: row.source_id,
    target_id: row.target_id,
    relationship: row.relationship as RelationshipType,
    reason: row.reason || undefined,
    created_at: row.created_at,
  }
}

export async function getAllLinks(): Promise<Link[]> {
  const rows = await query<LinkRow>(`
    SELECT * FROM links
    ORDER BY created_at DESC
  `)
  return rows.map(rowToLink)
}

export async function getLinkById(id: string): Promise<Link | null> {
  const row = await queryOne<LinkRow>(`
    SELECT * FROM links WHERE id = ?
  `, [id])
  return row ? rowToLink(row) : null
}

export async function getLinksBySource(sourceId: string): Promise<Link[]> {
  const rows = await query<LinkRow>(`
    SELECT * FROM links
    WHERE source_id = ?
    ORDER BY created_at DESC
  `, [sourceId])
  return rows.map(rowToLink)
}

export async function getLinksByTarget(targetId: string): Promise<Link[]> {
  const rows = await query<LinkRow>(`
    SELECT * FROM links
    WHERE target_id = ?
    ORDER BY created_at DESC
  `, [targetId])
  return rows.map(rowToLink)
}

export async function getLinksByRelationship(relationship: RelationshipType): Promise<Link[]> {
  const rows = await query<LinkRow>(`
    SELECT * FROM links
    WHERE relationship = ?
    ORDER BY created_at DESC
  `, [relationship])
  return rows.map(rowToLink)
}

export async function getLinkBetween(sourceId: string, targetId: string): Promise<Link | null> {
  const row = await queryOne<LinkRow>(`
    SELECT * FROM links
    WHERE source_id = ? AND target_id = ?
  `, [sourceId, targetId])
  return row ? rowToLink(row) : null
}

export async function createLink(data: CreateLink): Promise<Link> {
  const id = generateId()
  const now = new Date().toISOString()

  await execute(`
    INSERT INTO links (id, source_id, target_id, relationship, reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [id, data.source_id, data.target_id, data.relationship, data.reason || null, now])

  return (await getLinkById(id))!
}

export async function updateLink(id: string, updates: Partial<Omit<Link, 'id' | 'created_at'>>): Promise<Link | null> {
  const existing = await getLinkById(id)
  if (!existing) return null

  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (updates.relationship !== undefined) {
    fields.push('relationship = ?')
    values.push(updates.relationship)
  }
  if (updates.reason !== undefined) {
    fields.push('reason = ?')
    values.push(updates.reason || null)
  }

  if (fields.length === 0) return existing

  values.push(id)
  await execute(`UPDATE links SET ${fields.join(', ')} WHERE id = ?`, values)

  return getLinkById(id)
}

export async function deleteLink(id: string): Promise<boolean> {
  const existing = await getLinkById(id)
  if (!existing) return false

  await execute('DELETE FROM links WHERE id = ?', [id])
  return true
}

export async function deleteLinkBetween(sourceId: string, targetId: string): Promise<boolean> {
  const existing = await getLinkBetween(sourceId, targetId)
  if (!existing) return false

  await execute('DELETE FROM links WHERE source_id = ? AND target_id = ?', [sourceId, targetId])
  return true
}

export async function getGraphData(): Promise<{ nodes: string[]; edges: Array<{ from: string; to: string; relationship: string }> }> {
  const nodes = await query<{ id: string }>('SELECT id FROM concepts')
  const edges = await query<LinkRow>('SELECT * FROM links')

  return {
    nodes: nodes.map(n => n.id),
    edges: edges.map(e => ({
      from: e.source_id,
      to: e.target_id,
      relationship: e.relationship,
    })),
  }
}

export async function getLinkCounts(): Promise<Record<RelationshipType, number>> {
  const results = await query<{ relationship: string; count: number }>(`
    SELECT relationship, COUNT(*) as count
    FROM links
    GROUP BY relationship
  `)

  const counts: Record<RelationshipType, number> = {
    prerequisite_of: 0,
    depends_on: 0,
    explains: 0,
    contradicts: 0,
    refines: 0,
    example_of: 0,
    used_in: 0,
  }

  for (const row of results) {
    counts[row.relationship as RelationshipType] = row.count
  }

  return counts
}
