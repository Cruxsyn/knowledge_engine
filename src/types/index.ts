// Capture types
export type CaptureType = 'clip' | 'thought' | 'highlight' | 'code' | 'research' | 'lecture'
export type CaptureStatus = 'new' | 'processing' | 'distilled' | 'linked' | 'published'
export type Priority = 'low' | 'medium' | 'high'

export interface Source {
  id: string
  url?: string
  title: string
  type: string
  created_at: string
}

export interface Capture {
  id: string
  title: string
  type: CaptureType
  source_id?: string
  source?: Source
  content: string
  why_saved?: string
  topic?: string
  priority: Priority
  status: CaptureStatus
  created_at: string
  updated_at: string
}

// Atomic Note types
export type NoteType = 'definition' | 'idea' | 'connection' | 'question' | 'insight' | 'process' | 'example' | 'other'

// Type-specific content structures - using index signature for flexibility
export interface NoteContentBase {
  [key: string]: string | undefined
}

export interface DefinitionContent extends NoteContentBase {
  term: string
  definition: string
}

export interface IdeaContent extends NoteContentBase {
  description: string
  applications?: string
}

export interface ConnectionContent extends NoteContentBase {
  item_a: string
  item_b: string
  relationship: string
}

export interface QuestionContent extends NoteContentBase {
  question: string
  context?: string
  possible_answers?: string
}

export interface InsightContent extends NoteContentBase {
  insight: string
  trigger?: string
  implications?: string
}

export interface ProcessContent extends NoteContentBase {
  steps: string
  use_case?: string
}

export interface ExampleContent extends NoteContentBase {
  subject: string
  example: string
  why_it_works?: string
}

export interface OtherContent extends NoteContentBase {
  summary: string
  key_claim: string
  example?: string
}

export type NoteContent = 
  | DefinitionContent 
  | IdeaContent 
  | ConnectionContent 
  | QuestionContent 
  | InsightContent 
  | ProcessContent 
  | ExampleContent 
  | OtherContent

export interface NoteTypeConfig {
  value: NoteType
  label: string
  description: string
  fields: {
    name: string
    label: string
    placeholder: string
    required: boolean
    multiline?: boolean
  }[]
}

export const NOTE_TYPE_CONFIGS: NoteTypeConfig[] = [
  {
    value: 'definition',
    label: 'Definition',
    description: 'A clear explanation of a term or concept',
    fields: [
      { name: 'term', label: 'Term', placeholder: 'The term or concept being defined', required: true, multiline: false },
      { name: 'definition', label: 'Definition', placeholder: 'Clear explanation of what this means', required: true, multiline: true },
    ]
  },
  {
    value: 'idea',
    label: 'Idea',
    description: 'A novel thought or proposal',
    fields: [
      { name: 'description', label: 'Description', placeholder: 'Describe your idea', required: true, multiline: true },
      { name: 'applications', label: 'Applications', placeholder: 'Where could this be applied?', required: false, multiline: true },
    ]
  },
  {
    value: 'connection',
    label: 'Connection',
    description: 'A link between two or more concepts',
    fields: [
      { name: 'item_a', label: 'First Item', placeholder: 'First concept or idea', required: true, multiline: false },
      { name: 'item_b', label: 'Second Item', placeholder: 'Second concept or idea', required: true, multiline: false },
      { name: 'relationship', label: 'Relationship', placeholder: 'How are they connected?', required: true, multiline: true },
    ]
  },
  {
    value: 'question',
    label: 'Question',
    description: 'An open inquiry or problem to explore',
    fields: [
      { name: 'question', label: 'Question', placeholder: 'What are you trying to understand?', required: true, multiline: false },
      { name: 'context', label: 'Context', placeholder: 'Why is this question important?', required: false, multiline: true },
      { name: 'possible_answers', label: 'Possible Answers', placeholder: 'Initial thoughts or hypotheses', required: false, multiline: true },
    ]
  },
  {
    value: 'insight',
    label: 'Insight',
    description: 'A realization or deeper understanding',
    fields: [
      { name: 'insight', label: 'Insight', placeholder: 'What did you realize?', required: true, multiline: true },
      { name: 'trigger', label: 'Trigger', placeholder: 'What led to this insight?', required: false, multiline: false },
      { name: 'implications', label: 'Implications', placeholder: 'What does this change or affect?', required: false, multiline: true },
    ]
  },
  {
    value: 'process',
    label: 'Process',
    description: 'A step-by-step method or procedure',
    fields: [
      { name: 'steps', label: 'Steps', placeholder: '1. First step\n2. Second step\n3. ...', required: true, multiline: true },
      { name: 'use_case', label: 'Use Case', placeholder: 'When should this process be used?', required: false, multiline: true },
    ]
  },
  {
    value: 'example',
    label: 'Example',
    description: 'A concrete instance or illustration',
    fields: [
      { name: 'subject', label: 'Subject', placeholder: 'What concept does this exemplify?', required: true, multiline: false },
      { name: 'example', label: 'Example', placeholder: 'Describe the concrete example', required: true, multiline: true },
      { name: 'why_it_works', label: 'Why It Works', placeholder: 'Why is this a good example?', required: false, multiline: true },
    ]
  },
  {
    value: 'other',
    label: 'Other',
    description: 'General note',
    fields: [
      { name: 'summary', label: 'Summary', placeholder: 'Main content of the note', required: true, multiline: true },
      { name: 'key_claim', label: 'Key Claim', placeholder: 'The core point in one sentence', required: true, multiline: false },
      { name: 'example', label: 'Example', placeholder: 'A concrete example (optional)', required: false, multiline: true },
    ]
  },
]

// Legacy type array for backwards compatibility
export const NOTE_TYPES = NOTE_TYPE_CONFIGS.map(c => ({ value: c.value, label: c.label, description: c.description }))

export interface AtomicNote {
  id: string
  title: string
  note_type: NoteType
  content: NoteContent
  confidence: number // 1-5
  source_id?: string
  source?: Source
  created_at: string
  updated_at: string
  last_reviewed?: string
  concepts?: Concept[]
}

// Helper to get display text from any note content
export function getNoteDisplayText(note: AtomicNote): { primary: string; secondary?: string } {
  const content = note.content as Record<string, string>
  switch (note.note_type) {
    case 'definition':
      return { primary: content.definition, secondary: content.term }
    case 'idea':
      return { primary: content.description, secondary: content.applications }
    case 'connection':
      return { primary: content.relationship, secondary: `${content.item_a} ↔ ${content.item_b}` }
    case 'question':
      return { primary: content.question, secondary: content.context }
    case 'insight':
      return { primary: content.insight, secondary: content.implications }
    case 'process':
      return { primary: content.steps, secondary: content.use_case }
    case 'example':
      return { primary: content.example, secondary: content.subject }
    default:
      return { primary: content.summary || '', secondary: content.key_claim }
  }
}

// Concept types
export type MasteryLevel = 'unknown' | 'learning' | 'solid' | 'teachable'

export interface Concept {
  id: string
  name: string
  definition: string
  intuition?: string
  pitfalls?: string
  mastery: MasteryLevel
  created_at: string
  updated_at: string
  prerequisites?: Concept[]
  dependents?: Concept[]
  notes?: AtomicNote[]
}

// Link (relationship) types
export type RelationshipType = 
  | 'prerequisite_of'
  | 'depends_on'
  | 'explains'
  | 'contradicts'
  | 'refines'
  | 'example_of'
  | 'used_in'

export interface Link {
  id: string
  source_id: string
  target_id: string
  relationship: RelationshipType
  reason?: string
  created_at: string
}

// Tag types
export interface Tag {
  id: string
  name: string
  color?: string
}

export interface EntityTag {
  entity_id: string
  entity_type: 'capture' | 'note' | 'concept'
  tag_id: string
}

// UI State types
export interface SearchFilters {
  query: string
  type?: 'capture' | 'note' | 'concept' | 'all'
  status?: CaptureStatus
  mastery?: MasteryLevel
  topic?: string
  dateRange?: {
    from?: Date
    to?: Date
  }
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

// Form types for creating/editing
export interface CreateCapture {
  title: string
  type: CaptureType
  source_url?: string
  content: string
  why_saved?: string
  topic?: string
  priority: Priority
}

export interface CreateAtomicNote {
  title: string
  note_type: NoteType
  content: NoteContent
  confidence: number
  source_id?: string
  concept_ids?: string[]
}

export interface CreateConcept {
  name: string
  definition: string
  intuition?: string
  pitfalls?: string
  prerequisite_ids?: string[]
}

export interface CreateLink {
  source_id: string
  target_id: string
  relationship: RelationshipType
  reason?: string
}

// ---- Peak Learning types ----

export type LessonStatus = 'draft' | 'published'

export interface LearningPath {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
}

export interface LearningModule {
  id: string
  path_id: string
  title: string
  description?: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  module_id: string
  title: string
  subtitle?: string
  content: string
  sort_order: number
  status: LessonStatus
  estimated_minutes?: number
  created_at: string
  updated_at: string
}

export interface LessonTerm {
  id: string
  lesson_id: string
  term: string
  definition: string
  concept_id?: string
}

export interface LessonProgress {
  lesson_id: string
  completed: boolean
  completed_at?: string
  scroll_position: number
  updated_at: string
}

// ---- Japanese Language Learning types ----

export type JpMasteryLevel = 'unknown' | 'seen' | 'learning' | 'known' | 'mastered'
export type JpItemType = 'radical' | 'kanji' | 'word' | 'grammar'
export type JpCardType = 'meaning' | 'reading' | 'recall' | 'listening'
export type JpSrsState = 0 | 1 | 2 | 3 // New, Learning, Review, Relearning
export type JpAssociationCategory = 'semantic' | 'phonological' | 'orthographic' | 'collocational' | 'grammatical' | 'mnemonic'

export type JpAssociationRelation =
  // Semantic
  | 'SYNONYM' | 'ANTONYM' | 'HYPERNYM' | 'HYPONYM' | 'CO_HYPONYM'
  | 'MERONYM' | 'HOLONYM' | 'THEMATIC' | 'REGISTER_PAIR'
  // Phonological
  | 'HOMOPHONE' | 'MINIMAL_PAIR' | 'PITCH_ACCENT_PAIR' | 'SHARED_READING'
  // Orthographic
  | 'SHARED_RADICAL' | 'SHARED_PHONETIC' | 'CONTAINS_COMPONENT' | 'VISUALLY_SIMILAR'
  // Collocational
  | 'VERB_OBJECT' | 'ADJ_NOUN' | 'COMPOUND_WORD' | 'COLLOCATES_WITH'
  // Grammatical
  | 'SAME_CONJUGATION' | 'SAME_PARTICLE' | 'TRANSITIVE_INTRANSITIVE'
  | 'SAME_GRAMMAR_PATTERN' | 'USES_GRAMMAR'
  // Mnemonic
  | 'MNEMONIC_LINK' | 'STORY_CHAIN'

export interface JpRadical {
  id: string
  character: string
  meaning: string
  alt_meanings?: string[]
  stroke_count: number
  mnemonic?: string
  frequency_rank?: number
  position_hint?: string
  created_at: string
}

export interface JpKanji {
  id: string
  character: string
  meanings: string[]
  on_readings?: string[]
  kun_readings?: string[]
  stroke_count: number
  jlpt_level?: number
  grade?: number
  frequency_rank?: number
  mnemonic_meaning?: string
  mnemonic_reading?: string
  phonetic_component?: string
  semantic_component?: string
  sort_order?: number
  created_at: string
  // Populated by queries
  components?: (JpRadical | JpKanji)[]
  vocabulary?: JpVocabulary[]
}

export interface JpVocabulary {
  id: string
  word: string
  reading: string
  meanings: string[]
  part_of_speech?: string
  jlpt_level?: number
  frequency_rank?: number
  pitch_accent?: string
  conjugation_class?: string
  notes?: string
  sort_order?: number
  created_at: string
  // Populated by queries
  kanji?: JpKanji[]
  sentences?: JpSentence[]
}

export interface JpGrammar {
  id: string
  pattern: string
  meaning: string
  formation?: string
  jlpt_level?: number
  examples?: { jp: string; en: string; notes?: string }[]
  related_grammar?: string[]
  notes?: string
  sort_order?: number
  created_at: string
}

export interface JpSentence {
  id: string
  japanese: string
  english?: string
  tokens?: { surface: string; lemma: string; reading: string; pos: string }[]
  difficulty_score?: number
  source?: string
  created_at: string
}

export interface JpAssociation {
  id: string
  source_id: string
  source_type: JpItemType | 'sentence'
  target_id: string
  target_type: JpItemType | 'sentence'
  category: JpAssociationCategory
  relation: JpAssociationRelation
  weight: number
  bidirectional: boolean
  metadata?: Record<string, unknown>
  created_at: string
}

export interface JpSrsCard {
  id: string
  item_id: string
  item_type: JpItemType
  card_type: JpCardType
  // FSRS state
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: JpSrsState
  due: string
  last_review?: string
  implicit_boost: number
  created_at: string
}

export interface JpReviewLog {
  id: string
  card_id: string
  rating: 1 | 2 | 3 | 4
  state: JpSrsState
  elapsed_days: number
  scheduled_days: number
  reviewed_at: string
  duration_ms?: number
}

export interface JpKnownWord {
  lemma: string
  reading?: string
  mastery_level: JpMasteryLevel
  encounter_count: number
  first_seen: string
  last_encountered: string
  source?: string
}

export interface JpGhost {
  id: string
  card_id: string
  fail_count: number
  ghost_interval: number
  ghost_due: string
  created_at: string
}

export interface JpProgress {
  dimension: 'vocabulary' | 'kanji' | 'grammar' | 'reading' | 'listening'
  current_level: number
  items_total: number
  items_learning: number
  items_known: number
  items_mastered: number
  daily_streak: number
  last_study_date?: string
  updated_at: string
}

export interface JpStudySession {
  id: string
  session_date: string
  duration_minutes: number
  cards_reviewed: number
  cards_new: number
  accuracy: number
  created_at: string
}

// Association web graph types for visualization
export interface JpGraphNode {
  id: string
  type: JpItemType
  label: string
  sublabel?: string
  mastery: JpMasteryLevel
  jlpt_level?: number
  data?: JpRadical | JpKanji | JpVocabulary | JpGrammar
}

export interface JpGraphEdge {
  source: string
  target: string
  category: JpAssociationCategory
  relation: JpAssociationRelation
  weight: number
}

export interface JpGraphData {
  nodes: JpGraphNode[]
  edges: JpGraphEdge[]
}

// Review session state
export interface JpReviewSession {
  cards: JpSrsCard[]
  currentIndex: number
  answers: { card_id: string; rating: 1 | 2 | 3 | 4; duration_ms: number }[]
  startedAt: string
  sessionType: 'due' | 'new' | 'ghost' | 'mixed'
}

// Dashboard stats
export interface JpDashboardStats {
  dueCards: number
  newCardsAvailable: number
  ghostCount: number
  todayReviewed: number
  todayAccuracy: number
  currentStreak: number
  totalKnownWords: number
  progress: JpProgress[]
}
