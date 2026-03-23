import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useJapaneseStore } from '@/stores/japaneseStore'
import { useJapanese } from '@/hooks/useJapanese'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Search, RotateCcw, ZoomIn, ZoomOut, Loader2 } from 'lucide-react'
import type {
  JpGraphData,
  JpGraphNode,
  JpGraphEdge,
  JpItemType,
  JpAssociationCategory,
  JpMasteryLevel,
} from '@/types'

// ── Constants ────────────────────────────────────────────────────────

const NODE_TYPE_COLORS: Record<JpItemType, string> = {
  radical: '#3B82F6',     // blue
  kanji: '#C8A24A',       // gold
  word: '#22C55E',        // green
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
  word: 'Word',
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
    selectedNodeType,
    setSelectedNode,
    graphDepth,
    setGraphDepth,
  } = useJapaneseStore()

  const jp = useJapanese()

  const [graphData, setGraphData] = useState<JpGraphData>({ nodes: [], edges: [] })
  const [loading, setLoading] = useState(true)

  // Local filter state for node types and edge categories
  const [filterNodeTypes, setFilterNodeTypes] = useState<JpItemType[]>(['radical', 'kanji', 'word', 'grammar'])
  const [filterEdgeCategories, setFilterEdgeCategories] = useState<JpAssociationCategory[]>([
    'semantic', 'phonological', 'orthographic', 'collocational', 'grammatical', 'mnemonic',
  ])

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })
  const panOffset = useRef({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)

  // Load graph data when selectedNodeId or depth changes
  useEffect(() => {
    let cancelled = false

    async function loadGraph() {
      setLoading(true)
      try {
        let nodeId = selectedNodeId
        let nodeType: JpItemType = selectedNodeType ?? 'kanji'

        // If no selected node, try loading the first kanji from the DB
        if (!nodeId) {
          const kanjiList = await jp.getAllKanji()
          if (kanjiList.length > 0) {
            nodeId = kanjiList[0].id
            nodeType = 'kanji'
            setSelectedNode(nodeId, nodeType)
          }
        }

        if (!nodeId) {
          if (!cancelled) {
            setGraphData({ nodes: [], edges: [] })
            setLoading(false)
          }
          return
        }

        const data = await jp.getGraphData(nodeId, nodeType, graphDepth)
        if (!cancelled) {
          setGraphData(data)
        }
      } catch (err) {
        console.error('[AssociationGraph] Failed to load graph:', err)
        if (!cancelled) setGraphData({ nodes: [], edges: [] })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadGraph()
    return () => { cancelled = true }
  }, [selectedNodeId, selectedNodeType, graphDepth, jp.getGraphData, jp.getAllKanji, setSelectedNode])

  const centerId = selectedNodeId ?? graphData.nodes[0]?.id ?? ''
  const viewWidth = 800
  const viewHeight = 600

  const layout = useMemo(
    () =>
      graphData.nodes.length > 0 && centerId
        ? computeRadialLayout(
            graphData,
            centerId,
            graphDepth,
            filterNodeTypes,
            filterEdgeCategories,
            viewWidth,
            viewHeight,
          )
        : { nodes: [] as LayoutNode[], edges: [] as JpGraphEdge[] },
    [graphData, centerId, graphDepth, filterNodeTypes, filterEdgeCategories],
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
    const found = graphData.nodes.find(
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
  }, [searchQuery, graphData.nodes, setSelectedNode, onNodeSelect])

  const toggleNodeType = useCallback(
    (type: JpItemType) => {
      setFilterNodeTypes((current) => {
        const updated = current.includes(type)
          ? current.filter((t) => t !== type)
          : [...current, type]
        return updated.length > 0 ? updated : current
      })
    },
    [],
  )

  const toggleEdgeCategory = useCallback(
    (cat: JpAssociationCategory) => {
      setFilterEdgeCategories((current) => {
        const updated = current.includes(cat)
          ? current.filter((c) => c !== cat)
          : [...current, cat]
        return updated.length > 0 ? updated : current
      })
    },
    [],
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

  // Loading state
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-obsidian', className)}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-warm-gray" />
          <p className="text-sm text-warm-gray">Loading association graph...</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (graphData.nodes.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-obsidian', className)}>
        <div className="text-center">
          <p className="text-sm text-warm-gray mb-2">No graph data available</p>
          <p className="text-xs text-warm-gray/60">Add some kanji, vocabulary, or radicals to see the association web</p>
        </div>
      </div>
    )
  }

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
                filterNodeTypes.includes(type)
                  ? 'bg-charcoal-slate text-parchment'
                  : 'text-warm-gray/50 line-through',
              )}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: NODE_TYPE_COLORS[type], opacity: filterNodeTypes.includes(type) ? 1 : 0.3 }}
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
                filterEdgeCategories.includes(cat)
                  ? 'bg-charcoal-slate text-parchment'
                  : 'text-warm-gray/50 line-through',
              )}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: EDGE_CATEGORY_COLORS[cat], opacity: filterEdgeCategories.includes(cat) ? 1 : 0.3 }}
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
