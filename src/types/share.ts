import type { MasteryLevel, NoteType, NoteContent, RelationshipType } from './index'

// Share package version for future compatibility
export const SHARE_VERSION = 1

// Shared concept (subset of Concept for sharing)
export interface SharedConcept {
  id: string
  name: string
  definition: string
  intuition?: string
  pitfalls?: string
  mastery: MasteryLevel
}

// Shared note (subset of AtomicNote for sharing)
export interface SharedNote {
  id: string
  title: string
  note_type: NoteType
  content: NoteContent
  confidence: number
  concept_ids: string[] // References to shared concepts
}

// Shared link (subset of Link for sharing)
export interface SharedLink {
  source_id: string
  target_id: string
  relationship: RelationshipType
  reason?: string
}

// Metadata about the share
export interface ShareMetadata {
  title?: string
  description?: string
  concept_count: number
  note_count: number
}

// The complete share package
export interface SharePackage {
  version: typeof SHARE_VERSION
  created_at: string
  concepts: SharedConcept[]
  notes: SharedNote[]
  links: SharedLink[]
  metadata: ShareMetadata
}

// Result of encoding a share package
export type EncodeResult = {
  success: true
  url: string
  size: number
} | {
  success: false
  error: string
  size: number
}

// Result of decoding a share URL
export type DecodeResult = {
  success: true
  package: SharePackage
} | {
  success: false
  error: string
}
