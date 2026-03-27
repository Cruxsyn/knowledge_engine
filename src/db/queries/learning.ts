import { query, queryOne, execute, transaction } from '../database'
import { generateId } from '@/lib/utils'
import type { LearningPath, LearningModule, Lesson, LessonTerm, LessonProgress, LessonStatus } from '@/types'

// ---- Row types ----

interface PathRow {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
}

interface ModuleRow {
  id: string
  path_id: string
  title: string
  description: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

interface LessonRow {
  id: string
  module_id: string
  title: string
  subtitle: string | null
  content: string
  sort_order: number
  status: string
  estimated_minutes: number | null
  created_at: string
  updated_at: string
}

interface TermRow {
  id: string
  lesson_id: string
  term: string
  definition: string
  concept_id: string | null
}

interface ProgressRow {
  lesson_id: string
  completed: number
  completed_at: string | null
  scroll_position: number
  updated_at: string
}

// ---- Row converters ----

function rowToPath(row: PathRow): LearningPath {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function rowToModule(row: ModuleRow): LearningModule {
  return {
    id: row.id,
    path_id: row.path_id,
    title: row.title,
    description: row.description || undefined,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function rowToLesson(row: LessonRow): Lesson {
  return {
    id: row.id,
    module_id: row.module_id,
    title: row.title,
    subtitle: row.subtitle || undefined,
    content: row.content,
    sort_order: row.sort_order,
    status: row.status as LessonStatus,
    estimated_minutes: row.estimated_minutes || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function rowToTerm(row: TermRow): LessonTerm {
  return {
    id: row.id,
    lesson_id: row.lesson_id,
    term: row.term,
    definition: row.definition,
    concept_id: row.concept_id || undefined,
  }
}

function rowToProgress(row: ProgressRow): LessonProgress {
  return {
    lesson_id: row.lesson_id,
    completed: row.completed === 1,
    completed_at: row.completed_at || undefined,
    scroll_position: row.scroll_position,
    updated_at: row.updated_at,
  }
}

// ---- Learning Paths ----

export function getAllPaths(): LearningPath[] {
  const rows = query<PathRow>('SELECT * FROM learning_paths ORDER BY updated_at DESC')
  return rows.map(rowToPath)
}

export function getPathById(id: string): LearningPath | null {
  const row = queryOne<PathRow>('SELECT * FROM learning_paths WHERE id = ?', [id])
  return row ? rowToPath(row) : null
}

export function createPath(data: { title: string; description: string }): LearningPath {
  const id = generateId()
  const now = new Date().toISOString()
  execute(
    'INSERT INTO learning_paths (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [id, data.title, data.description, now, now]
  )
  return getPathById(id)!
}

// ---- Learning Modules ----

export function getModulesByPath(pathId: string): LearningModule[] {
  const rows = query<ModuleRow>(
    'SELECT * FROM learning_modules WHERE path_id = ? ORDER BY sort_order ASC',
    [pathId]
  )
  return rows.map(rowToModule)
}

export function getModuleById(id: string): LearningModule | null {
  const row = queryOne<ModuleRow>('SELECT * FROM learning_modules WHERE id = ?', [id])
  return row ? rowToModule(row) : null
}

export function createModule(data: { path_id: string; title: string; description?: string; sort_order: number }): LearningModule {
  const id = generateId()
  const now = new Date().toISOString()
  execute(
    'INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, data.path_id, data.title, data.description || null, data.sort_order, now, now]
  )
  return getModuleById(id)!
}

// ---- Lessons ----

export function getLessonsByModule(moduleId: string): Lesson[] {
  const rows = query<LessonRow>(
    'SELECT * FROM lessons WHERE module_id = ? ORDER BY sort_order ASC',
    [moduleId]
  )
  return rows.map(rowToLesson)
}

export function getLessonById(id: string): Lesson | null {
  const row = queryOne<LessonRow>('SELECT * FROM lessons WHERE id = ?', [id])
  return row ? rowToLesson(row) : null
}

export function getAllLessonsByPath(pathId: string): Lesson[] {
  const rows = query<LessonRow>(`
    SELECT l.* FROM lessons l
    INNER JOIN learning_modules m ON l.module_id = m.id
    WHERE m.path_id = ?
    ORDER BY m.sort_order ASC, l.sort_order ASC
  `, [pathId])
  return rows.map(rowToLesson)
}

export function createLesson(data: {
  module_id: string
  title: string
  subtitle?: string
  content: string
  sort_order: number
  status?: LessonStatus
  estimated_minutes?: number
}): Lesson {
  const id = generateId()
  const now = new Date().toISOString()
  execute(
    `INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.module_id, data.title, data.subtitle || null, data.content, data.sort_order,
     data.status || 'published', data.estimated_minutes || null, now, now]
  )
  return getLessonById(id)!
}

// ---- Lesson Terms ----

export function getTermsByLesson(lessonId: string): LessonTerm[] {
  const rows = query<TermRow>(
    'SELECT * FROM lesson_terms WHERE lesson_id = ?',
    [lessonId]
  )
  return rows.map(rowToTerm)
}

export function createTerm(data: { lesson_id: string; term: string; definition: string; concept_id?: string }): LessonTerm {
  const id = generateId()
  execute(
    'INSERT INTO lesson_terms (id, lesson_id, term, definition, concept_id) VALUES (?, ?, ?, ?, ?)',
    [id, data.lesson_id, data.term, data.definition, data.concept_id || null]
  )
  return { id, ...data }
}

// ---- Lesson Concepts ----

export function addLessonConcept(lessonId: string, conceptId: string): void {
  execute(
    'INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)',
    [lessonId, conceptId]
  )
}

export function getLessonConceptIds(lessonId: string): string[] {
  const rows = query<{ concept_id: string }>(
    'SELECT concept_id FROM lesson_concepts WHERE lesson_id = ?',
    [lessonId]
  )
  return rows.map(r => r.concept_id)
}

// ---- Progress ----

export function getProgress(lessonId: string): LessonProgress | null {
  const row = queryOne<ProgressRow>(
    'SELECT * FROM lesson_progress WHERE lesson_id = ?',
    [lessonId]
  )
  return row ? rowToProgress(row) : null
}

export function getAllProgress(): LessonProgress[] {
  const rows = query<ProgressRow>('SELECT * FROM lesson_progress')
  return rows.map(rowToProgress)
}

export function updateProgress(lessonId: string, updates: { completed?: boolean; scroll_position?: number }): void {
  const now = new Date().toISOString()
  const existing = getProgress(lessonId)

  if (!existing) {
    execute(
      `INSERT INTO lesson_progress (lesson_id, completed, completed_at, scroll_position, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        lessonId,
        updates.completed ? 1 : 0,
        updates.completed ? now : null,
        updates.scroll_position ?? 0,
        now,
      ]
    )
  } else {
    const fields: string[] = ['updated_at = ?']
    const values: (string | number | null)[] = [now]

    if (updates.completed !== undefined) {
      fields.push('completed = ?')
      values.push(updates.completed ? 1 : 0)
      if (updates.completed) {
        fields.push('completed_at = ?')
        values.push(now)
      }
    }
    if (updates.scroll_position !== undefined) {
      fields.push('scroll_position = ?')
      values.push(updates.scroll_position)
    }

    values.push(lessonId)
    execute(`UPDATE lesson_progress SET ${fields.join(', ')} WHERE lesson_id = ?`, values)
  }
}

export function getPathProgress(pathId: string): { total: number; completed: number; percentage: number } {
  const totalRow = queryOne<{ count: number }>(`
    SELECT COUNT(*) as count FROM lessons l
    INNER JOIN learning_modules m ON l.module_id = m.id
    WHERE m.path_id = ?
  `, [pathId])

  const completedRow = queryOne<{ count: number }>(`
    SELECT COUNT(*) as count FROM lesson_progress p
    INNER JOIN lessons l ON p.lesson_id = l.id
    INNER JOIN learning_modules m ON l.module_id = m.id
    WHERE m.path_id = ? AND p.completed = 1
  `, [pathId])

  const total = totalRow?.count ?? 0
  const completed = completedRow?.count ?? 0

  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

// ---- Graph data for learning map ----

export interface LearningGraphNode {
  id: string
  label: string
  moduleTitle: string
  moduleId: string
  completed: boolean
  sortKey: number // module sort_order * 1000 + lesson sort_order
}

export interface LearningGraphEdge {
  from: string
  to: string
}

export function getLearningGraphData(pathId: string): { nodes: LearningGraphNode[]; edges: LearningGraphEdge[] } {
  // Get all lessons with module info and progress
  const nodeRows = query<{
    id: string
    title: string
    module_title: string
    module_id: string
    module_sort: number
    lesson_sort: number
    completed: number | null
  }>(`
    SELECT
      l.id, l.title, m.title as module_title, m.id as module_id,
      m.sort_order as module_sort, l.sort_order as lesson_sort,
      p.completed
    FROM lessons l
    INNER JOIN learning_modules m ON l.module_id = m.id
    LEFT JOIN lesson_progress p ON p.lesson_id = l.id
    WHERE m.path_id = ?
    ORDER BY m.sort_order ASC, l.sort_order ASC
  `, [pathId])

  const nodes: LearningGraphNode[] = nodeRows.map(r => ({
    id: r.id,
    label: r.title,
    moduleTitle: r.module_title,
    moduleId: r.module_id,
    completed: r.completed === 1,
    sortKey: r.module_sort * 1000 + r.lesson_sort,
  }))

  // Build edges: lessons sharing concepts are connected
  const edgeRows = query<{ from_lesson: string; to_lesson: string }>(`
    SELECT DISTINCT lc1.lesson_id as from_lesson, lc2.lesson_id as to_lesson
    FROM lesson_concepts lc1
    INNER JOIN lesson_concepts lc2 ON lc1.concept_id = lc2.concept_id AND lc1.lesson_id < lc2.lesson_id
    INNER JOIN lessons l1 ON lc1.lesson_id = l1.id
    INNER JOIN lessons l2 ON lc2.lesson_id = l2.id
    INNER JOIN learning_modules m1 ON l1.module_id = m1.id
    INNER JOIN learning_modules m2 ON l2.module_id = m2.id
    WHERE m1.path_id = ? AND m2.path_id = ?
  `, [pathId, pathId])

  const edges: LearningGraphEdge[] = edgeRows.map(r => ({
    from: r.from_lesson,
    to: r.to_lesson,
  }))

  // Also add sequential edges within each module
  const moduleGroups = new Map<string, string[]>()
  for (const node of nodes) {
    if (!moduleGroups.has(node.moduleId)) {
      moduleGroups.set(node.moduleId, [])
    }
    moduleGroups.get(node.moduleId)!.push(node.id)
  }

  for (const lessonIds of moduleGroups.values()) {
    for (let i = 0; i < lessonIds.length - 1; i++) {
      // Only add if not already present
      const exists = edges.some(e =>
        (e.from === lessonIds[i] && e.to === lessonIds[i + 1]) ||
        (e.from === lessonIds[i + 1] && e.to === lessonIds[i])
      )
      if (!exists) {
        edges.push({ from: lessonIds[i], to: lessonIds[i + 1] })
      }
    }
  }

  return { nodes, edges }
}

// ---- AI Import Schema ----

export interface ImportLessonTerm {
  term: string
  definition: string
}

export interface ImportLesson {
  title: string
  subtitle?: string
  estimated_minutes?: number
  content: string
  terms?: ImportLessonTerm[]
}

export interface ImportModule {
  title: string
  description?: string
  lessons: ImportLesson[]
}

export interface ImportLearningPath {
  title: string
  description: string
  modules: ImportModule[]
}

export function validateImport(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') return { valid: false, error: 'Input must be a JSON object' }
  const d = data as Record<string, unknown>
  if (typeof d.title !== 'string' || !d.title) return { valid: false, error: 'Missing "title" (string)' }
  if (typeof d.description !== 'string') return { valid: false, error: 'Missing "description" (string)' }
  if (!Array.isArray(d.modules) || d.modules.length === 0) return { valid: false, error: '"modules" must be a non-empty array' }

  for (let mi = 0; mi < d.modules.length; mi++) {
    const mod = d.modules[mi] as Record<string, unknown>
    if (typeof mod.title !== 'string' || !mod.title) return { valid: false, error: `modules[${mi}]: missing "title"` }
    if (!Array.isArray(mod.lessons) || mod.lessons.length === 0) return { valid: false, error: `modules[${mi}]: "lessons" must be a non-empty array` }

    for (let li = 0; li < mod.lessons.length; li++) {
      const lesson = mod.lessons[li] as Record<string, unknown>
      if (typeof lesson.title !== 'string' || !lesson.title) return { valid: false, error: `modules[${mi}].lessons[${li}]: missing "title"` }
      if (typeof lesson.content !== 'string' || !lesson.content) return { valid: false, error: `modules[${mi}].lessons[${li}]: missing "content"` }

      if (lesson.terms && Array.isArray(lesson.terms)) {
        for (let ti = 0; ti < lesson.terms.length; ti++) {
          const term = lesson.terms[ti] as Record<string, unknown>
          if (typeof term.term !== 'string') return { valid: false, error: `modules[${mi}].lessons[${li}].terms[${ti}]: missing "term"` }
          if (typeof term.definition !== 'string') return { valid: false, error: `modules[${mi}].lessons[${li}].terms[${ti}]: missing "definition"` }
        }
      }
    }
  }

  return { valid: true }
}

export function importLearningPath(data: ImportLearningPath): string {
  let pathId = ''

  transaction(() => {
    const now = new Date().toISOString()

    // Create path
    pathId = generateId()
    execute(
      'INSERT INTO learning_paths (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [pathId, data.title, data.description, now, now]
    )

    // Create modules and lessons
    for (let mi = 0; mi < data.modules.length; mi++) {
      const mod = data.modules[mi]
      const moduleId = generateId()
      execute(
        'INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [moduleId, pathId, mod.title, mod.description || null, mi, now, now]
      )

      for (let li = 0; li < mod.lessons.length; li++) {
        const lesson = mod.lessons[li]
        const lessonId = generateId()
        execute(
          `INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [lessonId, moduleId, lesson.title, lesson.subtitle || null, lesson.content, li, 'published', lesson.estimated_minutes || null, now, now]
        )

        // Create terms
        if (lesson.terms) {
          for (const t of lesson.terms) {
            const termId = generateId()
            execute(
              'INSERT INTO lesson_terms (id, lesson_id, term, definition, concept_id) VALUES (?, ?, ?, ?, ?)',
              [termId, lessonId, t.term, t.definition, null]
            )
          }
        }
      }
    }
  })

  return pathId
}
