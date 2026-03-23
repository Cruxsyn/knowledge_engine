import { useState, useMemo, useCallback } from 'react'
import { useJapaneseStore } from '@/stores/japaneseStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Search, Grid3X3, List, GitBranch } from 'lucide-react'
import type { JpKanji, JpMasteryLevel, JpItemType } from '@/types'

// ── Mock kanji data (N5 set) ─────────────────────────────────────────

interface KanjiEntry {
  kanji: JpKanji
  mastery: JpMasteryLevel
}

const MOCK_KANJI: KanjiEntry[] = [
  { kanji: { id: 'k-n5-1', character: '一', meanings: ['one'], on_readings: ['イチ', 'イツ'], kun_readings: ['ひと.つ'], jlpt_level: 5, grade: 1, stroke_count: 1, components: [], mnemonic: 'A single horizontal line - the number one' }, mastery: 'mastered' },
  { kanji: { id: 'k-n5-2', character: '二', meanings: ['two'], on_readings: ['ニ'], kun_readings: ['ふた.つ'], jlpt_level: 5, grade: 1, stroke_count: 2, components: [], mnemonic: 'Two horizontal lines stacked' }, mastery: 'mastered' },
  { kanji: { id: 'k-n5-3', character: '三', meanings: ['three'], on_readings: ['サン'], kun_readings: ['み.つ'], jlpt_level: 5, grade: 1, stroke_count: 3, components: [], mnemonic: 'Three horizontal lines' }, mastery: 'known' },
  { kanji: { id: 'k-n5-4', character: '四', meanings: ['four'], on_readings: ['シ'], kun_readings: ['よ.つ', 'よん'], jlpt_level: 5, grade: 1, stroke_count: 5, components: [], mnemonic: 'A window divided into four panes' }, mastery: 'known' },
  { kanji: { id: 'k-n5-5', character: '五', meanings: ['five'], on_readings: ['ゴ'], kun_readings: ['いつ.つ'], jlpt_level: 5, grade: 1, stroke_count: 4, components: [], mnemonic: 'Five strokes criss-crossing' }, mastery: 'learning' },
  { kanji: { id: 'k-n5-6', character: '六', meanings: ['six'], on_readings: ['ロク'], kun_readings: ['む.つ'], jlpt_level: 5, grade: 1, stroke_count: 4, components: [], mnemonic: 'A hat over two legs' }, mastery: 'learning' },
  { kanji: { id: 'k-n5-7', character: '七', meanings: ['seven'], on_readings: ['シチ'], kun_readings: ['なな.つ'], jlpt_level: 5, grade: 1, stroke_count: 2, components: [], mnemonic: 'An upside-down seven' }, mastery: 'seen' },
  { kanji: { id: 'k-n5-8', character: '八', meanings: ['eight'], on_readings: ['ハチ'], kun_readings: ['や.つ'], jlpt_level: 5, grade: 1, stroke_count: 2, components: [], mnemonic: 'Two strokes splitting apart like eight' }, mastery: 'mastered' },
  { kanji: { id: 'k-n5-9', character: '九', meanings: ['nine'], on_readings: ['キュウ', 'ク'], kun_readings: ['ここの.つ'], jlpt_level: 5, grade: 1, stroke_count: 2, components: [], mnemonic: 'A curling line - almost at ten' }, mastery: 'known' },
  { kanji: { id: 'k-n5-10', character: '十', meanings: ['ten'], on_readings: ['ジュウ', 'ジッ'], kun_readings: ['とお'], jlpt_level: 5, grade: 1, stroke_count: 2, components: [], mnemonic: 'A cross, like the plus sign for ten' }, mastery: 'mastered' },
  { kanji: { id: 'k-n5-11', character: '日', meanings: ['day', 'sun', 'Japan'], on_readings: ['ニチ', 'ジツ'], kun_readings: ['ひ', 'か'], jlpt_level: 5, grade: 1, stroke_count: 4, components: [], mnemonic: 'A sun framed in a window' }, mastery: 'mastered' },
  { kanji: { id: 'k-n5-12', character: '月', meanings: ['month', 'moon'], on_readings: ['ゲツ', 'ガツ'], kun_readings: ['つき'], jlpt_level: 5, grade: 1, stroke_count: 4, components: [], mnemonic: 'A crescent moon' }, mastery: 'known' },
  { kanji: { id: 'k-n5-13', character: '火', meanings: ['fire'], on_readings: ['カ'], kun_readings: ['ひ', 'ほ'], jlpt_level: 5, grade: 1, stroke_count: 4, components: [], mnemonic: 'Sparks flying from a person' }, mastery: 'learning' },
  { kanji: { id: 'k-n5-14', character: '水', meanings: ['water'], on_readings: ['スイ'], kun_readings: ['みず'], jlpt_level: 5, grade: 1, stroke_count: 4, components: [], mnemonic: 'Water cascading down a waterfall' }, mastery: 'known' },
  { kanji: { id: 'k-n5-15', character: '木', meanings: ['tree', 'wood'], on_readings: ['モク', 'ボク'], kun_readings: ['き', 'こ'], jlpt_level: 5, grade: 1, stroke_count: 4, components: [], mnemonic: 'A tree with branches and roots' }, mastery: 'mastered' },
  { kanji: { id: 'k-n5-16', character: '金', meanings: ['gold', 'money', 'metal'], on_readings: ['キン', 'コン'], kun_readings: ['かね', 'かな'], jlpt_level: 5, grade: 1, stroke_count: 8, components: [], mnemonic: 'A king sitting under a roof counting gold' }, mastery: 'learning' },
  { kanji: { id: 'k-n5-17', character: '土', meanings: ['earth', 'soil', 'ground'], on_readings: ['ド', 'ト'], kun_readings: ['つち'], jlpt_level: 5, grade: 1, stroke_count: 3, components: [], mnemonic: 'A cross planted in the ground' }, mastery: 'seen' },
  { kanji: { id: 'k-n5-18', character: '山', meanings: ['mountain', 'hill'], on_readings: ['サン', 'セン'], kun_readings: ['やま'], jlpt_level: 5, grade: 1, stroke_count: 3, components: [], mnemonic: 'Three peaks of a mountain' }, mastery: 'mastered' },
  { kanji: { id: 'k-n5-19', character: '川', meanings: ['river', 'stream'], on_readings: ['セン'], kun_readings: ['かわ'], jlpt_level: 5, grade: 1, stroke_count: 3, components: [], mnemonic: 'Three flowing streams of a river' }, mastery: 'mastered' },
  { kanji: { id: 'k-n5-20', character: '大', meanings: ['big', 'large', 'great'], on_readings: ['ダイ', 'タイ'], kun_readings: ['おお.きい'], jlpt_level: 5, grade: 1, stroke_count: 3, components: [], mnemonic: 'A person with arms spread wide - big!' }, mastery: 'mastered' },
  { kanji: { id: 'k-n5-21', character: '小', meanings: ['small', 'little'], on_readings: ['ショウ'], kun_readings: ['ちい.さい', 'こ', 'お'], jlpt_level: 5, grade: 1, stroke_count: 3, components: [], mnemonic: 'Small marks beside a line' }, mastery: 'known' },
  { kanji: { id: 'k-n5-22', character: '中', meanings: ['middle', 'center', 'inside'], on_readings: ['チュウ'], kun_readings: ['なか'], jlpt_level: 5, grade: 1, stroke_count: 4, components: [], mnemonic: 'A line through the center of a box' }, mastery: 'known' },
  { kanji: { id: 'k-n5-23', character: '人', meanings: ['person', 'people'], on_readings: ['ジン', 'ニン'], kun_readings: ['ひと'], jlpt_level: 5, grade: 1, stroke_count: 2, components: [], mnemonic: 'Two strokes leaning on each other like a person' }, mastery: 'mastered' },
  { kanji: { id: 'k-n5-24', character: '上', meanings: ['up', 'above', 'top'], on_readings: ['ジョウ', 'ショウ'], kun_readings: ['うえ', 'あ.がる', 'のぼ.る'], jlpt_level: 5, grade: 1, stroke_count: 3, components: [], mnemonic: 'A vertical line rising above the ground' }, mastery: 'known' },
  { kanji: { id: 'k-n5-25', character: '下', meanings: ['down', 'below', 'under'], on_readings: ['カ', 'ゲ'], kun_readings: ['した', 'さ.がる', 'くだ.る'], jlpt_level: 5, grade: 1, stroke_count: 3, components: [], mnemonic: 'A mark below the baseline' }, mastery: 'known' },
  { kanji: { id: 'k-n5-26', character: '右', meanings: ['right'], on_readings: ['ウ', 'ユウ'], kun_readings: ['みぎ'], jlpt_level: 5, grade: 1, stroke_count: 5, components: [], mnemonic: 'A hand (right side) reaching for food (mouth)' }, mastery: 'learning' },
  { kanji: { id: 'k-n5-27', character: '左', meanings: ['left'], on_readings: ['サ'], kun_readings: ['ひだり'], jlpt_level: 5, grade: 1, stroke_count: 5, components: [], mnemonic: 'A hand on the left doing work' }, mastery: 'learning' },
  { kanji: { id: 'k-n5-28', character: '男', meanings: ['man', 'male'], on_readings: ['ダン', 'ナン'], kun_readings: ['おとこ'], jlpt_level: 5, grade: 1, stroke_count: 7, components: ['k-n5-17'], mnemonic: 'Strength (force) in the rice field - a man working' }, mastery: 'seen' },
  { kanji: { id: 'k-n5-29', character: '女', meanings: ['woman', 'female'], on_readings: ['ジョ', 'ニョ'], kun_readings: ['おんな'], jlpt_level: 5, grade: 1, stroke_count: 3, components: [], mnemonic: 'A graceful figure with arms crossed' }, mastery: 'known' },
  { kanji: { id: 'k-n5-30', character: '子', meanings: ['child', 'offspring'], on_readings: ['シ', 'ス'], kun_readings: ['こ'], jlpt_level: 5, grade: 1, stroke_count: 3, components: [], mnemonic: 'A baby with arms outstretched' }, mastery: 'mastered' },
]

// Component hierarchy for the components view
const COMPONENT_TREE: { radical: string; meaning: string; kanji: string[] }[] = [
  { radical: '一', meaning: 'one', kanji: ['一', '二', '三', '上', '下'] },
  { radical: '日', meaning: 'sun/day', kanji: ['日', '月'] },
  { radical: '木', meaning: 'tree', kanji: ['木'] },
  { radical: '水', meaning: 'water', kanji: ['水'] },
  { radical: '火', meaning: 'fire', kanji: ['火'] },
  { radical: '土', meaning: 'earth', kanji: ['土', '金'] },
  { radical: '人', meaning: 'person', kanji: ['人', '大', '女', '男'] },
  { radical: '口', meaning: 'mouth', kanji: ['四', '中', '右'] },
  { radical: '山', meaning: 'mountain', kanji: ['山'] },
  { radical: '川', meaning: 'river', kanji: ['川'] },
  { radical: '子', meaning: 'child', kanji: ['子'] },
]

// ── Mastery config ───────────────────────────────────────────────────

const MASTERY_BAR_COLORS: Record<JpMasteryLevel, string> = {
  unknown: 'bg-warm-gray/30',
  seen: 'bg-ash-stone/50',
  learning: 'bg-icon-gold/50',
  known: 'bg-verdigris',
  mastered: 'bg-icon-gold',
}

// ── Component ────────────────────────────────────────────────────────

interface KanjiBrowserProps {
  onKanjiSelect?: (id: string) => void
  onViewInGraph?: (id: string) => void
  className?: string
}

export function KanjiBrowser({ onKanjiSelect, onViewInGraph, className }: KanjiBrowserProps) {
  const {
    kanjiJlptFilter,
    setKanjiJlptFilter,
    kanjiSearchQuery,
    setKanjiSearchQuery,
    kanjiBrowserView,
    setKanjiBrowserView,
  } = useJapaneseStore()

  const [selectedKanjiId, setSelectedKanjiId] = useState<string | null>(null)

  const filteredKanji = useMemo(() => {
    let result = MOCK_KANJI

    // Filter by JLPT level
    if (kanjiJlptFilter !== null) {
      result = result.filter((k) => k.kanji.jlpt_level === kanjiJlptFilter)
    }

    // Filter by search query
    if (kanjiSearchQuery.trim()) {
      const q = kanjiSearchQuery.trim().toLowerCase()
      result = result.filter(
        (k) =>
          k.kanji.character.includes(q) ||
          k.kanji.meanings.some((m) => m.toLowerCase().includes(q)) ||
          k.kanji.on_readings.some((r) => r.toLowerCase().includes(q)) ||
          k.kanji.kun_readings.some((r) => r.toLowerCase().includes(q)),
      )
    }

    return result
  }, [kanjiJlptFilter, kanjiSearchQuery])

  const handleKanjiClick = useCallback(
    (entry: KanjiEntry) => {
      setSelectedKanjiId(entry.kanji.id)
      onKanjiSelect?.(entry.kanji.id)
    },
    [onKanjiSelect],
  )

  // Stats
  const stats = useMemo(() => {
    const total = filteredKanji.length
    const mastered = filteredKanji.filter((k) => k.mastery === 'mastered').length
    const known = filteredKanji.filter((k) => k.mastery === 'known').length
    const learning = filteredKanji.filter((k) => k.mastery === 'learning').length
    return { total, mastered, known, learning }
  }, [filteredKanji])

  return (
    <div className={cn('flex flex-col h-full bg-obsidian', className)}>
      {/* Filters bar */}
      <div className="flex-shrink-0 p-3 border-b border-ash-stone/50 space-y-3">
        {/* JLPT filter + view toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-warm-gray mr-1">JLPT:</span>
            {[5, 4, 3, 2, 1].map((level) => (
              <Button
                key={level}
                variant={kanjiJlptFilter === level ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setKanjiJlptFilter(kanjiJlptFilter === level ? null : level)}
              >
                N{level}
              </Button>
            ))}
            <Button
              variant={kanjiJlptFilter === null ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setKanjiJlptFilter(null)}
            >
              All
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant={kanjiBrowserView === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setKanjiBrowserView('grid')}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={kanjiBrowserView === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setKanjiBrowserView('list')}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={kanjiBrowserView === 'components' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setKanjiBrowserView('components')}
            >
              <GitBranch className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Search + stats */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-warm-gray" />
            <Input
              value={kanjiSearchQuery}
              onChange={(e) => setKanjiSearchQuery(e.target.value)}
              placeholder="Search kanji by character, meaning, or reading..."
              className="pl-8 h-8 text-xs bg-charcoal-slate"
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-warm-gray whitespace-nowrap">
            <span>{stats.total} kanji</span>
            <span className="text-icon-gold">{stats.mastered} mastered</span>
            <span className="text-verdigris">{stats.known} known</span>
            <span className="text-icon-gold/60">{stats.learning} learning</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {kanjiBrowserView === 'grid' && (
          <GridView
            kanji={filteredKanji}
            selectedId={selectedKanjiId}
            onSelect={handleKanjiClick}
            onViewInGraph={onViewInGraph}
          />
        )}
        {kanjiBrowserView === 'list' && (
          <ListView
            kanji={filteredKanji}
            selectedId={selectedKanjiId}
            onSelect={handleKanjiClick}
            onViewInGraph={onViewInGraph}
          />
        )}
        {kanjiBrowserView === 'components' && (
          <ComponentsView
            kanji={filteredKanji}
            onSelect={handleKanjiClick}
          />
        )}
      </ScrollArea>
    </div>
  )
}

// ── Grid View ────────────────────────────────────────────────────────

function GridView({
  kanji,
  selectedId,
  onSelect,
  onViewInGraph,
}: {
  kanji: KanjiEntry[]
  selectedId: string | null
  onSelect: (entry: KanjiEntry) => void
  onViewInGraph?: (id: string) => void
}) {
  return (
    <div className="p-3 grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
      {kanji.map((entry) => {
        const isSelected = selectedId === entry.kanji.id
        return (
          <button
            key={entry.kanji.id}
            onClick={() => onSelect(entry)}
            onDoubleClick={() => onViewInGraph?.(entry.kanji.id)}
            className={cn(
              'flex flex-col items-center p-3 rounded-lg border transition-all cursor-pointer text-center',
              isSelected
                ? 'bg-charcoal-slate border-icon-gold/40 shadow-[0_0_12px_rgba(200,162,74,0.1)]'
                : 'bg-charcoal-slate/50 border-ash-stone/30 hover:border-ash-stone/60 hover:bg-charcoal-slate',
            )}
          >
            {/* Character */}
            <span className="text-4xl leading-none mb-1.5" style={{ fontFamily: 'system-ui, sans-serif' }}>
              {entry.kanji.character}
            </span>

            {/* Meaning */}
            <span className="text-[10px] text-warm-gray truncate w-full">
              {entry.kanji.meanings[0]}
            </span>

            {/* JLPT badge */}
            <span className="text-[9px] text-warm-gray/60 mt-0.5">
              N{entry.kanji.jlpt_level}
            </span>

            {/* Mastery bar */}
            <div className="w-full h-1 rounded-full bg-ash-stone/20 mt-1.5 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', MASTERY_BAR_COLORS[entry.mastery])}
                style={{
                  width:
                    entry.mastery === 'mastered'
                      ? '100%'
                      : entry.mastery === 'known'
                        ? '75%'
                        : entry.mastery === 'learning'
                          ? '50%'
                          : entry.mastery === 'seen'
                            ? '25%'
                            : '5%',
                }}
              />
            </div>
          </button>
        )
      })}

      {kanji.length === 0 && (
        <div className="col-span-full flex items-center justify-center py-12">
          <p className="text-sm text-warm-gray">No kanji match your filters</p>
        </div>
      )}
    </div>
  )
}

// ── List View ────────────────────────────────────────────────────────

function ListView({
  kanji,
  selectedId,
  onSelect,
  onViewInGraph,
}: {
  kanji: KanjiEntry[]
  selectedId: string | null
  onSelect: (entry: KanjiEntry) => void
  onViewInGraph?: (id: string) => void
}) {
  return (
    <div className="p-2">
      {kanji.map((entry) => {
        const isSelected = selectedId === entry.kanji.id
        return (
          <button
            key={entry.kanji.id}
            onClick={() => onSelect(entry)}
            className={cn(
              'flex items-center gap-3 w-full p-2 rounded-lg transition-all cursor-pointer text-left',
              isSelected
                ? 'bg-charcoal-slate border border-icon-gold/30'
                : 'hover:bg-charcoal-slate/50 border border-transparent',
            )}
          >
            {/* Character */}
            <span className="text-3xl w-12 text-center shrink-0" style={{ fontFamily: 'system-ui, sans-serif' }}>
              {entry.kanji.character}
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-parchment">{entry.kanji.meanings.join(', ')}</span>
                <Badge variant="outline" className="text-[9px] h-4 px-1">
                  N{entry.kanji.jlpt_level}
                </Badge>
              </div>
              <div className="text-xs text-warm-gray mt-0.5">
                <span className="font-mono">{entry.kanji.on_readings.join(', ')}</span>
                {entry.kanji.kun_readings.length > 0 && (
                  <>
                    <span className="mx-1.5 text-ash-stone">|</span>
                    <span className="font-mono">{entry.kanji.kun_readings.join(', ')}</span>
                  </>
                )}
              </div>
            </div>

            {/* Mastery + strokes */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-warm-gray">{entry.kanji.stroke_count} str.</span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded',
                  entry.mastery === 'mastered' && 'bg-icon-gold/20 text-icon-gold',
                  entry.mastery === 'known' && 'bg-verdigris/20 text-verdigris',
                  entry.mastery === 'learning' && 'bg-icon-gold/15 text-icon-gold/70',
                  entry.mastery === 'seen' && 'bg-ash-stone/30 text-ash-stone',
                  entry.mastery === 'unknown' && 'bg-warm-gray/15 text-warm-gray/60',
                )}
              >
                {entry.mastery}
              </span>
              {onViewInGraph && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewInGraph(entry.kanji.id)
                  }}
                >
                  <GitBranch className="h-3 w-3" />
                </Button>
              )}
            </div>
          </button>
        )
      })}

      {kanji.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-warm-gray">No kanji match your filters</p>
        </div>
      )}
    </div>
  )
}

// ── Components (Tree) View ───────────────────────────────────────────

function ComponentsView({
  kanji,
  onSelect,
}: {
  kanji: KanjiEntry[]
  onSelect: (entry: KanjiEntry) => void
}) {
  const kanjiMap = useMemo(() => {
    const map = new Map<string, KanjiEntry>()
    for (const k of kanji) {
      map.set(k.kanji.character, k)
    }
    return map
  }, [kanji])

  return (
    <div className="p-3 space-y-4">
      {COMPONENT_TREE.map((group) => {
        const visibleKanji = group.kanji
          .map((c) => kanjiMap.get(c))
          .filter(Boolean) as KanjiEntry[]
        if (visibleKanji.length === 0) return null

        return (
          <div key={group.radical} className="border border-ash-stone/30 rounded-lg p-3">
            {/* Radical header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl" style={{ fontFamily: 'system-ui, sans-serif' }}>
                {group.radical}
              </span>
              <div>
                <span className="text-xs text-warm-gray">{group.meaning}</span>
                <Badge variant="outline" className="text-[9px] h-4 px-1 ml-2">
                  radical
                </Badge>
              </div>
            </div>

            {/* Child kanji */}
            <div className="flex flex-wrap gap-1.5 pl-4 border-l-2 border-ash-stone/20 ml-3">
              {visibleKanji.map((entry) => (
                <button
                  key={entry.kanji.id}
                  onClick={() => onSelect(entry)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-charcoal-slate/50 border border-ash-stone/20 hover:border-ash-stone/50 transition-colors cursor-pointer"
                >
                  <span className="text-xl" style={{ fontFamily: 'system-ui, sans-serif' }}>
                    {entry.kanji.character}
                  </span>
                  <span className="text-[10px] text-warm-gray">{entry.kanji.meanings[0]}</span>
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      MASTERY_BAR_COLORS[entry.mastery],
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
