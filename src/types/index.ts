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
export interface AtomicNote {
  id: string
  title: string
  summary: string
  key_claim: string
  example?: string
  confidence: number // 1-5
  source_id?: string
  source?: Source
  created_at: string
  updated_at: string
  last_reviewed?: string
  concepts?: Concept[]
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
  summary: string
  key_claim: string
  example?: string
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
