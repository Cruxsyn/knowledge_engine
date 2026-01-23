import { query, queryOne, execute } from '../database'
import { generateId } from '@/lib/utils'
import type { Capture, CaptureType, CaptureStatus, Priority, CreateCapture } from '@/types'

interface CaptureRow {
  id: string
  title: string
  type: string
  source_id: string | null
  content: string
  why_saved: string | null
  topic: string | null
  priority: string
  status: string
  created_at: string
  updated_at: string
  source_url?: string | null
  source_title?: string | null
  source_type?: string | null
}

function rowToCapture(row: CaptureRow): Capture {
  const capture: Capture = {
    id: row.id,
    title: row.title,
    type: row.type as CaptureType,
    source_id: row.source_id || undefined,
    content: row.content,
    why_saved: row.why_saved || undefined,
    topic: row.topic || undefined,
    priority: row.priority as Priority,
    status: row.status as CaptureStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }

  if (row.source_id && row.source_url !== undefined) {
    capture.source = {
      id: row.source_id,
      url: row.source_url || undefined,
      title: row.source_title || '',
      type: row.source_type || 'other',
      created_at: row.created_at,
    }
  }

  return capture
}

export function getAllCaptures(): Capture[] {
  const rows = query<CaptureRow>(`
    SELECT c.*, s.url as source_url, s.title as source_title, s.type as source_type
    FROM captures c
    LEFT JOIN sources s ON c.source_id = s.id
    ORDER BY c.created_at DESC
  `)
  return rows.map(rowToCapture)
}

export function getCapturesByStatus(status: CaptureStatus): Capture[] {
  const rows = query<CaptureRow>(`
    SELECT c.*, s.url as source_url, s.title as source_title, s.type as source_type
    FROM captures c
    LEFT JOIN sources s ON c.source_id = s.id
    WHERE c.status = ?
    ORDER BY c.created_at DESC
  `, [status])
  return rows.map(rowToCapture)
}

export function getCapturesByPriority(priority: Priority): Capture[] {
  const rows = query<CaptureRow>(`
    SELECT c.*, s.url as source_url, s.title as source_title, s.type as source_type
    FROM captures c
    LEFT JOIN sources s ON c.source_id = s.id
    WHERE c.priority = ?
    ORDER BY c.created_at DESC
  `, [priority])
  return rows.map(rowToCapture)
}

export function getCaptureById(id: string): Capture | null {
  const row = queryOne<CaptureRow>(`
    SELECT c.*, s.url as source_url, s.title as source_title, s.type as source_type
    FROM captures c
    LEFT JOIN sources s ON c.source_id = s.id
    WHERE c.id = ?
  `, [id])
  return row ? rowToCapture(row) : null
}

export function createCapture(data: CreateCapture): Capture {
  const id = generateId()
  const now = new Date().toISOString()
  
  let sourceId: string | null = null
  
  // Create source if URL provided
  if (data.source_url) {
    sourceId = generateId()
    execute(`
      INSERT INTO sources (id, url, title, type, created_at)
      VALUES (?, ?, ?, 'url', ?)
    `, [sourceId, data.source_url, data.title, now])
  }
  
  execute(`
    INSERT INTO captures (id, title, type, source_id, content, why_saved, topic, priority, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)
  `, [id, data.title, data.type, sourceId, data.content, data.why_saved || null, data.topic || null, data.priority, now, now])
  
  return getCaptureById(id)!
}

export function updateCapture(id: string, updates: Partial<Omit<Capture, 'id' | 'created_at'>>): Capture | null {
  const existing = getCaptureById(id)
  if (!existing) return null
  
  const now = new Date().toISOString()
  const fields: string[] = ['updated_at = ?']
  const values: (string | number | null)[] = [now]
  
  if (updates.title !== undefined) {
    fields.push('title = ?')
    values.push(updates.title)
  }
  if (updates.type !== undefined) {
    fields.push('type = ?')
    values.push(updates.type)
  }
  if (updates.content !== undefined) {
    fields.push('content = ?')
    values.push(updates.content)
  }
  if (updates.why_saved !== undefined) {
    fields.push('why_saved = ?')
    values.push(updates.why_saved)
  }
  if (updates.topic !== undefined) {
    fields.push('topic = ?')
    values.push(updates.topic)
  }
  if (updates.priority !== undefined) {
    fields.push('priority = ?')
    values.push(updates.priority)
  }
  if (updates.status !== undefined) {
    fields.push('status = ?')
    values.push(updates.status)
  }
  
  values.push(id)
  execute(`UPDATE captures SET ${fields.join(', ')} WHERE id = ?`, values)
  
  return getCaptureById(id)
}

export function updateCaptureStatus(id: string, status: CaptureStatus): Capture | null {
  return updateCapture(id, { status })
}

export function deleteCapture(id: string): boolean {
  const existing = getCaptureById(id)
  if (!existing) return false
  
  execute('DELETE FROM captures WHERE id = ?', [id])
  return true
}

export function getCaptureCounts(): Record<CaptureStatus, number> {
  const results = query<{ status: string; count: number }>(`
    SELECT status, COUNT(*) as count
    FROM captures
    GROUP BY status
  `)
  
  const counts: Record<CaptureStatus, number> = {
    new: 0,
    processing: 0,
    distilled: 0,
    linked: 0,
    published: 0,
  }
  
  for (const row of results) {
    counts[row.status as CaptureStatus] = row.count
  }
  
  return counts
}

export function searchCaptures(searchTerm: string): Capture[] {
  const pattern = `%${searchTerm}%`
  const rows = query<CaptureRow>(`
    SELECT c.*, s.url as source_url, s.title as source_title, s.type as source_type
    FROM captures c
    LEFT JOIN sources s ON c.source_id = s.id
    WHERE c.title LIKE ? 
       OR c.content LIKE ? 
       OR c.why_saved LIKE ? 
       OR c.topic LIKE ?
    ORDER BY c.created_at DESC
  `, [pattern, pattern, pattern, pattern])
  return rows.map(rowToCapture)
}
