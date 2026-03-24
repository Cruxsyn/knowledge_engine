import { useState, useMemo, useCallback, useEffect } from 'react'
import { useJapaneseStore } from '@/stores/japaneseStore'
import { useJapanese } from '@/hooks/useJapanese'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Search, Grid3X3, List, GitBranch, Loader2 } from 'lucide-react'
import { InlineSpeakButton } from './SpeakButton'
import type { JpKanji, JpMasteryLevel, JpRadical } from '@/types'

// ── Types ───────────────────────────────────────────────────────────

interface KanjiEntry {
  kanji: JpKanji
  mastery: JpMasteryLevel
}

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

  const jp = useJapanese()

  const [kanjiList, setKanjiList] = useState<JpKanji[]>([])
  const [radicals, setRadicals] = useState<JpRadical[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKanjiId, setSelectedKanjiId] = useState<string | null>(null)

  // Load kanji when JLPT filter changes
  useEffect(() => {
    let cancelled = false

    async function loadKanji() {
      setLoading(true)
      try {
        const data = await jp.getAllKanji(kanjiJlptFilter ?? undefined)
        if (!cancelled) setKanjiList(data)
      } catch (err) {
        console.error('[KanjiBrowser] Failed to load kanji:', err)
        if (!cancelled) setKanjiList([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadKanji()
    return () => { cancelled = true }
  }, [kanjiJlptFilter, jp.getAllKanji])

  // Load radicals for components view
  useEffect(() => {
    if (kanjiBrowserView !== 'components') return
    let cancelled = false

    async function loadRadicals() {
      try {
        const data = await jp.getAllRadicals()
        if (!cancelled) setRadicals(data)
      } catch (err) {
        console.error('[KanjiBrowser] Failed to load radicals:', err)
      }
    }

    loadRadicals()
    return () => { cancelled = true }
  }, [kanjiBrowserView, jp.getAllRadicals])

  // Map kanji to KanjiEntry with mastery (default to 'unknown' for now)
  // TODO: Load SRS cards in batch to determine actual mastery
  const kanjiEntries = useMemo<KanjiEntry[]>(() => {
    return kanjiList.map((kanji) => ({
      kanji,
      mastery: 'unknown' as JpMasteryLevel,
    }))
  }, [kanjiList])

  const filteredKanji = useMemo(() => {
    let result = kanjiEntries

    // Filter by search query
    if (kanjiSearchQuery.trim()) {
      const q = kanjiSearchQuery.trim().toLowerCase()
      result = result.filter(
        (k) =>
          k.kanji.character.includes(q) ||
          k.kanji.meanings.some((m) => m.toLowerCase().includes(q)) ||
          (k.kanji.on_readings ?? []).some((r) => r.toLowerCase().includes(q)) ||
          (k.kanji.kun_readings ?? []).some((r) => r.toLowerCase().includes(q)),
      )
    }

    return result
  }, [kanjiEntries, kanjiSearchQuery])

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

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-obsidian', className)}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-warm-gray" />
          <p className="text-sm text-warm-gray">Loading kanji...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full bg-obsidian', className)}>
      {/* Filters bar */}
      <div className="flex-shrink-0 p-3 border-b border-ash-stone/20 space-y-3">
        {/* JLPT filter + view toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-warm-gray mr-1">JLPT:</span>
            {[5, 4, 3, 2, 1].map((level) => (
              <Button
                key={level}
                variant={kanjiJlptFilter === level ? 'default' : 'outline'}
                size="sm"
                className="h-6 px-2 text-xs rounded-full"
                onClick={() => setKanjiJlptFilter(kanjiJlptFilter === level ? null : level)}
              >
                N{level}
              </Button>
            ))}
            <Button
              variant={kanjiJlptFilter === null ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2 text-xs rounded-full"
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
          <div className="flex items-center gap-2 font-mono text-xs text-warm-gray whitespace-nowrap">
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
            radicals={radicals}
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
              'flex flex-col items-center p-2.5 rounded border transition-all cursor-pointer text-center',
              isSelected
                ? 'bg-charcoal-slate border-icon-gold/30'
                : 'bg-charcoal-slate/50 border-ash-stone/20 hover:border-ash-stone/40 hover:bg-charcoal-slate',
            )}
          >
            {/* Character */}
            <span className="text-4xl leading-none mb-1.5" style={{ fontFamily: 'system-ui, sans-serif' }}>
              {entry.kanji.character}
            </span>

            {/* Meaning + audio */}
            <div className="flex items-center gap-0.5 w-full justify-center">
              <span className="text-[10px] text-warm-gray truncate">
                {entry.kanji.meanings[0]}
              </span>
              <InlineSpeakButton
                text={(entry.kanji.kun_readings?.[0]?.replace('.', '') || entry.kanji.on_readings?.[0] || entry.kanji.character)}
              />
            </div>

            {/* JLPT badge */}
            {entry.kanji.jlpt_level && (
              <span className="text-[9px] text-warm-gray/60 mt-0.5">
                N{entry.kanji.jlpt_level}
              </span>
            )}

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
        const onReadings = entry.kanji.on_readings ?? []
        const kunReadings = entry.kanji.kun_readings ?? []
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
                {entry.kanji.jlpt_level && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1">
                    N{entry.kanji.jlpt_level}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-warm-gray mt-0.5">
                <span className="font-mono">{onReadings.join(', ')}</span>
                {kunReadings.length > 0 && (
                  <>
                    <span className="mx-1.5 text-ash-stone">|</span>
                    <span className="font-mono">{kunReadings.join(', ')}</span>
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
  radicals,
  kanji,
  onSelect,
}: {
  radicals: JpRadical[]
  kanji: KanjiEntry[]
  onSelect: (entry: KanjiEntry) => void
}) {
  // Build a map from kanji character to KanjiEntry for quick lookup
  const kanjiCharMap = useMemo(() => {
    const map = new Map<string, KanjiEntry>()
    for (const k of kanji) {
      map.set(k.kanji.character, k)
    }
    return map
  }, [kanji])

  if (radicals.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-warm-gray">No radicals found in the database</p>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-4">
      {radicals.map((radical) => {
        // Find kanji that contain this radical character as a component
        // We match by character since the component relationship is in the DB
        const matchingKanji = kanji.filter((entry) => {
          // Simple heuristic: check if kanji character visually relates to radical
          // For a proper implementation, this would use getKanjiComponents
          // but for the browser view we show all kanji alongside their radicals
          return entry.kanji.character !== radical.character
        })

        // For now, show all loaded kanji alongside radicals as a browsable list
        // A more precise mapping would require batch-loading component relationships

        return (
          <div key={radical.id} className="border border-ash-stone/20 rounded p-3">
            {/* Radical header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl" style={{ fontFamily: 'system-ui, sans-serif' }}>
                {radical.character}
              </span>
              <div>
                <span className="text-xs text-warm-gray">{radical.meaning}</span>
                <Badge variant="outline" className="text-[9px] h-4 px-1 ml-2">
                  radical
                </Badge>
              </div>
              <span className="text-[10px] text-warm-gray/60 ml-auto">
                {radical.stroke_count} strokes
              </span>
            </div>

            {/* Kanji that share this radical character in their composition */}
            {kanjiCharMap.size > 0 && (
              <div className="flex flex-wrap gap-1.5 pl-4 border-l-2 border-ash-stone/20 ml-3">
                {kanji
                  .filter((entry) => {
                    // Show kanji whose character includes the radical character
                    // or whose semantic/phonetic component references the radical
                    return (
                      entry.kanji.semantic_component === radical.id ||
                      entry.kanji.phonetic_component === radical.id
                    )
                  })
                  .map((entry) => (
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
            )}
          </div>
        )
      })}
    </div>
  )
}
