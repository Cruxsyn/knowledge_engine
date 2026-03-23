import { initTokenizer, isTokenizerReady, tokenize } from './tokenizer'
import type { JpTokenizedWord, JpMasteryLevel } from '@/types'

/**
 * Initialize the tokenizer (lazy, call once).
 * Returns true when ready.
 */
export async function ensureTokenizer(): Promise<boolean> {
  if (isTokenizerReady()) return true
  try {
    await initTokenizer()
    return true
  } catch (err) {
    console.error('[tokenize-text] Failed to init tokenizer:', err)
    return false
  }
}

export { isTokenizerReady }

/**
 * Tokenize Japanese text and enrich with mastery data.
 * Returns JpTokenizedWord[] compatible with ReadingPractice.
 */
export function tokenizeForReading(
  text: string,
  knownWords?: Map<string, { mastery: JpMasteryLevel; reading?: string; meaning?: string }>
): JpTokenizedWord[] {
  if (!isTokenizerReady()) {
    // Fallback: return each character as its own token
    return text.split('').map((ch) => ({
      surface: ch,
      lemma: ch,
      mastery: 'unknown' as JpMasteryLevel,
    }))
  }

  const tokens = tokenize(text)
  return tokens.map((t) => {
    const known = knownWords?.get(t.lemma)
    return {
      surface: t.surface,
      lemma: t.lemma,
      reading: t.reading || undefined,
      pos: t.pos,
      mastery: known?.mastery ?? 'unknown',
      meaning: known?.meaning,
    }
  })
}
