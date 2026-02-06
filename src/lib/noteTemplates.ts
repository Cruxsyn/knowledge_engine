import type { NoteType } from '@/types'

export interface NoteTemplate {
  id: string
  name: string
  noteType: NoteType
  fields: Record<string, string>
  category?: string
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  // Definition templates
  { id: 'def-ml', name: 'ML Term', noteType: 'definition', fields: { term: '', definition: 'In machine learning, ' }, category: 'ML' },
  { id: 'def-math', name: 'Math Concept', noteType: 'definition', fields: { term: '', definition: 'Mathematically, ' }, category: 'Math' },
  { id: 'def-cs', name: 'CS Term', noteType: 'definition', fields: { term: '', definition: 'In computer science, ' }, category: 'CS' },

  // Idea templates
  { id: 'idea-project', name: 'Project Idea', noteType: 'idea', fields: { description: 'Project: \n\nGoal: \n\nApproach: ', applications: '' }, category: 'Projects' },
  { id: 'idea-research', name: 'Research Direction', noteType: 'idea', fields: { description: 'Hypothesis: \n\nEvidence: \n\nNext steps: ', applications: '' }, category: 'Research' },

  // Question templates
  { id: 'q-why', name: 'Why Question', noteType: 'question', fields: { question: 'Why does ', context: '', possible_answers: '' }, category: 'Inquiry' },
  { id: 'q-how', name: 'How Question', noteType: 'question', fields: { question: 'How does ', context: '', possible_answers: '' }, category: 'Inquiry' },
  { id: 'q-debug', name: 'Debug Question', noteType: 'question', fields: { question: 'Why is ', context: 'Expected: \nActual: ', possible_answers: '' }, category: 'Debug' },

  // Insight templates
  { id: 'insight-aha', name: 'Aha Moment', noteType: 'insight', fields: { insight: 'I realized that ', trigger: '', implications: '' }, category: 'Learning' },
  { id: 'insight-pattern', name: 'Pattern', noteType: 'insight', fields: { insight: 'The pattern is: ', trigger: 'I noticed across: ', implications: 'This means: ' }, category: 'Patterns' },

  // Process templates
  { id: 'proc-setup', name: 'Setup Guide', noteType: 'process', fields: { steps: '1. Install prerequisites\n2. Configure\n3. Verify', use_case: '' }, category: 'Dev' },
  { id: 'proc-debug', name: 'Debug Process', noteType: 'process', fields: { steps: '1. Reproduce\n2. Isolate cause\n3. Hypothesis\n4. Test fix\n5. Verify', use_case: '' }, category: 'Debug' },

  // Example templates
  { id: 'ex-code', name: 'Code Example', noteType: 'example', fields: { subject: '', example: '```\n// Code example\n```\n\nExplanation: ', why_it_works: '' }, category: 'Code' },
  { id: 'ex-analogy', name: 'Analogy', noteType: 'example', fields: { subject: '', example: 'Think of it like: ', why_it_works: 'This analogy works because: ' }, category: 'Teaching' },

  // Connection templates
  { id: 'conn-compare', name: 'Comparison', noteType: 'connection', fields: { item_a: '', item_b: '', relationship: 'Both share: \nThey differ in: ' }, category: 'Analysis' },

  // Other templates
  { id: 'other-summary', name: 'Quick Summary', noteType: 'other', fields: { summary: '', key_claim: '', example: '' }, category: 'General' },
]

export function getTemplatesForType(noteType: NoteType): NoteTemplate[] {
  return NOTE_TEMPLATES.filter((t) => t.noteType === noteType)
}

const USAGE_KEY = 'arkvim-note-usage-stats'

interface NoteUsageStats {
  typeCounts: Partial<Record<NoteType, number>>
  templateCounts: Record<string, number>
  lastUsedType: NoteType | null
}

function getUsageStats(): NoteUsageStats {
  try {
    const raw = localStorage.getItem(USAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { typeCounts: {}, templateCounts: {}, lastUsedType: null }
}

export function trackNoteCreation(noteType: NoteType, templateId?: string) {
  const stats = getUsageStats()
  stats.typeCounts[noteType] = (stats.typeCounts[noteType] || 0) + 1
  if (templateId) {
    stats.templateCounts[templateId] = (stats.templateCounts[templateId] || 0) + 1
  }
  stats.lastUsedType = noteType
  localStorage.setItem(USAGE_KEY, JSON.stringify(stats))
}

export function getLastUsedType(): NoteType | null {
  return getUsageStats().lastUsedType
}

export function getSortedTemplates(noteType: NoteType): NoteTemplate[] {
  const stats = getUsageStats()
  const templates = getTemplatesForType(noteType)
  return [...templates].sort((a, b) => {
    const aCount = stats.templateCounts[a.id] || 0
    const bCount = stats.templateCounts[b.id] || 0
    return bCount - aCount
  })
}

/**
 * Detect likely note type from content text
 */
export function detectNoteType(text: string): NoteType | null {
  const trimmed = text.trim().toLowerCase()
  if (!trimmed) return null

  if (trimmed.startsWith('what is ') || trimmed.startsWith('define:') || trimmed.startsWith('definition:')) {
    return 'definition'
  }
  if (trimmed.startsWith('why ') || trimmed.startsWith('how ') || trimmed.endsWith('?')) {
    return 'question'
  }
  if (trimmed.startsWith('i realized') || trimmed.startsWith('the key insight') || trimmed.startsWith('insight:')) {
    return 'insight'
  }
  if (/step\s*1|^\d+\.\s/.test(trimmed)) {
    return 'process'
  }
  if (trimmed.includes('is like') || trimmed.includes('think of it as') || trimmed.includes('for example')) {
    return 'example'
  }

  return null
}
