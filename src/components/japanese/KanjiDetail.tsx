import { useState, useEffect } from 'react'
import { useJapanese } from '@/hooks/useJapanese'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { X, Network, BookOpen, Layers, MessageSquare, Volume2, Loader2 } from 'lucide-react'
import type { JpKanji, JpVocabulary, JpRadical, JpAssociation, JpMasteryLevel, JpItemType } from '@/types'

// ── Mastery config ───────────────────────────────────────────────────

const MASTERY_CONFIG: Record<JpMasteryLevel, { label: string; className: string }> = {
  unknown: { label: 'Unknown', className: 'bg-warm-gray/20 text-warm-gray border-warm-gray/30' },
  seen: { label: 'Seen', className: 'bg-ash-stone/30 text-ash-stone border-ash-stone/40' },
  learning: { label: 'Learning', className: 'bg-icon-gold/20 text-icon-gold/80 border-icon-gold/30' },
  known: { label: 'Known', className: 'bg-verdigris/20 text-verdigris border-verdigris/30' },
  mastered: { label: 'Mastered', className: 'bg-icon-gold/20 text-icon-gold border-icon-gold/30' },
}

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  semantic: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  orthographic: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  phonological: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  collocational: 'bg-green-500/15 text-green-400 border-green-500/20',
  grammatical: 'bg-red-500/15 text-red-400 border-red-500/20',
  mnemonic: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
}

// ── Section component ────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="py-4 border-b border-ash-stone/30 last:border-b-0">
      <h4 className="flex items-center gap-2 text-xs font-semibold text-warm-gray uppercase tracking-wider mb-3">
        {icon}
        {title}
      </h4>
      <div>{children}</div>
    </div>
  )
}

// ── Resolved association for display ─────────────────────────────────

interface ResolvedAssociation {
  id: string
  character: string
  meaning: string
  category: string
  relation: string
  targetId: string
  targetType: JpItemType | 'sentence'
}

// ── Main Component ───────────────────────────────────────────────────

interface KanjiDetailProps {
  kanji: JpKanji
  mastery: JpMasteryLevel
  onClose?: () => void
  onViewInGraph?: (id: string) => void
  onNavigate?: (id: string, type: JpItemType) => void
  className?: string
}

export function KanjiDetail({
  kanji,
  mastery,
  onClose,
  onViewInGraph,
  className,
}: KanjiDetailProps) {
  const jp = useJapanese()
  const masteryInfo = MASTERY_CONFIG[mastery]

  const [vocab, setVocab] = useState<JpVocabulary[]>([])
  const [components, setComponents] = useState<{ component: JpRadical | JpKanji; type: string; position?: string }[]>([])
  const [associations, setAssociations] = useState<ResolvedAssociation[]>([])
  const [loadingVocab, setLoadingVocab] = useState(true)
  const [loadingComponents, setLoadingComponents] = useState(true)
  const [loadingAssociations, setLoadingAssociations] = useState(true)

  // Load vocabulary for this kanji
  useEffect(() => {
    let cancelled = false
    setLoadingVocab(true)

    async function load() {
      try {
        const data = await jp.getVocabForKanji(kanji.id)
        if (!cancelled) setVocab(data)
      } catch (err) {
        console.error('[KanjiDetail] Failed to load vocab:', err)
        if (!cancelled) setVocab([])
      } finally {
        if (!cancelled) setLoadingVocab(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [kanji.id, jp.getVocabForKanji])

  // Load components for this kanji
  useEffect(() => {
    let cancelled = false
    setLoadingComponents(true)

    async function load() {
      try {
        const data = await jp.getKanjiComponents(kanji.id)
        if (!cancelled) setComponents(data)
      } catch (err) {
        console.error('[KanjiDetail] Failed to load components:', err)
        if (!cancelled) setComponents([])
      } finally {
        if (!cancelled) setLoadingComponents(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [kanji.id, jp.getKanjiComponents])

  // Load associations for this kanji and resolve display info
  useEffect(() => {
    let cancelled = false
    setLoadingAssociations(true)

    async function load() {
      try {
        const assocs = await jp.getAssociationsForNode(kanji.id, 'kanji')
        if (cancelled) return

        // Resolve display info for each associated node
        const resolved: ResolvedAssociation[] = []
        for (const assoc of assocs) {
          const isSource = assoc.source_id === kanji.id
          const otherId = isSource ? assoc.target_id : assoc.source_id
          const otherType = isSource ? assoc.target_type : assoc.source_type
          if (otherType === 'sentence') continue

          let character = ''
          let meaning = ''
          try {
            if (otherType === 'kanji') {
              const k = await jp.getKanjiById(otherId)
              if (k) { character = k.character; meaning = k.meanings[0] }
            } else if (otherType === 'radical') {
              const r = await jp.getRadicalById(otherId)
              if (r) { character = r.character; meaning = r.meaning }
            } else if (otherType === 'word') {
              const v = await jp.getVocabById(otherId)
              if (v) { character = v.word; meaning = v.meanings[0] }
            } else if (otherType === 'grammar') {
              const g = await jp.getGrammarById(otherId)
              if (g) { character = g.pattern; meaning = g.meaning }
            }
          } catch {
            // Skip items that fail to load
          }

          if (character) {
            resolved.push({
              id: assoc.id,
              character,
              meaning,
              category: assoc.category,
              relation: assoc.relation,
              targetId: otherId,
              targetType: otherType,
            })
          }
        }

        if (!cancelled) setAssociations(resolved)
      } catch (err) {
        console.error('[KanjiDetail] Failed to load associations:', err)
        if (!cancelled) setAssociations([])
      } finally {
        if (!cancelled) setLoadingAssociations(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [kanji.id, jp.getAssociationsForNode, jp.getKanjiById, jp.getRadicalById, jp.getVocabById, jp.getGrammarById])

  const onReadings = kanji.on_readings ?? []
  const kunReadings = kanji.kun_readings ?? []
  const mnemonic = kanji.mnemonic_meaning || kanji.mnemonic_reading

  return (
    <div className={cn('flex flex-col h-full bg-obsidian', className)}>
      {/* Header with large character */}
      <div className="flex-shrink-0 p-5 border-b border-ash-stone/50">
        <div className="flex items-start gap-4">
          {/* Large character box */}
          <div className="w-24 h-24 rounded-lg bg-charcoal-slate border border-ash-stone/30 flex items-center justify-center shrink-0">
            <span className="text-7xl leading-none" style={{ fontFamily: 'system-ui, sans-serif' }}>
              {kanji.character}
            </span>
          </div>

          {/* Info beside character */}
          <div className="flex-1 min-w-0">
            {/* Readings */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-mono text-parchment">
                {kanji.character}
              </span>
              <span className="text-lg text-warm-gray">(</span>
              {kunReadings.length > 0 && (
                <span className="text-lg font-mono text-parchment">
                  {kunReadings[0].replace('.', '')}
                </span>
              )}
              {onReadings.length > 0 && (
                <>
                  <span className="text-warm-gray">/</span>
                  <span className="text-lg font-mono text-parchment">
                    {onReadings[0]}
                  </span>
                </>
              )}
              <span className="text-lg text-warm-gray">)</span>
            </div>

            {/* Meanings */}
            <p className="text-sm text-parchment/90 mb-2">
              {kanji.meanings.join(', ')}
            </p>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              {kanji.jlpt_level && (
                <Badge variant="outline" className="text-[10px] h-5">
                  JLPT N{kanji.jlpt_level}
                </Badge>
              )}
              {kanji.grade && (
                <Badge variant="outline" className="text-[10px] h-5">
                  Grade {kanji.grade}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] h-5">
                {kanji.stroke_count} strokes
              </Badge>
              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', masteryInfo.className)}>
                {masteryInfo.label}
              </span>
            </div>
          </div>

          {/* Close button */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1 px-5">
        {/* Mnemonic */}
        {mnemonic && (
          <Section title="Mnemonic" icon={<MessageSquare className="h-3 w-3" />}>
            <p className="text-sm text-warm-gray italic leading-relaxed">
              {mnemonic}
            </p>
            {kanji.mnemonic_reading && kanji.mnemonic_meaning && (
              <p className="text-sm text-warm-gray italic leading-relaxed mt-2">
                <span className="text-xs text-warm-gray/60 not-italic">Reading: </span>
                {kanji.mnemonic_reading}
              </p>
            )}
          </Section>
        )}

        {/* Components */}
        <Section title="Components" icon={<Layers className="h-3 w-3" />}>
          {loadingComponents ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-warm-gray" />
              <span className="text-xs text-warm-gray">Loading components...</span>
            </div>
          ) : components.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {components.map((comp) => {
                const char = 'character' in comp.component ? comp.component.character : ''
                const label = comp.type === 'radical'
                  ? (comp.component as JpRadical).meaning
                  : (comp.component as JpKanji).meanings[0]
                return (
                  <span
                    key={comp.component.id}
                    className="px-2 py-1 bg-charcoal-slate rounded border border-ash-stone/30 text-sm flex items-center gap-1.5"
                  >
                    <span className="text-base" style={{ fontFamily: 'system-ui, sans-serif' }}>
                      {char}
                    </span>
                    <span className="text-xs text-warm-gray">{label}</span>
                    <Badge variant="outline" className="text-[8px] h-3.5 px-1">
                      {comp.type}
                    </Badge>
                  </span>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-warm-gray">
              {kanji.character} is a pictographic/ideographic character (no sub-components)
            </p>
          )}
        </Section>

        {/* Readings */}
        <Section title="Readings" icon={<Volume2 className="h-3 w-3" />}>
          <div className="space-y-2">
            {onReadings.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-xs text-warm-gray w-16 shrink-0 pt-0.5">On&apos;yomi</span>
                <div className="flex flex-wrap gap-2">
                  {onReadings.map((r, i) => (
                    <span key={i} className="font-mono text-sm bg-charcoal-slate px-2 py-0.5 rounded">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {kunReadings.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-xs text-warm-gray w-16 shrink-0 pt-0.5">Kun&apos;yomi</span>
                <div className="flex flex-wrap gap-2">
                  {kunReadings.map((r, i) => (
                    <span key={i} className="font-mono text-sm bg-charcoal-slate px-2 py-0.5 rounded">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Vocabulary */}
        <Section title="Vocabulary" icon={<BookOpen className="h-3 w-3" />}>
          {loadingVocab ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-warm-gray" />
              <span className="text-xs text-warm-gray">Loading vocabulary...</span>
            </div>
          ) : vocab.length > 0 ? (
            <div className="space-y-1.5">
              {vocab.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-charcoal-slate/50 transition-colors"
                >
                  <span className="text-base font-mono" style={{ fontFamily: 'system-ui, sans-serif' }}>
                    {v.word}
                  </span>
                  <span className="text-xs text-warm-gray font-mono">({v.reading})</span>
                  <span className="text-xs text-warm-gray/80 ml-auto">{v.meanings.join(', ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-warm-gray">No vocabulary found for this kanji</p>
          )}
        </Section>

        {/* Phonetic series */}
        <Section title="Phonetic Series">
          {kanji.phonetic_component ? (
            <p className="text-sm">Part of the {kanji.phonetic_component} series</p>
          ) : (
            <p className="text-xs text-warm-gray">
              {kanji.character} is not part of a phonetic series
            </p>
          )}
        </Section>

        {/* Associations */}
        <Section title="Associations" icon={<Network className="h-3 w-3" />}>
          {loadingAssociations ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-warm-gray" />
              <span className="text-xs text-warm-gray">Loading associations...</span>
            </div>
          ) : associations.length > 0 ? (
            <div className="space-y-2">
              {(['semantic', 'orthographic', 'phonological', 'collocational', 'grammatical', 'mnemonic'] as const).map((cat) => {
                const catAssocs = associations.filter((a) => a.category === cat)
                if (catAssocs.length === 0) return null
                return (
                  <div key={cat}>
                    <span className="text-xs text-warm-gray capitalize">{cat}:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {catAssocs.map((a) => (
                        <span
                          key={a.id}
                          className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border', CATEGORY_BADGE_COLORS[cat] || '')}
                        >
                          <span className="text-base" style={{ fontFamily: 'system-ui, sans-serif' }}>
                            {a.character}
                          </span>
                          <span className="opacity-70">({a.meaning})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-warm-gray">No associations found</p>
          )}
        </Section>

        {/* View in graph */}
        {onViewInGraph && (
          <div className="py-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => onViewInGraph(kanji.id)}
            >
              <Network className="h-3.5 w-3.5" />
              View in Association Web
            </Button>
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-6" />
      </ScrollArea>
    </div>
  )
}
