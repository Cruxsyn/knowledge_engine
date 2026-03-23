import kuromoji from '@sglkc/kuromoji'
import type { IpadicFeatures, Tokenizer } from '@sglkc/kuromoji'

/**
 * Token type returned by our tokenizer wrapper.
 */
export interface JpToken {
  surface: string       // The word as it appears in text
  lemma: string         // Dictionary form (basic_form)
  reading: string       // Katakana reading
  pos: string           // Part of speech (e.g. 名詞, 動詞)
  pos_detail: string    // Detailed POS (pos_detail_1)
  conjugation?: string  // Conjugation type if applicable
}

let _tokenizer: Tokenizer<IpadicFeatures> | null = null
let _initPromise: Promise<void> | null = null

/**
 * Initialize the tokenizer. Must be called once before using tokenize().
 * Loads the kuromoji dictionary files from the public directory.
 */
export async function initTokenizer(): Promise<void> {
  if (_tokenizer) return
  if (_initPromise) return _initPromise

  _initPromise = new Promise<void>((resolve, reject) => {
    // In browser, the BrowserDictionaryLoader fetches .dat.gz files
    // from the given path. We point to the node_modules directory
    // which Vite serves as static assets, or to a public/dict path.
    const dicPath = '/dict/kuromoji/'

    kuromoji.builder({ dicPath }).build((err: Error | null, tokenizer: Tokenizer<IpadicFeatures>) => {
      if (err) {
        _initPromise = null
        reject(err)
        return
      }
      _tokenizer = tokenizer
      resolve()
    })
  })

  return _initPromise
}

/**
 * Check if the tokenizer is ready to use.
 */
export function isTokenizerReady(): boolean {
  return _tokenizer !== null
}

/**
 * Convert a kuromoji IpadicFeatures token to our JpToken format.
 */
function toJpToken(t: IpadicFeatures): JpToken {
  return {
    surface: t.surface_form,
    lemma: t.basic_form ?? t.surface_form,
    reading: t.reading ?? '',
    pos: t.pos,
    pos_detail: t.pos_detail_1,
    conjugation: t.conjugated_type && t.conjugated_type !== '*'
      ? t.conjugated_type
      : undefined,
  }
}

/**
 * Tokenize Japanese text into JpToken[].
 * Throws if tokenizer is not initialized.
 */
export function tokenize(text: string): JpToken[] {
  if (!_tokenizer) {
    throw new Error('Tokenizer not initialized. Call initTokenizer() first.')
  }

  const results = _tokenizer.tokenize(text)
  return results.map(toJpToken)
}

// POS tags considered "content words" (not function words)
const CONTENT_POS = new Set(['名詞', '動詞', '形容詞', '形容動詞', '副詞'])

// POS detail values to exclude even within content POS (e.g. pronouns, suffixes)
const EXCLUDED_DETAILS = new Set(['非自立', '接尾', '代名詞', '数'])

/**
 * Extract content words (nouns, verbs, adjectives, adverbs) from text.
 * Filters out particles, copula, auxiliary verbs, etc.
 */
export function extractContentWords(text: string): JpToken[] {
  const tokens = tokenize(text)
  return tokens.filter(
    (t) => CONTENT_POS.has(t.pos) && !EXCLUDED_DETAILS.has(t.pos_detail)
  )
}

/**
 * Get unique lemmas (dictionary forms) from text.
 */
export function extractLemmas(text: string): Set<string> {
  const tokens = tokenize(text)
  const lemmas = new Set<string>()
  for (const t of tokens) {
    // Only include content words, skip punctuation and symbols
    if (t.pos !== '記号' && t.lemma && t.lemma !== '*') {
      lemmas.add(t.lemma)
    }
  }
  return lemmas
}
