import { useState, useCallback, useRef, useEffect } from 'react'
import { BookOpen, Eye, EyeOff, Clipboard, Type } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { WordPopup } from './WordPopup'
import { useJapaneseStore } from '@/stores/japaneseStore'
import type { JpTokenizedWord, JpMasteryLevel } from '@/types'

// ── Sample Texts ─────────────────────────────────────────────────────────

interface SampleText {
  label: string
  level: string
  text: string
  tokens: JpTokenizedWord[]
}

const SAMPLE_TEXTS: SampleText[] = [
  {
    label: 'N5 - Daily Life',
    level: 'N5',
    text: '私は学生です。毎日学校に行きます。日本語を勉強しています。',
    tokens: [
      { surface: '私', lemma: '私', reading: 'わたし', meaning: 'I, me', pos: 'Pronoun', jlpt: 'N5', mastery: 'known' },
      { surface: 'は', lemma: 'は', reading: 'は', meaning: 'topic marker', pos: 'Particle', jlpt: 'N5', mastery: 'mastered' },
      { surface: '学生', lemma: '学生', reading: 'がくせい', meaning: 'student', pos: 'Noun', jlpt: 'N5', mastery: 'known' },
      { surface: 'です', lemma: 'です', reading: 'です', meaning: 'to be (polite)', pos: 'Auxiliary', jlpt: 'N5', mastery: 'mastered' },
      { surface: '。', lemma: '。', meaning: '', pos: 'Punctuation', mastery: 'mastered' },
      { surface: '毎日', lemma: '毎日', reading: 'まいにち', meaning: 'every day', pos: 'Adverb', jlpt: 'N5', mastery: 'learning' },
      { surface: '学校', lemma: '学校', reading: 'がっこう', meaning: 'school', pos: 'Noun', jlpt: 'N5', mastery: 'known' },
      { surface: 'に', lemma: 'に', reading: 'に', meaning: 'to, at (direction)', pos: 'Particle', jlpt: 'N5', mastery: 'mastered' },
      { surface: '行きます', lemma: '行く', reading: 'いきます', meaning: 'to go', pos: 'Verb', jlpt: 'N5', mastery: 'known' },
      { surface: '。', lemma: '。', meaning: '', pos: 'Punctuation', mastery: 'mastered' },
      { surface: '日本語', lemma: '日本語', reading: 'にほんご', meaning: 'Japanese language', pos: 'Noun', jlpt: 'N5', mastery: 'learning' },
      { surface: 'を', lemma: 'を', reading: 'を', meaning: 'object marker', pos: 'Particle', jlpt: 'N5', mastery: 'mastered' },
      { surface: '勉強', lemma: '勉強', reading: 'べんきょう', meaning: 'study, diligence', pos: 'Noun (する verb)', jlpt: 'N4', mastery: 'seen' },
      { surface: 'して', lemma: 'する', reading: 'して', meaning: 'to do', pos: 'Verb', jlpt: 'N5', mastery: 'known' },
      { surface: 'います', lemma: 'いる', reading: 'います', meaning: 'to be (animate), progressive', pos: 'Auxiliary', jlpt: 'N5', mastery: 'learning' },
      { surface: '。', lemma: '。', meaning: '', pos: 'Punctuation', mastery: 'mastered' },
    ],
  },
  {
    label: 'N4 - Movie Date',
    level: 'N4',
    text: '昨日、友達と一緒に映画を見に行きました。とても面白かったです。',
    tokens: [
      { surface: '昨日', lemma: '昨日', reading: 'きのう', meaning: 'yesterday', pos: 'Noun', jlpt: 'N5', mastery: 'known' },
      { surface: '、', lemma: '、', meaning: '', pos: 'Punctuation', mastery: 'mastered' },
      { surface: '友達', lemma: '友達', reading: 'ともだち', meaning: 'friend', pos: 'Noun', jlpt: 'N5', mastery: 'known' },
      { surface: 'と', lemma: 'と', reading: 'と', meaning: 'with, and', pos: 'Particle', jlpt: 'N5', mastery: 'mastered' },
      { surface: '一緒に', lemma: '一緒', reading: 'いっしょに', meaning: 'together', pos: 'Adverb', jlpt: 'N4', mastery: 'learning' },
      { surface: '映画', lemma: '映画', reading: 'えいが', meaning: 'movie, film', pos: 'Noun', jlpt: 'N5', mastery: 'seen' },
      { surface: 'を', lemma: 'を', reading: 'を', meaning: 'object marker', pos: 'Particle', jlpt: 'N5', mastery: 'mastered' },
      { surface: '見に', lemma: '見る', reading: 'みに', meaning: 'to see, to watch', pos: 'Verb', jlpt: 'N5', mastery: 'known' },
      { surface: '行きました', lemma: '行く', reading: 'いきました', meaning: 'went', pos: 'Verb (past)', jlpt: 'N5', mastery: 'known' },
      { surface: '。', lemma: '。', meaning: '', pos: 'Punctuation', mastery: 'mastered' },
      { surface: 'とても', lemma: 'とても', reading: 'とても', meaning: 'very, greatly', pos: 'Adverb', jlpt: 'N5', mastery: 'mastered' },
      { surface: '面白かった', lemma: '面白い', reading: 'おもしろかった', meaning: 'was interesting/funny', pos: 'Adjective (past)', jlpt: 'N4', mastery: 'unknown' },
      { surface: 'です', lemma: 'です', reading: 'です', meaning: 'to be (polite)', pos: 'Auxiliary', jlpt: 'N5', mastery: 'mastered' },
      { surface: '。', lemma: '。', meaning: '', pos: 'Punctuation', mastery: 'mastered' },
    ],
  },
  {
    label: 'N3 - Culture',
    level: 'N3',
    text: '最近、日本の文化に興味を持つようになりました。特に伝統的な音楽が好きです。',
    tokens: [
      { surface: '最近', lemma: '最近', reading: 'さいきん', meaning: 'recently, lately', pos: 'Adverb', jlpt: 'N3', mastery: 'learning' },
      { surface: '、', lemma: '、', meaning: '', pos: 'Punctuation', mastery: 'mastered' },
      { surface: '日本', lemma: '日本', reading: 'にほん', meaning: 'Japan', pos: 'Noun', jlpt: 'N5', mastery: 'mastered' },
      { surface: 'の', lemma: 'の', reading: 'の', meaning: 'possessive particle', pos: 'Particle', jlpt: 'N5', mastery: 'mastered' },
      { surface: '文化', lemma: '文化', reading: 'ぶんか', meaning: 'culture', pos: 'Noun', jlpt: 'N3', mastery: 'unknown' },
      { surface: 'に', lemma: 'に', reading: 'に', meaning: 'to, at', pos: 'Particle', jlpt: 'N5', mastery: 'mastered' },
      { surface: '興味', lemma: '興味', reading: 'きょうみ', meaning: 'interest', pos: 'Noun', jlpt: 'N3', mastery: 'unknown' },
      { surface: 'を', lemma: 'を', reading: 'を', meaning: 'object marker', pos: 'Particle', jlpt: 'N5', mastery: 'mastered' },
      { surface: '持つ', lemma: '持つ', reading: 'もつ', meaning: 'to hold, to have', pos: 'Verb', jlpt: 'N4', mastery: 'seen' },
      { surface: 'ように', lemma: 'ようになる', reading: 'ように', meaning: 'so that, in order to', pos: 'Grammar', jlpt: 'N3', mastery: 'unknown' },
      { surface: 'なりました', lemma: 'なる', reading: 'なりました', meaning: 'became', pos: 'Verb (past)', jlpt: 'N4', mastery: 'learning' },
      { surface: '。', lemma: '。', meaning: '', pos: 'Punctuation', mastery: 'mastered' },
      { surface: '特に', lemma: '特に', reading: 'とくに', meaning: 'especially, particularly', pos: 'Adverb', jlpt: 'N3', mastery: 'seen' },
      { surface: '伝統的な', lemma: '伝統的', reading: 'でんとうてきな', meaning: 'traditional', pos: 'Na-adjective', jlpt: 'N3', mastery: 'unknown' },
      { surface: '音楽', lemma: '音楽', reading: 'おんがく', meaning: 'music', pos: 'Noun', jlpt: 'N4', mastery: 'learning' },
      { surface: 'が', lemma: 'が', reading: 'が', meaning: 'subject marker', pos: 'Particle', jlpt: 'N5', mastery: 'mastered' },
      { surface: '好き', lemma: '好き', reading: 'すき', meaning: 'like, fond of', pos: 'Na-adjective', jlpt: 'N5', mastery: 'known' },
      { surface: 'です', lemma: 'です', reading: 'です', meaning: 'to be (polite)', pos: 'Auxiliary', jlpt: 'N5', mastery: 'mastered' },
      { surface: '。', lemma: '。', meaning: '', pos: 'Punctuation', mastery: 'mastered' },
    ],
  },
]

// ── Mastery Styling ──────────────────────────────────────────────────────

const MASTERY_STYLE: Record<JpMasteryLevel, string> = {
  mastered: 'text-parchment',
  known: 'text-parchment',
  learning: 'text-icon-gold',
  seen: 'text-warm-gray',
  unknown: 'text-oxide-red underline decoration-oxide-red/40 decoration-dotted underline-offset-4',
}

// ── Helper Functions ─────────────────────────────────────────────────────

function isPunctuation(word: JpTokenizedWord): boolean {
  return word.pos === 'Punctuation' || /^[。、！？…・「」『』（）\s]+$/.test(word.surface)
}

function hasKanji(text: string): boolean {
  return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(text)
}

function computeStats(tokens: JpTokenizedWord[]) {
  const contentWords = tokens.filter((t) => !isPunctuation(t))
  const knownCount = contentWords.filter(
    (t) => t.mastery === 'known' || t.mastery === 'mastered'
  ).length
  const unknownCount = contentWords.filter((t) => t.mastery === 'unknown').length
  const knownPercent = contentWords.length > 0 ? Math.round((knownCount / contentWords.length) * 100) : 0

  // Simple difficulty score based on unknown/learning ratio
  const learningCount = contentWords.filter((t) => t.mastery === 'learning' || t.mastery === 'seen').length
  const difficulty = contentWords.length > 0
    ? Math.round((1 - (knownCount - learningCount * 0.3) / contentWords.length) * 10 * 10) / 10
    : 0

  return { knownPercent, unknownCount, difficulty: Math.max(0, Math.min(10, difficulty)) }
}

function getDifficultyLabel(score: number): string {
  if (score <= 2) return 'Beginner'
  if (score <= 4) return 'Lower Elementary'
  if (score <= 6) return 'Upper Elementary'
  if (score <= 8) return 'Intermediate'
  return 'Advanced'
}

// ── Component ────────────────────────────────────────────────────────────

export function ReadingPractice() {
  const { showFurigana, setShowFurigana, highlightUnknown, setHighlightUnknown } =
    useJapaneseStore()

  const [activeTokens, setActiveTokens] = useState<JpTokenizedWord[]>(SAMPLE_TEXTS[0].tokens)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 })
  const [showPasteInput, setShowPasteInput] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const stats = computeStats(activeTokens)

  // Close popup on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectedIndex(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleWordClick = useCallback(
    (index: number, e: React.MouseEvent) => {
      const word = activeTokens[index]
      if (isPunctuation(word)) return

      if (selectedIndex === index) {
        setSelectedIndex(null)
        return
      }

      const rect = (e.target as HTMLElement).getBoundingClientRect()
      setPopupPos({ x: rect.left, y: rect.bottom })
      setSelectedIndex(index)
    },
    [activeTokens, selectedIndex]
  )

  const handleMarkKnown = useCallback(
    (lemma: string) => {
      setActiveTokens((prev) =>
        prev.map((t) => (t.lemma === lemma ? { ...t, mastery: 'known' as const } : t))
      )
      setSelectedIndex(null)
    },
    []
  )

  const handleAddToSrs = useCallback(
    (_lemma: string) => {
      // In a full implementation, this would add the word to the SRS queue
      setSelectedIndex(null)
    },
    []
  )

  const handleViewInWeb = useCallback(
    (lemma: string) => {
      window.open(`https://jisho.org/search/${encodeURIComponent(lemma)}`, '_blank')
      setSelectedIndex(null)
    },
    []
  )

  const loadSample = useCallback((sample: SampleText) => {
    setActiveTokens(sample.tokens)
    setSelectedIndex(null)
    setShowPasteInput(false)
  }, [])

  const handlePaste = useCallback(() => {
    if (!pasteText.trim()) return
    // Simulate basic tokenization: split by character groups
    // In production, this would go through a proper tokenizer
    const simpleTokens: JpTokenizedWord[] = pasteText
      .split('')
      .map((char) => ({
        surface: char,
        lemma: char,
        meaning: '',
        pos: /[。、！？]/.test(char) ? 'Punctuation' : undefined,
        mastery: 'unknown' as const,
      }))
    setActiveTokens(simpleTokens)
    setShowPasteInput(false)
    setPasteText('')
    setSelectedIndex(null)
  }, [pasteText])

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BookOpen className="h-5 w-5 text-icon-gold" />
        <h2 className="font-serif text-xl text-parchment">Reading Practice</h2>
      </div>

      {/* Controls */}
      <div className="bg-charcoal-slate/50 border border-ash-stone/30 rounded-lg p-4 space-y-3">
        {/* Sample text buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setShowPasteInput(!showPasteInput)}
          >
            <Clipboard className="h-3.5 w-3.5 mr-1.5" />
            Paste Text
          </Button>
          {SAMPLE_TEXTS.map((sample) => (
            <Button
              key={sample.label}
              variant="ghost"
              size="sm"
              className="h-8 text-warm-gray hover:text-parchment"
              onClick={() => loadSample(sample)}
            >
              <Type className="h-3.5 w-3.5 mr-1.5" />
              {sample.label}
            </Button>
          ))}
        </div>

        {/* Paste input */}
        {showPasteInput && (
          <div className="space-y-2">
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste Japanese text here..."
              className="min-h-[80px] text-base"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowPasteInput(false)}>
                Cancel
              </Button>
              <Button variant="gold" size="sm" onClick={handlePaste}>
                Load Text
              </Button>
            </div>
          </div>
        )}

        {/* Toggles and stats */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <button
            onClick={() => setShowFurigana(!showFurigana)}
            className={cn(
              'flex items-center gap-1.5 transition-colors',
              showFurigana ? 'text-parchment' : 'text-warm-gray/50'
            )}
          >
            {showFurigana ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            Show Furigana
          </button>
          <button
            onClick={() => setHighlightUnknown(!highlightUnknown)}
            className={cn(
              'flex items-center gap-1.5 transition-colors',
              highlightUnknown ? 'text-parchment' : 'text-warm-gray/50'
            )}
          >
            {highlightUnknown ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            Highlight Unknown
          </button>

          <span className="text-warm-gray/40">|</span>

          <span className="text-warm-gray">
            Difficulty:{' '}
            <span className="text-parchment">
              {getDifficultyLabel(stats.difficulty)} ({stats.difficulty.toFixed(1)})
            </span>
          </span>

          <span className="text-warm-gray">
            Known:{' '}
            <span className="text-parchment">{stats.knownPercent}%</span>
          </span>

          <span className="text-warm-gray">
            Unknown:{' '}
            <span className="text-oxide-red">{stats.unknownCount} words</span>
          </span>
        </div>
      </div>

      {/* Reading Text Display */}
      <div className="bg-charcoal-slate/50 border border-ash-stone/30 rounded-lg p-6 md:p-8">
        <div className="text-xl md:text-2xl leading-[3rem] md:leading-[3.5rem] tracking-wide">
          {activeTokens.map((word, i) => {
            if (isPunctuation(word)) {
              return (
                <span key={i} className="text-warm-gray/60">
                  {word.surface}
                </span>
              )
            }

            const showReading =
              showFurigana && word.reading && word.reading !== word.surface && hasKanji(word.surface)
            const masteryClass = highlightUnknown
              ? MASTERY_STYLE[word.mastery]
              : 'text-parchment'

            return (
              <span
                key={i}
                className={cn(
                  'cursor-pointer transition-all duration-150 rounded-sm',
                  masteryClass,
                  selectedIndex === i && 'bg-icon-gold/20 ring-1 ring-icon-gold/40',
                  'hover:bg-ash-stone/40'
                )}
                onClick={(e) => handleWordClick(i, e)}
              >
                {showReading ? (
                  <ruby>
                    {word.surface}
                    <rt className="text-xs text-warm-gray/70 font-normal">{word.reading}</rt>
                  </ruby>
                ) : (
                  word.surface
                )}
              </span>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-ash-stone/20 text-xs text-warm-gray/60">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-parchment" />
            Known / Mastered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-icon-gold" />
            Learning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warm-gray" />
            Seen
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-oxide-red" />
            Unknown
          </span>
        </div>
      </div>

      {/* Word Popup */}
      {selectedIndex !== null && activeTokens[selectedIndex] && (
        <WordPopup
          word={activeTokens[selectedIndex]}
          position={popupPos}
          onClose={() => setSelectedIndex(null)}
          onMarkKnown={handleMarkKnown}
          onAddToSrs={handleAddToSrs}
          onViewInWeb={handleViewInWeb}
        />
      )}
    </div>
  )
}
