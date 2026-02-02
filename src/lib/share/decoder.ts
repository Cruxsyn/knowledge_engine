import pako from 'pako'
import type { SharePackage, DecodeResult } from '@/types/share'
import { SHARE_VERSION } from '@/types/share'

/**
 * Decode a URL-safe base64 string back to a SharePackage
 */
export function decodeShareData(encoded: string): DecodeResult {
  try {
    // Restore base64 padding and characters
    let base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    // Add padding if needed
    while (base64.length % 4) {
      base64 += '='
    }

    // Decode base64 to binary
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }

    // Decompress
    const decompressed = pako.inflate(bytes, { to: 'string' })
    const data = JSON.parse(decompressed)

    // Validate the package
    const validated = validateSharePackage(data)
    if (!validated) {
      return {
        success: false,
        error: 'Invalid share data format'
      }
    }

    return {
      success: true,
      package: validated
    }
  } catch (err) {
    console.error('[Share] Failed to decode:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to decode share data'
    }
  }
}

/**
 * Parse a share URL and extract the encoded data
 */
export function parseShareUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const hash = parsed.hash

    if (!hash.startsWith('#d=')) {
      return null
    }

    return hash.slice(3)
  } catch {
    return null
  }
}

/**
 * Decode a complete share URL
 */
export function decodeShareUrl(url: string): DecodeResult {
  const encoded = parseShareUrl(url)

  if (!encoded) {
    return {
      success: false,
      error: 'Invalid share URL format'
    }
  }

  return decodeShareData(encoded)
}

/**
 * Extract encoded data from current page hash
 */
export function getEncodedFromHash(): string | null {
  const hash = window.location.hash

  if (!hash.startsWith('#d=')) {
    return null
  }

  return hash.slice(3)
}

/**
 * Validate that data conforms to SharePackage structure
 */
function validateSharePackage(data: unknown): SharePackage | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const pkg = data as Record<string, unknown>

  // Check version
  if (typeof pkg.version !== 'number' || pkg.version > SHARE_VERSION) {
    console.warn('[Share] Unsupported version:', pkg.version)
    return null
  }

  // Check required fields
  if (!Array.isArray(pkg.concepts)) return null
  if (!Array.isArray(pkg.notes)) return null
  if (!Array.isArray(pkg.links)) return null
  if (!pkg.metadata || typeof pkg.metadata !== 'object') return null

  // Validate concepts
  for (const concept of pkg.concepts) {
    if (!concept || typeof concept !== 'object') return null
    if (typeof concept.id !== 'string') return null
    if (typeof concept.name !== 'string') return null
    if (typeof concept.definition !== 'string') return null
  }

  // Validate notes
  for (const note of pkg.notes) {
    if (!note || typeof note !== 'object') return null
    if (typeof note.id !== 'string') return null
    if (typeof note.title !== 'string') return null
    if (!note.content || typeof note.content !== 'object') return null
  }

  // Validate links
  for (const link of pkg.links) {
    if (!link || typeof link !== 'object') return null
    if (typeof link.source_id !== 'string') return null
    if (typeof link.target_id !== 'string') return null
    if (typeof link.relationship !== 'string') return null
  }

  return data as SharePackage
}
