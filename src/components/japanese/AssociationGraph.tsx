import { useState, useMemo, useCallback, useRef } from 'react'
import { useJapaneseStore } from '@/stores/japaneseStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Search, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import type {
  JpGraphData,
  JpGraphNode,
  JpGraphEdge,
  JpItemType,
  JpAssociationCategory,
  JpMasteryLevel,
  JpKanji,
  JpRadical,
  JpVocabulary,
  JpGrammar,
} from '@/types'

// ── Mock Data ────────────────────────────────────────────────────────

function buildMockGraph(): JpGraphData {
  const nodes: JpGraphNode[] = [
    // Radicals
    { id: 'r-1', type: 'radical', label: '日', sublabel: 'sun/day', mastery: 'mastered', data: { id: 'r-1', character: '日', meaning: 'sun, day', stroke_count: 4, mnemonic: 'A window with a line through it - the sun shining through' } as JpRadical },
    { id: 'r-2', type: 'radical', label: '月', sublabel: 'moon/month', mastery: 'known', data: { id: 'r-2', character: '月', meaning: 'moon, month', stroke_count: 4, mnemonic: 'A crescent moon' } as JpRadical },
    { id: 'r-3', type: 'radical', label: '木', sublabel: 'tree', mastery: 'mastered', data: { id: 'r-3', character: '木', meaning: 'tree, wood', stroke_count: 4, mnemonic: 'A tree with branches and roots' } as JpRadical },
    { id: 'r-4', type: 'radical', label: '水', sublabel: 'water', mastery: 'known', data: { id: 'r-4', character: '水', meaning: 'water', stroke_count: 4, mnemonic: 'Water flowing down a cliff' } as JpRadical },
    { id: 'r-5', type: 'radical', label: '火', sublabel: 'fire', mastery: 'learning', data: { id: 'r-5', character: '火', meaning: 'fire', stroke_count: 4, mnemonic: 'A person with arms raised in flames' } as JpRadical },
    // Kanji
    { id: 'k-1', type: 'kanji', label: '明', sublabel: 'bright', mastery: 'learning', jlpt_level: 4, data: { id: 'k-1', character: '明', meanings: ['bright', 'clear', 'light'], on_readings: ['メイ', 'ミョウ'], kun_readings: ['あか.るい', 'あき.らか'], jlpt_level: 4, grade: 2, stroke_count: 8, mnemonic: 'Sun + Moon = bright', components: ['r-1', 'r-2'] } as JpKanji },
    { id: 'k-2', type: 'kanji', label: '林', sublabel: 'grove', mastery: 'known', jlpt_level: 3, data: { id: 'k-2', character: '林', meanings: ['grove', 'forest'], on_readings: ['リン'], kun_readings: ['はやし'], jlpt_level: 3, grade: 1, stroke_count: 8, mnemonic: 'Two trees together form a grove', components: ['r-3'] } as JpKanji },
    { id: 'k-3', type: 'kanji', label: '森', sublabel: 'forest', mastery: 'seen', jlpt_level: 3, data: { id: 'k-3', character: '森', meanings: ['forest', 'woods'], on_readings: ['シン'], kun_readings: ['もり'], jlpt_level: 3, grade: 1, stroke_count: 12, mnemonic: 'Three trees make a dense forest', components: ['r-3'] } as JpKanji },
    { id: 'k-4', type: 'kanji', label: '山', sublabel: 'mountain', mastery: 'mastered', jlpt_level: 5, data: { id: 'k-4', character: '山', meanings: ['mountain', 'hill'], on_readings: ['サン', 'セン'], kun_readings: ['やま'], jlpt_level: 5, grade: 1, stroke_count: 3, mnemonic: 'Three peaks of a mountain', components: [] } as JpKanji },
    { id: 'k-5', type: 'kanji', label: '川', sublabel: 'river', mastery: 'mastered', jlpt_level: 5, data: { id: 'k-5', character: '川', meanings: ['river', 'stream'], on_readings: ['セン'], kun_readings: ['かわ'], jlpt_level: 5, grade: 1, stroke_count: 3, mnemonic: 'Three flowing streams', components: [] } as JpKanji },
    { id: 'k-6', type: 'kanji', label: '日', sublabel: 'day/sun', mastery: 'mastered', jlpt_level: 5, data: { id: 'k-6', character: '日', meanings: ['day', 'sun', 'Japan'], on_readings: ['ニチ', 'ジツ'], kun_readings: ['ひ', 'か'], jlpt_level: 5, grade: 1, stroke_count: 4, mnemonic: 'The sun framed in a window', components: ['r-1'] } as JpKanji },
    { id: 'k-7', type: 'kanji', label: '月', sublabel: 'month/moon', mastery: 'known', jlpt_level: 5, data: { id: 'k-7', character: '月', meanings: ['month', 'moon'], on_readings: ['ゲツ', 'ガツ'], kun_readings: ['つき'], jlpt_level: 5, grade: 1, stroke_count: 4, mnemonic: 'A crescent moon', components: ['r-2'] } as JpKanji },
    { id: 'k-8', type: 'kanji', label: '火', sublabel: 'fire', mastery: 'learning', jlpt_level: 5, data: { id: 'k-8', character: '火', meanings: ['fire'], on_readings: ['カ'], kun_readings: ['ひ', 'ほ'], jlpt_level: 5, grade: 1, stroke_count: 4, mnemonic: 'A person with sparks flying', components: ['r-5'] } as JpKanji },
    // Vocabulary
    { id: 'v-1', type: 'vocabulary', label: '明日', sublabel: 'あした - tomorrow', mastery: 'learning', data: { id: 'v-1', word: '明日', reading: 'あした', meanings: ['tomorrow'], kanji_ids: ['k-1', 'k-6'], example_sentences: [{ ja: '明日は月曜日です。', en: 'Tomorrow is Monday.' }], part_of_speech: 'noun' } as JpVocabulary },
    { id: 'v-2', type: 'vocabulary', label: '山川', sublabel: 'やまかわ - mountains and rivers', mastery: 'seen', data: { id: 'v-2', word: '山川', reading: 'やまかわ', meanings: ['mountains and rivers', 'landscape'], kanji_ids: ['k-4', 'k-5'], example_sentences: [{ ja: '日本の山川は美しい。', en: "Japan's mountains and rivers are beautiful." }], part_of_speech: 'noun' } as JpVocabulary },
    { id: 'v-3', type: 'vocabulary', label: '火山', sublabel: 'かざん - volcano', mastery: 'unknown', data: { id: 'v-3', word: '火山', reading: 'かざん', meanings: ['volcano'], kanji_ids: ['k-8', 'k-4'], example_sentences: [{ ja: '富士山は火山です。', en: 'Mt. Fuji is a volcano.' }], part_of_speech: 'noun' } as JpVocabulary },
    { id: 'v-4', type: 'vocabulary', label: '森林', sublabel: 'しんりん - forest', mastery: 'seen', data: { id: 'v-4', word: '森林', reading: 'しんりん', meanings: ['forest', 'woods'], kanji_ids: ['k-3', 'k-2'], example_sentences: [{ ja: '森林を守ろう。', en: "Let's protect the forests." }], part_of_speech: 'noun' } as JpVocabulary },
    { id: 'v-5', type: 'vocabulary', label: '明るい', sublabel: 'あかるい - bright', mastery: 'learning', data: { id: 'v-5', word: '明るい', reading: 'あかるい', meanings: ['bright', 'light', 'cheerful'], kanji_ids: ['k-1'], example_sentences: [{ ja: 'この部屋は明るい。', en: 'This room is bright.' }], part_of_speech: 'i-adjective' } as JpVocabulary },
    // Grammar
    { id: 'g-1', type: 'grammar', label: '〜ている', sublabel: 'ongoing state', mastery: 'known', data: { id: 'g-1', pattern: '〜ている', meaning: 'Indicates an ongoing action or resultant state', formation: 'Verb (て-form) + いる', jlpt_level: 5, example_sentences: [{ ja: '山に登っている。', en: 'I am climbing the mountain.' }, { ja: '火が燃えている。', en: 'The fire is burning.' }] } as JpGrammar },
    { id: 'g-2', type: 'grammar', label: '〜から', sublabel: 'because/from', mastery: 'mastered', data: { id: 'g-2', pattern: '〜から', meaning: 'Because / Since / From', formation: 'Clause + から', jlpt_level: 5, example_sentences: [{ ja: '明日は休みだから、山に行く。', en: "Because tomorrow is a holiday, I'll go to the mountain." }] } as JpGrammar },
  ]

  const edges: JpGraphEdge[] = [
    // Orthographic: radicals contained in kanji
    { source: 'r-1', target: 'k-1', category: 'orthographic', relation: 'contains_component', weight: 1.0 },
    { source: 'r-2', target: 'k-1', category: 'orthographic', relation: 'contains_component', weight: 1.0 },
    { source: 'r-1', target: 'k-6', category: 'orthographic', relation: 'contains_component', weight: 1.0 },
    { source: 'r-2', target: 'k-7', category: 'orthographic', relation: 'contains_component', weight: 1.0 },
    { source: 'r-3', target: 'k-2', category: 'orthographic', relation: 'contains_component', weight: 1.0 },
    { source: 'r-3', target: 'k-3', category: 'orthographic', relation: 'contains_component', weight: 1.0 },
    { source: 'r-5', target: 'k-8', category: 'orthographic', relation: 'contains_component', weight: 1.0 },
    // Semantic: related meanings
    { source: 'k-4', target: 'k-5', category: 'semantic', relation: 'semantic_field', weight: 0.8 },
    { source: 'k-2', target: 'k-3', category: 'semantic', relation: 'semantic_field', weight: 0.9 },
    { source: 'k-6', target: 'k-7', category: 'semantic', relation: 'antonym', weight: 0.7 },
    { source: 'r-4', target: 'r-5', category: 'semantic', relation: 'antonym', weight: 0.6 },
    { source: 'r-3', target: 'k-4', category: 'semantic', relation: 'semantic_field', weight: 0.5 },
    // Collocational: words containing kanji
    { source: 'k-1', target: 'v-1', category: 'collocational', relation: 'compound_word', weight: 1.0 },
    { source: 'k-6', target: 'v-1', category: 'collocational', relation: 'compound_word', weight: 1.0 },
    { source: 'k-4', target: 'v-2', category: 'collocational', relation: 'compound_word', weight: 1.0 },
    { source: 'k-5', target: 'v-2', category: 'collocational', relation: 'compound_word', weight: 1.0 },
    { source: 'k-8', target: 'v-3', category: 'collocational', relation: 'compound_word', weight: 1.0 },
    { source: 'k-4', target: 'v-3', category: 'collocational', relation: 'compound_word', weight: 1.0 },
    { source: 'k-3', target: 'v-4', category: 'collocational', relation: 'compound_word', weight: 1.0 },
    { source: 'k-2', target: 'v-4', category: 'collocational', relation: 'compound_word', weight: 1.0 },
    { source: 'k-1', target: 'v-5', category: 'collocational', relation: 'compound_word', weight: 1.0 },
    // Grammatical: grammar using vocabulary
    { source: 'g-1', target: 'v-3', category: 'grammatical', relation: 'grammar_example', weight: 0.6 },
    { source: 'g-2', target: 'v-1', category: 'grammatical', relation: 'grammar_example', weight: 0.5 },
  ]

  return { nodes, edges }
}

// ── Constants ────────────────────────────────────────────────────────

const NODE_TYPE_COLORS: Record<JpItemType, string> = {
  radical: '#3B82F6',     // blue
  kanji: '#C8A24A',       // gold
  vocabulary: '#22C55E',  // green
  grammar: '#A855F7',     // purple
}

const EDGE_CATEGORY_COLORS: Record<JpAssociationCategory, string> = {
  semantic: '#A855F7',
  phonological: '#F97316',
  orthographic: '#3B82F6',
  collocational: '#22C55E',
  grammatical: '#EF4444',
  mnemonic: '#9CA3AF',
}

const MASTERY_OPACITY: Record<JpMasteryLevel, number> = {
  unknown: 0.3,
  seen: 0.45,
  learning: 0.65,
  known: 0.85,
  mastered: 1.0,
}

const NODE_TYPE_LABELS: Record<JpItemType, string> = {
  radical: 'Radical',
  kanji: 'Kanji',
  vocabulary: 'Word',
  grammar: 'Grammar',
}

const CATEGORY_LABELS: Record<JpAssociationCategory, string> = {
  semantic: 'Semantic',
  phonological: 'Phonological',
  orthographic: 'Orthographic',
  collocational: 'Collocational',
  grammatical: 'Grammatical',
  mnemonic: 'Mnemonic',
}

// ── Helper: Compute radial layout ────────────────────────────────────

interface LayoutNode extends JpGraphNode {
  x: number
  y: number
  ring: number
}

function computeRadialLayout(
  graph: JpGraphData,
  centerId: string,
  depth: number,
  filterTypes: JpItemType[],
  filterCategories: JpAssociationCategory[],
  width: number,
  height: number,
): { nodes: LayoutNode[]; edges: JpGraphEdge[] } {
  const cx = width / 2
  const cy = height / 2

  // BFS from center node
  const visited = new Map<string, number>()
  visited.set(centerId, 0)
  const queue = [centerId]
  let qi = 0

  while (qi < queue.length) {
    const current = queue[qi++]
    const currentDepth = visited.get(current)!
    if (currentDepth >= depth) continue

    for (const edge of graph.edges) {
      if (!filterCategories.includes(edge.category)) continue
      let neighbor: string | null = null
      if (edge.source === current) neighbor = edge.target
      else if (edge.target === current) neighbor = edge.source
      if (neighbor && !visited.has(neighbor)) {
        const node = graph.nodes.find((n) => n.id === neighbor)
        if (node && filterTypes.includes(node.type)) {
          visited.set(neighbor, currentDepth + 1)
          queue.push(neighbor)
        }
      }
    }
  }

  // Position nodes in rings
  const ringGroups = new Map<number, string[]>()
  for (const [nodeId, ring] of visited) {
    if (!ringGroups.has(ring)) ringGroups.set(ring, [])
    ringGroups.get(ring)!.push(nodeId)
  }

  const minDim = Math.min(width, height)
  const ringSpacing = Math.min(140, minDim / (depth + 2))
  const layoutNodes: LayoutNode[] = []

  for (const [ring, nodeIds] of ringGroups) {
    const count = nodeIds.length
    const radius = ring === 0 ? 0 : ring * ringSpacing
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2
      const node = graph.nodes.find((n) => n.id === nodeIds[i])
      if (!node) continue
      layoutNodes.push({
        ...node,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        ring,
      })
    }
  }

  // Filter edges to only those between visible nodes
  const visibleIds = new Set(layoutNodes.map((n) => n.id))
  const layoutEdges = graph.edges.filter(
    (e) =>
      visibleIds.has(e.source) &&
      visibleIds.has(e.target) &&
      filterCategories.includes(e.category),
  )

  return { nodes: layoutNodes, edges: layoutEdges }
}

// ── Component ────────────────────────────────────────────────────────

interface AssociationGraphProps {
  onNodeSelect?: (id: string, type: JpItemType) => void
  className?: string
}

export function AssociationGraph({ onNodeSelect, className }: AssociationGraphProps) {
  const {
    selectedNodeId,
    setSelectedNode,
    graphFilter,
    setGraphFilter,
    graphDepth,
    setGraphDepth,
  } = useJapaneseStore()

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })
  const panOffset = useRef({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)

  const mockGraph = useMemo(() => buildMockGraph(), [])

  const centerId = selectedNodeId ?? 'k-1'
  const viewWidth = 800
  const viewHeight = 600

  const layout = useMemo(
    () =>
      computeRadialLayout(
        mockGraph,
        centerId,
        graphDepth,
        graphFilter.nodeTypes,
        graphFilter.edgeCategories,
        viewWidth,
        viewHeight,
      ),
    [mockGraph, centerId, graphDepth, graphFilter.nodeTypes, graphFilter.edgeCategories],
  )

  const handleNodeClick = useCallback(
    (node: LayoutNode) => {
      setSelectedNode(node.id, node.type)
      onNodeSelect?.(node.id, node.type)
    },
    [setSelectedNode, onNodeSelect],
  )

  const handleSearchJump = useCallback(() => {
    if (!searchQuery.trim()) return
    const q = searchQuery.trim().toLowerCase()
    const found = mockGraph.nodes.find(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.sublabel?.toLowerCase().includes(q) ||
        n.id.toLowerCase().includes(q),
    )
    if (found) {
      setSelectedNode(found.id, found.type)
      onNodeSelect?.(found.id, found.type)
      setSearchQuery('')
    }
  }, [searchQuery, mockGraph.nodes, setSelectedNode, onNodeSelect])

  const toggleNodeType = useCallback(
    (type: JpItemType) => {
      const current = graphFilter.nodeTypes
      const updated = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type]
      if (updated.length > 0) {
        setGraphFilter({ nodeTypes: updated })
      }
    },
    [graphFilter.nodeTypes, setGraphFilter],
  )

  const toggleEdgeCategory = useCallback(
    (cat: JpAssociationCategory) => {
      const current = graphFilter.edgeCategories
      const updated = current.includes(cat)
        ? current.filter((c) => c !== cat)
        : [...current, cat]
      if (updated.length > 0) {
        setGraphFilter({ edgeCategories: updated })
      }
    },
    [graphFilter.edgeCategories, setGraphFilter],
  )

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  // Pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if ((e.target as SVGElement).closest('.graph-node')) return
      setIsPanning(true)
      panStart.current = { x: e.clientX, y: e.clientY }
      panOffset.current = { ...pan }
    },
    [pan],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isPanning) return
      const dx = (e.clientX - panStart.current.x) / zoom
      const dy = (e.clientY - panStart.current.y) / zoom
      setPan({
        x: panOffset.current.x + dx,
        y: panOffset.current.y + dy,
      })
    },
    [isPanning, zoom],
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.92 : 1.08
    setZoom((z) => Math.min(3, Math.max(0.3, z * factor)))
  }, [])

  // Find positions for edge drawing
  const getNodePos = useCallback(
    (id: string) => {
      const n = layout.nodes.find((n) => n.id === id)
      return n ? { x: n.x, y: n.y } : null
    },
    [layout.nodes],
  )

  const hoveredNode = layout.nodes.find((n) => n.id === hoveredNodeId)

  return (
    <div className={cn('flex flex-col h-full bg-obsidian', className)}>
      {/* Controls bar */}
      <div className="flex-shrink-0 p-3 border-b border-ash-stone/50 space-y-3">
        {/* Top row: search + zoom */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-warm-gray" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchJump()}
              placeholder="Search nodes..."
              className="pl-8 h-8 text-xs bg-charcoal-slate"
            />
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-warm-gray mr-1">Depth:</span>
            {[1, 2, 3].map((d) => (
              <Button
                key={d}
                variant={graphDepth === d ? 'default' : 'outline'}
                size="sm"
                className="h-7 w-7 p-0 text-xs"
                onClick={() => setGraphDepth(d)}
              >
                {d}
              </Button>
            ))}

            <div className="w-px h-5 bg-ash-stone/50 mx-1" />

            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(3, z * 1.2))}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-warm-gray w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.3, z * 0.8))}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={resetView}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-warm-gray">Nodes:</span>
          {(Object.keys(NODE_TYPE_LABELS) as JpItemType[]).map((type) => (
            <button
              key={type}
              onClick={() => toggleNodeType(type)}
              className={cn(
                'flex items-center gap-1.5 px-2 py-0.5 rounded text-xs transition-all',
                graphFilter.nodeTypes.includes(type)
                  ? 'bg-charcoal-slate text-parchment'
                  : 'text-warm-gray/50 line-through',
              )}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: NODE_TYPE_COLORS[type], opacity: graphFilter.nodeTypes.includes(type) ? 1 : 0.3 }}
              />
              {NODE_TYPE_LABELS[type]}
            </button>
          ))}

          <div className="w-px h-4 bg-ash-stone/50 mx-1" />

          <span className="text-xs text-warm-gray">Edges:</span>
          {(Object.keys(CATEGORY_LABELS) as JpAssociationCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => toggleEdgeCategory(cat)}
              className={cn(
                'flex items-center gap-1.5 px-2 py-0.5 rounded text-xs transition-all',
                graphFilter.edgeCategories.includes(cat)
                  ? 'bg-charcoal-slate text-parchment'
                  : 'text-warm-gray/50 line-through',
              )}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: EDGE_CATEGORY_COLORS[cat], opacity: graphFilter.edgeCategories.includes(cat) ? 1 : 0.3 }}
              />
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Graph */}
      <div className="flex-1 relative overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          className={cn('w-full h-full', isPanning ? 'cursor-grabbing' : 'cursor-grab')}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <g transform={`translate(${viewWidth / 2}, ${viewHeight / 2}) scale(${zoom}) translate(${-viewWidth / 2 + pan.x}, ${-viewHeight / 2 + pan.y})`}>
            {/* Ring guides */}
            {Array.from({ length: graphDepth }, (_, i) => {
              const minDim = Math.min(viewWidth, viewHeight)
              const ringSpacing = Math.min(140, minDim / (graphDepth + 2))
              const r = (i + 1) * ringSpacing
              return (
                <circle
                  key={`ring-${i}`}
                  cx={viewWidth / 2}
                  cy={viewHeight / 2}
                  r={r}
                  fill="none"
                  stroke="rgba(184,177,166,0.06)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              )
            })}

            {/* Edges */}
            {layout.edges.map((edge, i) => {
              const from = getNodePos(edge.source)
              const to = getNodePos(edge.target)
              if (!from || !to) return null
              const isHighlighted =
                hoveredNodeId === edge.source || hoveredNodeId === edge.target
              return (
                <line
                  key={`edge-${i}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={EDGE_CATEGORY_COLORS[edge.category]}
                  strokeWidth={Math.max(1, edge.weight * 2.5)}
                  strokeOpacity={isHighlighted ? 0.7 : 0.2}
                  className="transition-all duration-200"
                />
              )
            })}

            {/* Nodes */}
            {layout.nodes.map((node) => {
              const isCenter = node.ring === 0
              const isHovered = hoveredNodeId === node.id
              const isSelected = selectedNodeId === node.id
              const baseSize = isCenter ? 32 : node.ring === 1 ? 22 : 16
              const size = baseSize * (isHovered ? 1.15 : 1)
              const opacity = MASTERY_OPACITY[node.mastery]
              const color = NODE_TYPE_COLORS[node.type]

              return (
                <g
                  key={node.id}
                  className="graph-node cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNodeClick(node)
                  }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Selection/hover ring */}
                  {(isSelected || isHovered) && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={size + 4}
                      fill="none"
                      stroke={isSelected ? '#E7E0D4' : 'rgba(231,224,212,0.4)'}
                      strokeWidth={isSelected ? 2 : 1.5}
                      className="transition-all duration-200"
                    />
                  )}

                  {/* Node circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={size}
                    fill={color}
                    fillOpacity={opacity}
                    stroke={color}
                    strokeWidth={isCenter ? 2 : 1}
                    strokeOpacity={opacity * 0.6}
                    className="transition-all duration-200"
                  />

                  {/* Label inside large nodes */}
                  <text
                    x={node.x}
                    y={node.y + (isCenter ? 2 : 1)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#E7E0D4"
                    fontSize={isCenter ? 18 : node.ring === 1 ? 13 : 10}
                    fontFamily="system-ui, sans-serif"
                    className="pointer-events-none select-none"
                  >
                    {node.label}
                  </text>

                  {/* Sublabel below node */}
                  {(isCenter || isHovered) && node.sublabel && (
                    <text
                      x={node.x}
                      y={node.y + size + 14}
                      textAnchor="middle"
                      fill="rgba(184,177,166,0.8)"
                      fontSize={10}
                      fontFamily="Inter, system-ui, sans-serif"
                      className="pointer-events-none select-none"
                    >
                      {node.sublabel}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {hoveredNode && (
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left: '50%',
              bottom: 16,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-charcoal-slate/95 border border-ash-stone/60 rounded-lg px-3 py-2 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: NODE_TYPE_COLORS[hoveredNode.type] }}
                />
                <span className="text-sm text-parchment font-medium">{hoveredNode.label}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {NODE_TYPE_LABELS[hoveredNode.type]}
                </Badge>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${NODE_TYPE_COLORS[hoveredNode.type]}20`,
                    color: NODE_TYPE_COLORS[hoveredNode.type],
                  }}
                >
                  {hoveredNode.mastery}
                </span>
              </div>
              {hoveredNode.sublabel && (
                <p className="text-xs text-warm-gray mt-0.5">{hoveredNode.sublabel}</p>
              )}
            </div>
          </div>
        )}

        {/* Legend hint */}
        <div className="absolute bottom-3 left-3">
          <p className="text-[10px] text-warm-gray/60">
            Click node to navigate. Scroll to zoom. Drag to pan.
          </p>
        </div>
      </div>
    </div>
  )
}
