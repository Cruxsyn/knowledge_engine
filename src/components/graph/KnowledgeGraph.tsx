import { useRef, useEffect, useState, useCallback } from 'react'
import { useConcepts } from '@/hooks/useConcepts'
import { isTauri } from '@/db/adapter'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

interface GraphNode {
  id: string
  x: number
  y: number
  label: string
  mastery: string
  radius: number
}

interface GraphEdge {
  source: string
  target: string
  relationship: string
}

const MASTERY_COLORS: Record<string, string> = {
  unknown: '#64748b',
  learning: '#e8b714',
  solid: '#22c55e',
  teachable: '#8b5cf6',
}

export function KnowledgeGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { concepts } = useConcepts()
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const { getGraphData } = useConcepts()

  // Load and layout graph
  useEffect(() => {
    async function loadGraph() {
      const data = await getGraphData()
      if (!data.nodes.length) return

      // Create node positions
      const graphNodes: GraphNode[] = data.nodes.map((id, i) => {
        const concept = concepts.find(c => c.id === id)
        const angle = (i / data.nodes.length) * Math.PI * 2
        const radius = 200
        return {
          id,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          label: concept?.name ?? id,
          mastery: concept?.mastery ?? 'unknown',
          radius: 20,
        }
      })

      const graphEdges: GraphEdge[] = data.edges.map(e => ({
        source: e.from,
        target: e.to,
        relationship: e.relationship,
      }))

      // Try Rust layout if in Tauri
      if (isTauri()) {
        try {
          const { invoke } = await import('@tauri-apps/api/core')
          const positioned = await invoke<Array<{ id: string; x: number; y: number }>>('graph_layout', {
            nodes: graphNodes.map(n => ({ id: n.id, x: n.x, y: n.y })),
            edges: graphEdges.map(e => ({ source: e.source, target: e.target, weight: 1.0 })),
          })
          for (const p of positioned) {
            const node = graphNodes.find(n => n.id === p.id)
            if (node) { node.x = p.x; node.y = p.y }
          }
        } catch {
          // Fall back to simple layout
          simpleForceLayout(graphNodes, graphEdges)
        }
      } else {
        simpleForceLayout(graphNodes, graphEdges)
      }

      setNodes(graphNodes)
      setEdges(graphEdges)
    }
    loadGraph()
  }, [concepts, getGraphData])

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    ctx.save()
    ctx.translate(w / 2 + offset.x, h / 2 + offset.y)
    ctx.scale(zoom, zoom)

    // Draw edges
    for (const edge of edges) {
      const source = nodes.find(n => n.id === edge.source)
      const target = nodes.find(n => n.id === edge.target)
      if (!source || !target) continue

      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)
      ctx.strokeStyle = '#3a3a4e'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Draw nodes
    for (const node of nodes) {
      const isHovered = node.id === hoveredNode
      const r = isHovered ? node.radius * 1.3 : node.radius
      const color = MASTERY_COLORS[node.mastery] || '#64748b'

      // Glow
      if (isHovered) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, r + 8, 0, Math.PI * 2)
        ctx.fillStyle = color + '20'
        ctx.fill()
      }

      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
      ctx.fillStyle = color + '40'
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()

      // Label
      ctx.font = `${isHovered ? 'bold ' : ''}11px Inter, sans-serif`
      ctx.fillStyle = '#e8e0d0'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(node.label, node.x, node.y + r + 6)
    }

    ctx.restore()
  }, [nodes, edges, zoom, offset, hoveredNode])

  useEffect(() => {
    draw()
  }, [draw])

  // Mouse events
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = (e.clientX - rect.left - canvas.width / 2 - offset.x) / zoom
    const my = (e.clientY - rect.top - canvas.height / 2 - offset.y) / zoom

    if (dragging) {
      setOffset({
        x: offset.x + e.movementX,
        y: offset.y + e.movementY,
      })
      return
    }

    const found = nodes.find(n => Math.hypot(n.x - mx, n.y - my) < n.radius)
    setHoveredNode(found?.id ?? null)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-ash-stone/50">
        <h1 className="text-lg font-serif text-parchment">Knowledge Graph</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-warm-gray mr-2">{nodes.length} nodes, {edges.length} edges</span>
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(z * 1.2, 5))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(z / 1.2, 0.2))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }) }}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseMove={handleMouseMove}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          onMouseLeave={() => { setDragging(false); setHoveredNode(null) }}
          onWheel={e => setZoom(z => Math.max(0.2, Math.min(5, z * (e.deltaY > 0 ? 0.9 : 1.1))))}
        />
        {/* Mastery legend */}
        <div className="absolute bottom-4 left-4 flex gap-3 bg-charcoal-slate/90 p-2 rounded text-xs">
          {Object.entries(MASTERY_COLORS).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-warm-gray capitalize">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function simpleForceLayout(nodes: GraphNode[], edges: GraphEdge[]) {
  const iterations = 100
  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x
        const dy = nodes[j].y - nodes[i].y
        const dist = Math.max(Math.hypot(dx, dy), 1)
        const force = 5000 / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        nodes[i].x -= fx; nodes[i].y -= fy
        nodes[j].x += fx; nodes[j].y += fy
      }
    }
    // Attraction along edges
    for (const edge of edges) {
      const a = nodes.find(n => n.id === edge.source)
      const b = nodes.find(n => n.id === edge.target)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.hypot(dx, dy)
      const force = (dist - 100) * 0.01
      const fx = (dx / Math.max(dist, 1)) * force
      const fy = (dy / Math.max(dist, 1)) * force
      a.x += fx; a.y += fy
      b.x -= fx; b.y -= fy
    }
    // Center gravity
    for (const node of nodes) {
      node.x *= 0.99
      node.y *= 0.99
    }
  }
}
