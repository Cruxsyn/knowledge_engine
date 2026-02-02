import pako from 'pako'
import type { Concept, AtomicNote, Link } from '@/types'
import type { SharePackage, SharedConcept, SharedNote, SharedLink, EncodeResult } from '@/types/share'
import { SHARE_VERSION } from '@/types/share'

// Maximum URL length to stay safe across browsers
// Most modern browsers support 8000+ chars, but some platforms (social media) truncate
// 4000 is a safe middle ground that works almost everywhere
const MAX_URL_SAFE_SIZE = 4000

/**
 * Create a SharePackage from selected concepts and notes
 */
export function createSharePackage(
  concepts: Concept[],
  notes: AtomicNote[],
  links: Link[],
  includeRelationships: boolean
): SharePackage {
  const conceptIds = new Set(concepts.map(c => c.id))

  // Filter links to only include those between shared concepts
  const filteredLinks: SharedLink[] = includeRelationships
    ? links
        .filter(l => conceptIds.has(l.source_id) && conceptIds.has(l.target_id))
        .map(l => ({
          source_id: l.source_id,
          target_id: l.target_id,
          relationship: l.relationship,
          reason: l.reason
        }))
    : []

  // Convert concepts to shared format
  const sharedConcepts: SharedConcept[] = concepts.map(c => ({
    id: c.id,
    name: c.name,
    definition: c.definition,
    intuition: c.intuition,
    pitfalls: c.pitfalls,
    mastery: c.mastery
  }))

  // Convert notes to shared format, filtering concept_ids to only shared ones
  const sharedNotes: SharedNote[] = notes.map(n => ({
    id: n.id,
    title: n.title,
    note_type: n.note_type,
    content: n.content,
    confidence: n.confidence,
    concept_ids: (n.concepts || [])
      .filter(c => conceptIds.has(c.id))
      .map(c => c.id)
  }))

  return {
    version: SHARE_VERSION,
    created_at: new Date().toISOString(),
    concepts: sharedConcepts,
    notes: sharedNotes,
    links: filteredLinks,
    metadata: {
      concept_count: concepts.length,
      note_count: notes.length
    }
  }
}

/**
 * Compress and encode a SharePackage to a URL-safe string
 */
export function encodeSharePackage(pkg: SharePackage): string {
  const json = JSON.stringify(pkg)
  const compressed = pako.deflate(json)

  // Convert Uint8Array to base64
  const binary = String.fromCharCode(...compressed)
  const base64 = btoa(binary)

  // Make URL-safe by replacing characters
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Estimate the size of the encoded data without actually encoding
 */
export function estimateEncodedSize(
  concepts: Concept[],
  notes: AtomicNote[],
  links: Link[],
  includeRelationships: boolean
): number {
  const pkg = createSharePackage(concepts, notes, links, includeRelationships)
  const json = JSON.stringify(pkg)
  // Rough estimate: compression typically reduces to 30-50% of original
  // Base64 encoding adds ~33% overhead
  return Math.ceil(json.length * 0.4 * 1.33)
}

/**
 * Generate a complete share URL
 */
export function getShareUrl(encodedData: string): string {
  const baseUrl = window.location.origin
  return `${baseUrl}/shared#d=${encodedData}`
}

/**
 * Create a shareable URL from selected items
 * Returns success with URL or failure with error
 */
export function createShareUrl(
  concepts: Concept[],
  notes: AtomicNote[],
  links: Link[],
  includeRelationships: boolean
): EncodeResult {
  try {
    if (concepts.length === 0 && notes.length === 0) {
      return {
        success: false,
        error: 'Please select at least one concept or note to share',
        size: 0
      }
    }

    const pkg = createSharePackage(concepts, notes, links, includeRelationships)
    const encoded = encodeSharePackage(pkg)
    const size = encoded.length

    if (size > MAX_URL_SAFE_SIZE) {
      return {
        success: false,
        error: `Share is too large (${size}/${MAX_URL_SAFE_SIZE} chars). Try selecting fewer items or shorter content. You can share approximately ${Math.floor(MAX_URL_SAFE_SIZE / 150)} average concepts with notes.`,
        size
      }
    }

    return {
      success: true,
      url: getShareUrl(encoded),
      size
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create share URL',
      size: 0
    }
  }
}
