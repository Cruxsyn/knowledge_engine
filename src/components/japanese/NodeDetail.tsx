import { useState, useEffect, useMemo } from 'react'
import { useJapaneseStore } from '@/stores/japaneseStore'
import { useJapanese } from '@/hooks/useJapanese'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { X, Network, BookOpen, Layers, MessageSquare, Loader2 } from 'lucide-react'
import type {
  JpGraphNode,
  JpGraphEdge,
  JpGraphData,
  JpItemType,
  JpKanji,
  JpRadical,
  JpVocabulary,
  JpGrammar,
  JpMasteryLevel,
  JpAssociationCategory,
  JpAssociation,
} from '@/types'

// ── Mastery display config ───────────────────────────────────────────

const MASTERY_CONFIG: Record<JpMasteryLevel, { label: string; className: string }> = {
  unknown: { label: 'Unknown', className: 'bg-warm-gray/20 text-warm-gray border-warm-gray/30' },
  seen: { label: 'Seen', className: 'bg-ash-stone/30 text-ash-stone border-ash-stone/40' },
  learning: { label: 'Learning', className: 'bg-icon-gold/20 text-icon-gold/80 border-icon-gold/30' },
  known: { label: 'Known', className: 'bg-verdigris/20 text-verdigris border-verdigris/30' },
  mastered: { label: 'Mastered', className: 'bg-icon-gold/20 text-icon-gold border-icon-gold/30' },
}

const CATEGORY_COLORS: Record<JpAssociationCategory, string> = {
  semantic: 'text-purple-400',
  phonological: 'text-orange-400',
  orthographic: 'text-blue-400',
  collocational: 'text-green-400',
  grammatical: 'text-red-400',
  mnemonic: 'text-gray-400',
}

// ── Section component ────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-ash-stone/30 last:border-b-0">
      <h4 className="flex items-center gap-2 text-xs font-semibold text-warm-gray uppercase tracking-wider mb-2">
        {icon}
        {title}
      </h4>
      <div className="text-sm text-parchment/90">{children}</div>
    </div>
  )
}

// ── Type-specific detail renderers ───────────────────────────────────

function RadicalDetail({
  data,
  edges,
  allNodes,
  onNavigate,
}: {
  data: JpRadical
  edges: JpGraphEdge[]
  allNodes: JpGraphNode[]
  onNavigate: (id: string, type: JpItemType) => void
}) {
  const kanjiWithThis = edges
    .filter((e) => e.source === data.id && e.relation === 'CONTAINS_COMPONENT')
    .map((e) => allNodes.find((n) => n.id === e.target))
    .filter(Boolean) as JpGraphNode[]

  return (
    <>
      {data.mnemonic && (
        <Section title="Mnemonic" icon={<MessageSquare className="h-3 w-3" />}>
          <p className="italic text-warm-gray">{data.mnemonic}</p>
        </Section>
      )}

      <Section title="Details" icon={<BookOpen className="h-3 w-3" />}>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-warm-gray">Meaning</span>
            <span>{data.meaning}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-warm-gray">Strokes</span>
            <span>{data.stroke_count}</span>
          </div>
        </div>
      </Section>

      {kanjiWithThis.length > 0 && (
        <Section title="Kanji with this radical" icon={<Layers className="h-3 w-3" />}>
          <div className="flex flex-wrap gap-2">
            {kanjiWithThis.map((node) => (
              <button
                key={node.id}
                onClick={() => onNavigate(node.id, node.type)}
                className="px-2 py-1 bg-charcoal-slate rounded border border-ash-stone/30 hover:border-icon-gold/40 transition-colors cursor-pointer"
              >
                <span className="text-lg">{node.label}</span>
                {node.sublabel && (
                  <span className="text-xs text-warm-gray ml-1.5">{node.sublabel}</span>
                )}
              </button>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}

function KanjiDetailPanel({
  data,
  edges,
  allNodes,
  onNavigate,
}: {
  data: JpKanji
  edges: JpGraphEdge[]
  allNodes: JpGraphNode[]
  onNavigate: (id: string, type: JpItemType) => void
}) {
  const components = edges
    .filter((e) => e.target === data.id && e.relation === 'CONTAINS_COMPONENT')
    .map((e) => allNodes.find((n) => n.id === e.source))
    .filter(Boolean) as JpGraphNode[]

  const vocabulary = edges
    .filter((e) => e.source === data.id && e.relation === 'COMPOUND_WORD')
    .map((e) => allNodes.find((n) => n.id === e.target))
    .filter(Boolean) as JpGraphNode[]

  const semanticLinks = edges
    .filter((e) => e.category === 'semantic' && (e.source === data.id || e.target === data.id))
    .map((e) => {
      const otherId = e.source === data.id ? e.target : e.source
      return allNodes.find((n) => n.id === otherId)
    })
    .filter(Boolean) as JpGraphNode[]

  const onReadings = data.on_readings ?? []
  const kunReadings = data.kun_readings ?? []
  const mnemonic = data.mnemonic_meaning || data.mnemonic_reading

  return (
    <>
      {mnemonic && (
        <Section title="Mnemonic" icon={<MessageSquare className="h-3 w-3" />}>
          <p className="italic text-warm-gray">{mnemonic}</p>
        </Section>
      )}

      <Section title="Readings" icon={<BookOpen className="h-3 w-3" />}>
        <div className="space-y-1">
          {onReadings.length > 0 && (
            <div className="flex gap-2">
              <span className="text-warm-gray text-xs w-16 shrink-0">On&apos;yomi</span>
              <span className="font-mono">{onReadings.join('  ·  ')}</span>
            </div>
          )}
          {kunReadings.length > 0 && (
            <div className="flex gap-2">
              <span className="text-warm-gray text-xs w-16 shrink-0">Kun&apos;yomi</span>
              <span className="font-mono">{kunReadings.join('  ·  ')}</span>
            </div>
          )}
        </div>
      </Section>

      <Section title="Info">
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-warm-gray">Meanings</span>
            <span>{data.meanings.join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-warm-gray">Strokes</span>
            <span>{data.stroke_count}</span>
          </div>
          {data.grade && (
            <div className="flex justify-between">
              <span className="text-warm-gray">Grade</span>
              <span>{data.grade}</span>
            </div>
          )}
          {data.jlpt_level && (
            <div className="flex justify-between">
              <span className="text-warm-gray">JLPT</span>
              <span>N{data.jlpt_level}</span>
            </div>
          )}
        </div>
      </Section>

      {components.length > 0 && (
        <Section title="Components" icon={<Layers className="h-3 w-3" />}>
          <div className="flex flex-wrap gap-2">
            {components.map((node) => (
              <button
                key={node.id}
                onClick={() => onNavigate(node.id, node.type)}
                className="px-2 py-1 bg-charcoal-slate rounded border border-ash-stone/30 hover:border-icon-gold/40 transition-colors cursor-pointer"
              >
                <span className="text-lg">{node.label}</span>
                {node.sublabel && (
                  <span className="text-xs text-warm-gray ml-1.5">{node.sublabel}</span>
                )}
              </button>
            ))}
          </div>
        </Section>
      )}

      {vocabulary.length > 0 && (
        <Section title="Vocabulary">
          <div className="space-y-1.5">
            {vocabulary.map((node) => (
              <button
                key={node.id}
                onClick={() => onNavigate(node.id, node.type)}
                className="block w-full text-left px-2 py-1 rounded hover:bg-charcoal-slate transition-colors cursor-pointer"
              >
                <span className="text-base">{node.label}</span>
                {node.sublabel && (
                  <span className="text-xs text-warm-gray ml-2">{node.sublabel}</span>
                )}
              </button>
            ))}
          </div>
        </Section>
      )}

      {semanticLinks.length > 0 && (
        <Section title="Associations">
          <div className="flex flex-wrap gap-2">
            {semanticLinks.map((node) => (
              <button
                key={node.id}
                onClick={() => onNavigate(node.id, node.type)}
                className="px-2 py-1 bg-charcoal-slate rounded border border-ash-stone/30 hover:border-icon-gold/40 transition-colors cursor-pointer"
              >
                <span className="text-lg">{node.label}</span>
                {node.sublabel && (
                  <span className="text-xs text-warm-gray ml-1.5">{node.sublabel}</span>
                )}
              </button>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}

function VocabDetail({
  data,
  edges,
  allNodes,
  onNavigate,
}: {
  data: JpVocabulary
  edges: JpGraphEdge[]
  allNodes: JpGraphNode[]
  onNavigate: (id: string, type: JpItemType) => void
}) {
  const kanjiBreakdown = edges
    .filter((e) => e.target === data.id && e.relation === 'COMPOUND_WORD')
    .map((e) => allNodes.find((n) => n.id === e.source))
    .filter(Boolean) as JpGraphNode[]

  return (
    <>
      <Section title="Readings">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-warm-gray">Reading</span>
            <span className="font-mono">{data.reading}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-warm-gray">Meanings</span>
            <span>{data.meanings.join(', ')}</span>
          </div>
          {data.part_of_speech && (
            <div className="flex justify-between">
              <span className="text-warm-gray">Part of speech</span>
              <span className="text-xs">{data.part_of_speech}</span>
            </div>
          )}
          {data.pitch_accent && (
            <div className="flex justify-between">
              <span className="text-warm-gray">Pitch accent</span>
              <span className="font-mono text-xs">{data.pitch_accent}</span>
            </div>
          )}
        </div>
      </Section>

      {kanjiBreakdown.length > 0 && (
        <Section title="Kanji breakdown" icon={<Layers className="h-3 w-3" />}>
          <div className="flex flex-wrap gap-2">
            {kanjiBreakdown.map((node) => (
              <button
                key={node.id}
                onClick={() => onNavigate(node.id, node.type)}
                className="px-2 py-1 bg-charcoal-slate rounded border border-ash-stone/30 hover:border-icon-gold/40 transition-colors cursor-pointer"
              >
                <span className="text-lg">{node.label}</span>
                {node.sublabel && (
                  <span className="text-xs text-warm-gray ml-1.5">{node.sublabel}</span>
                )}
              </button>
            ))}
          </div>
        </Section>
      )}

      {data.sentences && data.sentences.length > 0 && (
        <Section title="Example sentences">
          <div className="space-y-2">
            {data.sentences.map((ex, i) => (
              <div key={i} className="pl-2 border-l-2 border-ash-stone/30">
                <p className="text-base">{ex.japanese}</p>
                {ex.english && <p className="text-xs text-warm-gray mt-0.5">{ex.english}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}

function GrammarDetail({ data }: { data: JpGrammar }) {
  return (
    <>
      <Section title="Meaning">
        <p>{data.meaning}</p>
      </Section>

      {data.formation && (
        <Section title="Formation">
          <p className="font-mono text-sm bg-charcoal-slate px-2 py-1 rounded">{data.formation}</p>
        </Section>
      )}

      {data.notes && (
        <Section title="Notes">
          <p className="text-warm-gray text-sm">{data.notes}</p>
        </Section>
      )}

      {data.examples && data.examples.length > 0 && (
        <Section title="Example sentences">
          <div className="space-y-2">
            {data.examples.map((ex, i) => (
              <div key={i} className="pl-2 border-l-2 border-ash-stone/30">
                <p className="text-base">{ex.jp}</p>
                <p className="text-xs text-warm-gray mt-0.5">{ex.en}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}

// ── Main NodeDetail component ────────────────────────────────────────

interface NodeDetailProps {
  graph: JpGraphData
  className?: string
  onNavigate?: (id: string, type: JpItemType) => void
  onViewInGraph?: (id: string) => void
}

export function NodeDetail({ graph, className, onNavigate, onViewInGraph }: NodeDetailProps) {
  const { selectedNodeId, selectedNodeType, setSelectedNode } = useJapaneseStore()
  const jp = useJapanese()

  const node = useMemo(
    () => graph.nodes.find((n) => n.id === selectedNodeId),
    [graph.nodes, selectedNodeId],
  )

  // Use graph edges for the selected node
  const nodeEdges = useMemo(
    () =>
      graph.edges.filter(
        (e) => e.source === selectedNodeId || e.target === selectedNodeId,
      ),
    [graph.edges, selectedNodeId],
  )

  // Load real association counts from the DB
  const [dbAssociations, setDbAssociations] = useState<JpAssociation[]>([])
  const [loadingAssociations, setLoadingAssociations] = useState(false)

  useEffect(() => {
    if (!selectedNodeId || !selectedNodeType) {
      setDbAssociations([])
      return
    }

    let cancelled = false
    setLoadingAssociations(true)

    async function load() {
      try {
        const assocs = await jp.getAssociationsForNode(selectedNodeId!, selectedNodeType!)
        if (!cancelled) setDbAssociations(assocs)
      } catch (err) {
        console.error('[NodeDetail] Failed to load associations:', err)
        if (!cancelled) setDbAssociations([])
      } finally {
        if (!cancelled) setLoadingAssociations(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [selectedNodeId, selectedNodeType, jp.getAssociationsForNode])

  // Compute category counts from real DB associations
  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<JpAssociationCategory, number>> = {}
    for (const a of dbAssociations) {
      counts[a.category] = (counts[a.category] ?? 0) + 1
    }
    return counts
  }, [dbAssociations])

  const handleNavigate = (id: string, type: JpItemType) => {
    setSelectedNode(id, type)
    onNavigate?.(id, type)
  }

  if (!node || !selectedNodeId) {
    return (
      <div className={cn('flex items-center justify-center h-full p-6', className)}>
        <div className="text-center">
          <Network className="h-8 w-8 text-warm-gray/40 mx-auto mb-3" />
          <p className="text-sm text-warm-gray">Select a node in the graph to see its details</p>
        </div>
      </div>
    )
  }

  const mastery = MASTERY_CONFIG[node.mastery]

  return (
    <div className={cn('flex flex-col h-full bg-obsidian', className)}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-ash-stone/50">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Character display */}
            <div className="text-5xl mb-2" style={{ fontFamily: 'system-ui, sans-serif' }}>
              {node.label}
            </div>

            {/* Sublabel */}
            {node.sublabel && (
              <p className="text-sm text-warm-gray mb-2">{node.sublabel}</p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', mastery.className)}>
                {mastery.label}
              </span>
              {node.jlpt_level && (
                <Badge variant="outline" className="text-[10px] h-5">
                  N{node.jlpt_level}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] h-5 capitalize">
                {selectedNodeType ?? node.type}
              </Badge>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => setSelectedNode(null, null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-4">
        {/* Type-specific detail */}
        {node.type === 'radical' && node.data && (
          <RadicalDetail
            data={node.data as JpRadical}
            edges={nodeEdges}
            allNodes={graph.nodes}
            onNavigate={handleNavigate}
          />
        )}
        {node.type === 'kanji' && node.data && (
          <KanjiDetailPanel
            data={node.data as JpKanji}
            edges={nodeEdges}
            allNodes={graph.nodes}
            onNavigate={handleNavigate}
          />
        )}
        {node.type === 'word' && node.data && (
          <VocabDetail
            data={node.data as JpVocabulary}
            edges={nodeEdges}
            allNodes={graph.nodes}
            onNavigate={handleNavigate}
          />
        )}
        {node.type === 'grammar' && node.data && (
          <GrammarDetail data={node.data as JpGrammar} />
        )}

        {/* Association counts from real DB data */}
        <Section title="Associations" icon={<Network className="h-3 w-3" />}>
          {loadingAssociations ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-warm-gray" />
              <span className="text-xs text-warm-gray">Loading associations...</span>
            </div>
          ) : Object.keys(categoryCounts).length > 0 ? (
            <div className="space-y-1">
              {(Object.entries(categoryCounts) as [JpAssociationCategory, number][]).map(
                ([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between text-xs">
                    <span className={cn('capitalize', CATEGORY_COLORS[cat])}>{cat}</span>
                    <span className="text-warm-gray">{count}</span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="text-xs text-warm-gray">No associations found</p>
          )}
        </Section>

        {/* View in graph button */}
        {onViewInGraph && (
          <div className="py-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => onViewInGraph(selectedNodeId)}
            >
              <Network className="h-3.5 w-3.5" />
              View in Association Web
            </Button>
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-4" />
      </ScrollArea>
    </div>
  )
}
