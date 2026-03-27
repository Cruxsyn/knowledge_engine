import type { JpToken } from './tokenizer.ts'

/**
 * jReadability formula: validated Japanese text difficulty scorer.
 *
 * Returns a score where:
 *   0.5-1.5 = upper-advanced
 *   1.5-2.5 = lower-advanced
 *   2.5-3.5 = upper-intermediate
 *   3.5-4.5 = lower-intermediate
 *   4.5-5.5 = upper-elementary
 *   5.5-6.5 = lower-elementary
 *
 * Formula:
 *   readability = (mean_words_per_sentence * -0.056)
 *               + (kango_percentage * -0.126)
 *               + (wago_percentage * -0.042)
 *               + (verb_percentage * -0.145)
 *               + (particle_percentage * -0.044)
 *               + 11.724
 */
export function jReadabilityScore(tokens: JpToken[]): number {
  if (tokens.length === 0) return 6.5 // No tokens: treat as easiest

  // Split tokens into sentences by detecting sentence-ending punctuation
  const sentences: JpToken[][] = []
  let currentSentence: JpToken[] = []

  for (const token of tokens) {
    currentSentence.push(token)
    // Sentence-ending punctuation: 。！？
    if (token.surface === '。' || token.surface === '！' || token.surface === '？') {
      sentences.push(currentSentence)
      currentSentence = []
    }
  }
  // Remaining tokens form the last sentence
  if (currentSentence.length > 0) {
    sentences.push(currentSentence)
  }

  const sentenceCount = sentences.length
  // Mean words per sentence (excluding pure punctuation)
  const contentTokenCount = tokens.filter((t) => t.pos !== '記号').length
  const meanWordsPerSentence = sentenceCount > 0 ? contentTokenCount / sentenceCount : contentTokenCount

  // Categorize tokens
  let kangoCount = 0    // Chinese-origin words (nouns with katakana readings, typically on'yomi)
  let wagoCount = 0     // Native Japanese words (verbs, adjectives, hiragana-heavy)
  let verbCount = 0
  let particleCount = 0

  for (const token of tokens) {
    if (token.pos === '記号') continue // skip punctuation

    if (token.pos === '動詞') {
      verbCount++
      wagoCount++ // verbs are generally wago
    } else if (token.pos === '形容詞' || token.pos === '形容動詞') {
      wagoCount++
    } else if (token.pos === '助詞') {
      particleCount++
    } else if (token.pos === '名詞') {
      // Heuristic: nouns with all-katakana reading and kanji surface are likely kango
      // Nouns with hiragana surface or wago-type readings are wago
      if (isLikelyKango(token)) {
        kangoCount++
      } else {
        wagoCount++
      }
    }
  }

  const denominator = Math.max(contentTokenCount, 1)
  const kangoPercentage = (kangoCount / denominator) * 100
  const wagoPercentage = (wagoCount / denominator) * 100
  const verbPercentage = (verbCount / denominator) * 100
  const particlePercentage = (particleCount / denominator) * 100

  const readability =
    meanWordsPerSentence * -0.056 +
    kangoPercentage * -0.126 +
    wagoPercentage * -0.042 +
    verbPercentage * -0.145 +
    particlePercentage * -0.044 +
    11.724

  // Clamp to valid range
  return Math.max(0.5, Math.min(6.5, readability))
}

/**
 * Heuristic to detect kango (Chinese-origin words).
 * A noun is likely kango if it contains kanji characters.
 * Pure hiragana/katakana nouns are less likely kango.
 */
function isLikelyKango(token: JpToken): boolean {
  const surface = token.surface
  // Check if surface contains at least one kanji
  for (const ch of surface) {
    const code = ch.codePointAt(0) ?? 0
    // CJK Unified Ideographs range
    if (code >= 0x4E00 && code <= 0x9FFF) {
      return true
    }
    // CJK extension ranges
    if (code >= 0x3400 && code <= 0x4DBF) {
      return true
    }
  }
  return false
}

/**
 * Map jReadability score to a human-readable difficulty level.
 */
export function difficultyLabel(score: number): string {
  if (score < 1.5) return 'upper-advanced'
  if (score < 2.5) return 'lower-advanced'
  if (score < 3.5) return 'upper-intermediate'
  if (score < 4.5) return 'lower-intermediate'
  if (score < 5.5) return 'upper-elementary'
  return 'lower-elementary'
}

/**
 * Get a Tailwind color class for a difficulty label.
 */
export function difficultyColor(label: string): string {
  switch (label) {
    case 'upper-advanced':
    case 'lower-advanced':
      return 'text-oxide-red'
    case 'upper-intermediate':
    case 'lower-intermediate':
      return 'text-icon-gold'
    case 'upper-elementary':
    case 'lower-elementary':
      return 'text-patina-teal'
    default:
      return 'text-warm-gray'
  }
}

/**
 * Check if a token is a content word (not punctuation/symbol).
 */
export function isContentToken(token: { pos?: string; surface: string }): boolean {
  if (!token.pos) return token.surface.trim().length > 0
  const nonContent = new Set(['記号', '補助記号', '空白'])
  return !nonContent.has(token.pos)
}

/**
 * Result type for i+1 detection.
 */
export type I1Result =
  | { type: 'known' }
  | { type: 'i1'; target: JpToken }
  | { type: 'i2'; targets: JpToken[] }
  | { type: 'too_hard'; unknownCount: number }
  | { type: 'error'; message: string }

/**
 * Detect if a sentence is i+1 for the given learner.
 * Only content words (nouns, verbs, adjectives) count as "unknown" --
 * particles and grammar words are excluded from the count.
 */
export function detectI1(
  tokens: JpToken[],
  knownLemmas: Set<string>
): I1Result {
  if (tokens.length === 0) {
    return { type: 'error', message: 'No tokens provided' }
  }

  const contentPos = new Set(['名詞', '動詞', '形容詞', '形容動詞', '副詞'])
  const excludedDetails = new Set(['非自立', '接尾', '代名詞', '数'])

  const unknowns: JpToken[] = []

  for (const token of tokens) {
    // Skip non-content words
    if (!contentPos.has(token.pos)) continue
    if (excludedDetails.has(token.pos_detail)) continue
    // Skip punctuation-like tokens
    if (token.lemma === '*' || token.lemma === '') continue

    if (!knownLemmas.has(token.lemma)) {
      // Deduplicate unknowns by lemma
      if (!unknowns.some((u) => u.lemma === token.lemma)) {
        unknowns.push(token)
      }
    }
  }

  if (unknowns.length === 0) {
    return { type: 'known' }
  }
  if (unknowns.length === 1) {
    return { type: 'i1', target: unknowns[0] }
  }
  if (unknowns.length === 2) {
    return { type: 'i2', targets: unknowns }
  }
  return { type: 'too_hard', unknownCount: unknowns.length }
}

/**
 * Calculate unknown word ratio for a tokenized text.
 * Only counts content words (not particles, punctuation, etc.).
 */
export function unknownWordRatio(
  tokens: JpToken[],
  knownLemmas: Set<string>
): { total: number; unknown: number; ratio: number } {
  const contentPos = new Set(['名詞', '動詞', '形容詞', '形容動詞', '副詞'])

  const contentTokens = tokens.filter(
    (t) => contentPos.has(t.pos) && t.lemma !== '*' && t.lemma !== ''
  )

  // Deduplicate by lemma for counting
  const uniqueLemmas = new Set(contentTokens.map((t) => t.lemma))
  const unknownLemmas = new Set(
    [...uniqueLemmas].filter((lemma) => !knownLemmas.has(lemma))
  )

  const total = uniqueLemmas.size
  const unknown = unknownLemmas.size
  const ratio = total > 0 ? unknown / total : 0

  return { total, unknown, ratio }
}

// Common JLPT vocabulary markers by frequency tier (simplified heuristic)
// These POS/grammar features correlate with JLPT levels
const ADVANCED_GRAMMAR: ReadonlySet<string> = new Set([
  '接続助詞', // conjunctive particles
  '係助詞',   // binding particles
])

const INTERMEDIATE_POS_DETAILS: ReadonlySet<string> = new Set([
  'サ変接続',   // suru-verb nouns
  '形容動詞語幹', // na-adjective stems
])

/**
 * Estimate JLPT level of a text based on vocabulary and grammar complexity.
 * Returns 1-5 where 1=hardest (N1) and 5=easiest (N5).
 *
 * This is a heuristic based on:
 * - jReadability score mapping
 * - Average sentence length
 * - Ratio of kango to wago
 * - Presence of advanced grammar patterns
 */
export function estimateJlptLevel(tokens: JpToken[]): number {
  if (tokens.length === 0) return 5

  const score = jReadabilityScore(tokens)

  // Base level from readability
  let level: number
  if (score < 1.5) level = 1
  else if (score < 2.5) level = 2
  else if (score < 3.5) level = 3
  else if (score < 4.5) level = 4
  else level = 5

  // Adjust based on grammar complexity
  let advancedGrammarCount = 0
  let intermediateCount = 0

  for (const token of tokens) {
    if (ADVANCED_GRAMMAR.has(token.pos_detail)) {
      advancedGrammarCount++
    }
    if (INTERMEDIATE_POS_DETAILS.has(token.pos_detail)) {
      intermediateCount++
    }
  }

  const contentTokens = tokens.filter((t) => t.pos !== '記号').length
  const advancedRatio = contentTokens > 0 ? advancedGrammarCount / contentTokens : 0
  const intermediateRatio = contentTokens > 0 ? intermediateCount / contentTokens : 0

  // Nudge level down (harder) if advanced grammar is frequent
  if (advancedRatio > 0.1) {
    level = Math.max(1, level - 1)
  }
  if (intermediateRatio > 0.15) {
    level = Math.max(1, level - 1)
  }

  return Math.max(1, Math.min(5, level))
}
