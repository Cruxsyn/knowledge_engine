import { useState, useEffect, useCallback, useRef } from 'react'
import { ensureTokenizer, isTokenizerReady, tokenizeForReading } from '@/lib/japanese/tokenize-text'
import { jReadabilityScore, difficultyLabel, difficultyColor, isContentToken } from '@/lib/japanese/difficulty'
import { useJapanese } from '@/hooks/useJapanese'
import { useJapaneseStore } from '@/stores/japaneseStore'
import { WordPopup } from './WordPopup'
import { SpeakButton } from './SpeakButton'
import { cn } from '@/lib/utils'
import type { JpTokenizedWord, JpMasteryLevel } from '@/types'

// ── Sample texts (raw Japanese, no pre-tokenization) ───────────────────────────

const SAMPLE_TEXTS = [
  {
    title: 'Daily Life (N5)',
    text: '\u79C1\u306F\u5B66\u751F\u3067\u3059\u3002\u6BCE\u65E5\u5B66\u6821\u306B\u884C\u304D\u307E\u3059\u3002\u65E5\u672C\u8A9E\u3092\u52C9\u5F37\u3057\u3066\u3044\u307E\u3059\u3002',
    level: 'N5',
  },
  {
    title: 'Movie Trip (N4)',
    text: '\u6628\u65E5\u3001\u53CB\u9054\u3068\u4E00\u7DD2\u306B\u6620\u753B\u3092\u898B\u306B\u884C\u304D\u307E\u3057\u305F\u3002\u3068\u3066\u3082\u9762\u767D\u304B\u3063\u305F\u3067\u3059\u3002',
    level: 'N4',
  },
  {
    title: 'Japanese Culture (N3)',
    text: '\u6700\u8FD1\u3001\u65E5\u672C\u306E\u6587\u5316\u306B\u8208\u5473\u3092\u6301\u3064\u3088\u3046\u306B\u306A\u308A\u307E\u3057\u305F\u3002\u7279\u306B\u4F1D\u7D71\u7684\u306A\u97F3\u697D\u304C\u597D\u304D\u3067\u3059\u3002',
    level: 'N3',
  },
]

// ── Component ──────────────────────────────────────────────────────────────────

export function ReadingPractice() {
  const { showFurigana, setShowFurigana, readingText, setReadingText } = useJapaneseStore()
  const { getAllKnownLemmas, updateKnownWord } = useJapanese()

  const [tokenizerReady, setTokenizerReady] = useState(isTokenizerReady())
  const [tokenizerLoading, setTokenizerLoading] = useState(false)
  const [tokens, setTokens] = useState<JpTokenizedWord[]>([])
  const [selectedWord, setSelectedWord] = useState<JpTokenizedWord | null>(null)
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 })
  const [customText, setCustomText] = useState('')
  const [activeTab, setActiveTab] = useState<'samples' | 'custom'>('samples')

  const containerRef = useRef<HTMLDivElement>(null)

  // ── Initialize tokenizer on mount ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setTokenizerLoading(true)

    ensureTokenizer().then((ready) => {
      if (cancelled) return
      setTokenizerReady(ready)
      setTokenizerLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  // ── Tokenize whenever readingText or tokenizer readiness changes ───────────
  const doTokenize = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setTokens([])
        return
      }
      const knownLemmas = await getAllKnownLemmas()
      const knownMap = new Map<string, { mastery: JpMasteryLevel; reading?: string; meaning?: string }>()
      for (const lemma of knownLemmas) {
        knownMap.set(lemma, { mastery: 'known' })
      }
      const result = tokenizeForReading(text, knownMap)
      setTokens(result)
    },
    [getAllKnownLemmas]
  )

  useEffect(() => {
    doTokenize(readingText)
  }, [readingText, tokenizerReady, doTokenize])

  // ── Load a sample text ─────────────────────────────────────────────────────
  const loadSample = (text: string) => {
    setReadingText(text)
    setActiveTab('samples')
  }

  // ── Load custom text ───────────────────────────────────────────────────────
  const loadCustom = () => {
    if (customText.trim()) {
      setReadingText(customText.trim())
    }
  }

  // ── Word click handler ─────────────────────────────────────────────────────
  const handleWordClick = (word: JpTokenizedWord, e: React.MouseEvent) => {
    if (!isContentToken(word)) return
    setSelectedWord(word)
    setPopupPos({ x: e.clientX, y: e.clientY })
  }

  // ── Mark as known ──────────────────────────────────────────────────────────
  const handleMarkKnown = useCallback(
    (lemma: string) => {
      updateKnownWord(lemma, { mastery_level: 'known' })
      // Re-tokenize to update colors
      doTokenize(readingText)
      setSelectedWord(null)
    },
    [updateKnownWord, doTokenize, readingText]
  )

  // ── Add to SRS ─────────────────────────────────────────────────────────────
  const handleAddToSrs = useCallback(
    (lemma: string) => {
      const word = tokens.find((t) => t.lemma === lemma)
      updateKnownWord(lemma, { mastery_level: 'learning', reading: word?.reading })
      // Re-tokenize to update mastery badge
      doTokenize(readingText)
      setSelectedWord(null)
    },
    [tokens, updateKnownWord, doTokenize, readingText]
  )

  // ── Difficulty & stats ─────────────────────────────────────────────────────
  const score = tokens.length > 0
    ? jReadabilityScore(tokens.map((t) => ({
        surface: t.surface,
        lemma: t.lemma,
        reading: t.reading ?? '',
        pos: t.pos ?? '',
        pos_detail: '',
      })))
    : null
  const label = score !== null ? difficultyLabel(score) : null
  const labelColor = label ? difficultyColor(label) : ''

  const contentTokens = tokens.filter(isContentToken)
  const knownCount = contentTokens.filter((t) => t.mastery !== 'unknown').length
  const knownPct = contentTokens.length > 0 ? Math.round((knownCount / contentTokens.length) * 100) : 0

  // ── Mastery-based word color ───────────────────────────────────────────────
  function wordColor(mastery: JpMasteryLevel): string {
    switch (mastery) {
      case 'mastered':
        return 'text-icon-gold'
      case 'known':
        return 'text-emerald-400'
      case 'learning':
        return 'text-yellow-400'
      case 'seen':
        return 'text-blue-400'
      case 'unknown':
      default:
        return 'text-parchment'
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-parchment">Reading Practice</h2>
        <div className="flex items-center gap-3">
          {/* Play All button */}
          {tokens.length > 0 && (
            <SpeakButton text={readingText} rate={0.8} size="sm" label="Play entire text" />
          )}
          {/* Furigana toggle */}
          <button
            onClick={() => setShowFurigana(!showFurigana)}
            className={cn(
              'px-3 py-1.5 rounded text-xs font-medium transition-colors',
              showFurigana
                ? 'bg-verdigris/20 text-verdigris'
                : 'bg-ash-stone/50 text-warm-gray'
            )}
          >
            {showFurigana ? 'Furigana ON' : 'Furigana OFF'}
          </button>
        </div>
      </div>

      {/* Tokenizer status */}
      {tokenizerLoading && (
        <div className="flex items-center gap-2 text-sm text-warm-gray/70 bg-ash-stone/30 rounded px-3 py-2">
          <div className="h-3 w-3 border-2 border-icon-gold/50 border-t-icon-gold rounded-full animate-spin" />
          Loading Japanese analyzer...
        </div>
      )}
      {!tokenizerLoading && !tokenizerReady && (
        <div className="text-xs text-warm-gray/50 bg-ash-stone/20 rounded px-3 py-2">
          Tokenizer unavailable -- using character-level fallback.
        </div>
      )}

      {/* Tabs: Samples / Custom */}
      <div className="flex border-b border-ash-stone/50">
        <button
          onClick={() => setActiveTab('samples')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'samples'
              ? 'border-icon-gold text-icon-gold'
              : 'border-transparent text-warm-gray hover:text-parchment'
          )}
        >
          Sample Texts
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'custom'
              ? 'border-icon-gold text-icon-gold'
              : 'border-transparent text-warm-gray hover:text-parchment'
          )}
        >
          Paste Text
        </button>
      </div>

      {/* Sample selector */}
      {activeTab === 'samples' && (
        <div className="grid gap-2 sm:grid-cols-3">
          {SAMPLE_TEXTS.map((s) => (
            <button
              key={s.title}
              onClick={() => loadSample(s.text)}
              className={cn(
                'knowledge-card text-left text-sm hover:border-icon-gold/40 transition-colors',
                readingText === s.text && 'border-icon-gold/60 bg-icon-gold/5'
              )}
            >
              <div className="font-medium text-parchment">{s.title}</div>
              <div className="text-xs text-warm-gray/60 mt-1 truncate">{s.text.slice(0, 30)}...</div>
            </button>
          ))}
        </div>
      )}

      {/* Custom text input */}
      {activeTab === 'custom' && (
        <div className="space-y-2">
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Paste Japanese text here..."
            className="w-full h-28 bg-charcoal-slate border border-ash-stone/50 rounded-lg px-3 py-2 text-sm text-parchment placeholder:text-warm-gray/40 focus:outline-none focus:border-icon-gold/50 resize-none"
          />
          <button
            onClick={loadCustom}
            disabled={!customText.trim()}
            className="px-4 py-1.5 rounded text-sm font-medium bg-icon-gold/20 text-icon-gold hover:bg-icon-gold/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Analyze
          </button>
        </div>
      )}

      {/* Stats bar */}
      {tokens.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-warm-gray/70 bg-ash-stone/20 rounded px-3 py-2">
          {label && (
            <span>
              Difficulty: <span className={cn('font-medium', labelColor)}>{label}</span>
              <span className="text-warm-gray/40 ml-1">({score})</span>
            </span>
          )}
          <span>
            Known: <span className="text-parchment font-medium">{knownPct}%</span>
            <span className="text-warm-gray/40 ml-1">
              ({knownCount}/{contentTokens.length})
            </span>
          </span>
          <span>
            Tokens: <span className="text-parchment font-medium">{tokens.length}</span>
          </span>
        </div>
      )}

      {/* Reading area */}
      {tokens.length > 0 && (
        <div className="knowledge-card leading-loose text-lg">
          {tokens.map((word, i) => {
            const content = isContentToken(word)
            const showReading = showFurigana && word.reading && word.reading !== word.surface

            return (
              <ruby
                key={`${i}-${word.surface}`}
                className={cn(
                  'inline transition-colors',
                  content && 'cursor-pointer hover:bg-ash-stone/50 rounded px-0.5',
                  content && wordColor(word.mastery)
                )}
                onClick={(e) => handleWordClick(word, e)}
              >
                {word.surface}
                {showReading ? <rt className="text-[0.6em] text-warm-gray/60">{word.reading}</rt> : <rt />}
              </ruby>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {tokens.length === 0 && !tokenizerLoading && (
        <div className="knowledge-card text-center py-12 text-warm-gray/50 text-sm">
          Select a sample text or paste your own Japanese text to begin.
        </div>
      )}

      {/* Word popup */}
      {selectedWord && (
        <WordPopup
          word={selectedWord}
          position={popupPos}
          onMarkKnown={handleMarkKnown}
          onAddToSrs={handleAddToSrs}
          onClose={() => setSelectedWord(null)}
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-warm-gray/50">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-parchment inline-block" /> Unknown
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Seen
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Learning
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Known
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-icon-gold inline-block" /> Mastered
        </span>
      </div>
    </div>
  )
}
