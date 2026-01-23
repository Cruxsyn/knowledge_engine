import { useState, useEffect, useRef, useMemo } from 'react'
import { useCaptures } from '@/hooks/useCaptures'
import { useNotes } from '@/hooks/useNotes'
import { useConcepts } from '@/hooks/useConcepts'
import { useAppStore } from '@/stores/appStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Network, 
  GitBranch, 
  Boxes, 
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react'
import type { Capture, AtomicNote, Concept } from '@/types'

type ViewMode = 'graph' | 'network' | 'dimension'
type NodeType = 'capture' | 'note' | 'concept'

interface VisNode {
  id: string
  type: NodeType
  label: string
  x: number
  y: number
  z?: number
  vx: number
  vy: number
  color: string
  size: number
  data: Capture | AtomicNote | Concept
}

interface VisEdge {
  from: string
  to: string
  color: string
  strength: number
}

const VIEW_MODES = [
  { id: 'graph' as ViewMode, icon: GitBranch, label: 'Graph View', description: 'Force-directed relationship graph' },
  { id: 'network' as ViewMode, icon: Network, label: 'Network View', description: 'Hierarchical network layout' },
  { id: 'dimension' as ViewMode, icon: Boxes, label: 'Dimension View', description: 'Multi-dimensional scatter' },
]

const NODE_COLORS = {
  capture: '#C8A24A', // gold
  note: '#2E6F68', // teal
  concept: '#1E4E8C', // blue
}

const NODE_SIZES = {
  capture: 8,
  note: 10,
  concept: 12,
}

export function VisualizePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('graph')
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<VisNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<VisNode | null>(null)
  const [showCaptures, setShowCaptures] = useState(true)
  const [showNotes, setShowNotes] = useState(true)
  const [showConcepts, setShowConcepts] = useState(true)
  
  const { captures } = useCaptures()
  const { notes } = useNotes()
  const { concepts, getGraphData } = useConcepts()
  const { setSelectedCapture, setSelectedNote, setSelectedConcept } = useAppStore()
  
  const animationRef = useRef<number | undefined>(undefined)
  const nodesRef = useRef<VisNode[]>([])
  const edgesRef = useRef<VisEdge[]>([])

  // Generate visualization nodes from all data
  const generateNodes = useMemo(() => {
    const nodes: VisNode[] = []
    const canvas = canvasRef.current
    const width = canvas?.width || 800
    const height = canvas?.height || 600
    const centerX = width / 2
    const centerY = height / 2

    if (showCaptures) {
      captures.forEach((capture, i) => {
        const angle = (i / Math.max(captures.length, 1)) * Math.PI * 2
        const radius = Math.min(width, height) / 4
        nodes.push({
          id: `capture-${capture.id}`,
          type: 'capture',
          label: capture.title,
          x: centerX + Math.cos(angle) * radius * 0.6 + (Math.random() - 0.5) * 100,
          y: centerY + Math.sin(angle) * radius * 0.6 + (Math.random() - 0.5) * 100,
          z: Math.random(),
          vx: 0,
          vy: 0,
          color: NODE_COLORS.capture,
          size: NODE_SIZES.capture,
          data: capture,
        })
      })
    }

    if (showNotes) {
      notes.forEach((note, i) => {
        const angle = (i / Math.max(notes.length, 1)) * Math.PI * 2 + Math.PI / 4
        const radius = Math.min(width, height) / 3
        nodes.push({
          id: `note-${note.id}`,
          type: 'note',
          label: note.title,
          x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 80,
          y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 80,
          z: (note.confidence || 3) / 5,
          vx: 0,
          vy: 0,
          color: NODE_COLORS.note,
          size: NODE_SIZES.note + (note.confidence || 3),
          data: note,
        })
      })
    }

    if (showConcepts) {
      concepts.forEach((concept, i) => {
        const angle = (i / Math.max(concepts.length, 1)) * Math.PI * 2 + Math.PI / 2
        const radius = Math.min(width, height) / 2.5
        const masteryMultiplier = concept.mastery === 'teachable' ? 1.5 : concept.mastery === 'solid' ? 1.2 : concept.mastery === 'learning' ? 1 : 0.8
        nodes.push({
          id: `concept-${concept.id}`,
          type: 'concept',
          label: concept.name,
          x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 60,
          y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 60,
          z: masteryMultiplier / 1.5,
          vx: 0,
          vy: 0,
          color: NODE_COLORS.concept,
          size: NODE_SIZES.concept * masteryMultiplier,
          data: concept,
        })
      })
    }

    return nodes
  }, [captures, notes, concepts, showCaptures, showNotes, showConcepts])

  // Generate edges based on relationships
  const generateEdges = useMemo(() => {
    const edges: VisEdge[] = []
    const graphData = getGraphData()

    // Concept-to-concept relationships
    graphData.edges.forEach(edge => {
      edges.push({
        from: `concept-${edge.from}`,
        to: `concept-${edge.to}`,
        color: '#1E4E8C',
        strength: 1,
      })
    })

    // Note-to-concept relationships (if concepts are linked to notes)
    notes.forEach(note => {
      if (note.concepts && showNotes && showConcepts) {
        note.concepts.forEach(concept => {
          edges.push({
            from: `note-${note.id}`,
            to: `concept-${concept.id}`,
            color: '#2E6F68',
            strength: 0.5,
          })
        })
      }
    })

    return edges
  }, [notes, showNotes, showConcepts, getGraphData])

  // Initialize nodes
  useEffect(() => {
    nodesRef.current = generateNodes
    edgesRef.current = generateEdges
  }, [generateNodes, generateEdges])

  // Canvas rendering and simulation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const updateSize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width = rect.width
        canvas.height = rect.height
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)

    const simulate = () => {
      const nodes = nodesRef.current
      const edges = edgesRef.current
      const width = canvas.width
      const height = canvas.height
      const centerX = width / 2
      const centerY = height / 2

      if (viewMode === 'graph') {
        // Force-directed layout
        const damping = 0.85
        const repulsion = 3000
        const attraction = 0.02
        const centerForce = 0.003

        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i]

          // Repulsion from other nodes
          for (let j = 0; j < nodes.length; j++) {
            if (i === j) continue
            const other = nodes[j]
            const dx = node.x - other.x
            const dy = node.y - other.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const force = repulsion / (dist * dist)
            node.vx += (dx / dist) * force * 0.1
            node.vy += (dy / dist) * force * 0.1
          }

          // Attraction to connected nodes
          for (const edge of edges) {
            let other: VisNode | undefined
            if (edge.from === node.id) {
              other = nodes.find(n => n.id === edge.to)
            } else if (edge.to === node.id) {
              other = nodes.find(n => n.id === edge.from)
            }
            if (other) {
              const dx = other.x - node.x
              const dy = other.y - node.y
              node.vx += dx * attraction
              node.vy += dy * attraction
            }
          }

          // Center gravity
          node.vx += (centerX - node.x) * centerForce
          node.vy += (centerY - node.y) * centerForce

          // Damping and update
          node.vx *= damping
          node.vy *= damping
          node.x += node.vx
          node.y += node.vy

          // Bounds
          node.x = Math.max(60, Math.min(width - 60, node.x))
          node.y = Math.max(40, Math.min(height - 40, node.y))
        }
      } else if (viewMode === 'network') {
        // Hierarchical network layout
        const typeGroups = { capture: 0, note: 1, concept: 2 }
        const levelHeight = height / 4

        nodes.forEach((node, i) => {
          const typeIndex = typeGroups[node.type]
          const sameTypeNodes = nodes.filter(n => n.type === node.type)
          const indexInType = sameTypeNodes.indexOf(node)
          const spacing = width / (sameTypeNodes.length + 1)
          
          const targetX = spacing * (indexInType + 1)
          const targetY = 80 + typeIndex * levelHeight

          node.vx = (targetX - node.x) * 0.05
          node.vy = (targetY - node.y) * 0.05
          node.x += node.vx
          node.y += node.vy
        })
      } else if (viewMode === 'dimension') {
        // 3D-like scatter based on properties
        nodes.forEach(node => {
          // Use z coordinate for depth effect
          const depth = node.z || 0.5
          const scale = 0.5 + depth * 0.5
          
          // Slowly rotate the view
          const time = Date.now() * 0.0001
          const rotatedX = node.x - centerX
          const rotatedY = node.y - centerY
          
          const targetX = centerX + rotatedX * Math.cos(time * 0.5) * scale
          const targetY = centerY + rotatedY * scale

          node.vx = (targetX - node.x) * 0.02
          node.vy = (targetY - node.y) * 0.02
          node.x += node.vx
          node.y += node.vy
        })
      }
    }

    const draw = () => {
      ctx.save()
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Apply zoom and offset
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.scale(zoom, zoom)
      ctx.translate(-canvas.width / 2 + offset.x, -canvas.height / 2 + offset.y)

      const nodes = nodesRef.current
      const edges = edgesRef.current

      // Draw background grid for dimension view
      if (viewMode === 'dimension') {
        ctx.strokeStyle = 'rgba(46, 111, 104, 0.1)'
        ctx.lineWidth = 1
        for (let i = 0; i < canvas.width; i += 50) {
          ctx.beginPath()
          ctx.moveTo(i, 0)
          ctx.lineTo(i, canvas.height)
          ctx.stroke()
        }
        for (let i = 0; i < canvas.height; i += 50) {
          ctx.beginPath()
          ctx.moveTo(0, i)
          ctx.lineTo(canvas.width, i)
          ctx.stroke()
        }
      }

      // Draw edges with glow
      for (const edge of edges) {
        const from = nodes.find(n => n.id === edge.from)
        const to = nodes.find(n => n.id === edge.to)
        if (from && to) {
          // Glow effect
          ctx.strokeStyle = edge.color
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.3
          ctx.shadowColor = edge.color
          ctx.shadowBlur = 10
          ctx.beginPath()
          ctx.moveTo(from.x, from.y)
          
          if (viewMode === 'network') {
            // Curved lines for network view
            const midX = (from.x + to.x) / 2
            const midY = (from.y + to.y) / 2 - 30
            ctx.quadraticCurveTo(midX, midY, to.x, to.y)
          } else {
            ctx.lineTo(to.x, to.y)
          }
          ctx.stroke()
          ctx.shadowBlur = 0
          ctx.globalAlpha = 1
        }
      }

      // Draw nodes with glow and depth
      for (const node of nodes) {
        const isHovered = hoveredNode?.id === node.id
        const isSelected = selectedNode?.id === node.id
        const size = node.size * (isHovered ? 1.3 : 1) * (isSelected ? 1.4 : 1)
        const depth = viewMode === 'dimension' ? (node.z || 0.5) : 1
        
        // Outer glow
        ctx.beginPath()
        ctx.arc(node.x, node.y, size + 4, 0, Math.PI * 2)
        ctx.fillStyle = node.color
        ctx.globalAlpha = 0.2 * depth
        ctx.shadowColor = node.color
        ctx.shadowBlur = isHovered ? 20 : 10
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1

        // Node circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2)
        ctx.fillStyle = node.color
        ctx.globalAlpha = 0.6 + depth * 0.4
        ctx.fill()
        ctx.globalAlpha = 1

        // Inner highlight
        ctx.beginPath()
        ctx.arc(node.x - size * 0.3, node.y - size * 0.3, size * 0.4, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.fill()

        // Border
        ctx.beginPath()
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2)
        ctx.strokeStyle = isSelected ? '#E7E0D4' : isHovered ? '#C8A24A' : '#161E29'
        ctx.lineWidth = isSelected ? 3 : 2
        ctx.stroke()

        // Label
        const labelOpacity = isHovered || isSelected ? 1 : viewMode === 'dimension' ? depth * 0.8 : 0.8
        ctx.fillStyle = `rgba(231, 224, 212, ${labelOpacity})`
        ctx.font = `${isHovered ? '12px' : '11px'} Inter, system-ui, sans-serif`
        ctx.textAlign = 'center'
        const label = node.label.length > 18 ? node.label.slice(0, 18) + '...' : node.label
        ctx.fillText(label, node.x, node.y + size + 16)

        // Type indicator
        if (isHovered) {
          ctx.fillStyle = 'rgba(200, 162, 74, 0.8)'
          ctx.font = '9px Inter, system-ui, sans-serif'
          ctx.fillText(node.type.toUpperCase(), node.x, node.y + size + 28)
        }
      }

      ctx.restore()
    }

    let frameCount = 0
    const maxFrames = viewMode === 'dimension' ? Infinity : 300

    const animate = () => {
      simulate()
      draw()
      frameCount++
      if (frameCount < maxFrames) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animate()

    // Mouse handlers
    const getMousePos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      return {
        x: (e.clientX - rect.left - canvas.width / 2) / zoom + canvas.width / 2 - offset.x,
        y: (e.clientY - rect.top - canvas.height / 2) / zoom + canvas.height / 2 - offset.y,
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y
        setOffset(prev => ({ x: prev.x + deltaX / zoom, y: prev.y + deltaY / zoom }))
        setDragStart({ x: e.clientX, y: e.clientY })
        return
      }

      const pos = getMousePos(e)
      let found: VisNode | null = null

      for (const node of nodesRef.current) {
        const dx = pos.x - node.x
        const dy = pos.y - node.y
        if (dx * dx + dy * dy < (node.size + 5) * (node.size + 5)) {
          found = node
          break
        }
      }
      setHoveredNode(found)
      canvas.style.cursor = found ? 'pointer' : isDragging ? 'grabbing' : 'grab'
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (hoveredNode) return
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
      canvas.style.cursor = 'grabbing'
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      canvas.style.cursor = hoveredNode ? 'pointer' : 'grab'
    }

    const handleClick = (e: MouseEvent) => {
      const pos = getMousePos(e)

      for (const node of nodesRef.current) {
        const dx = pos.x - node.x
        const dy = pos.y - node.y
        if (dx * dx + dy * dy < (node.size + 5) * (node.size + 5)) {
          setSelectedNode(node)
          
          // Open detail panel based on type
          if (node.type === 'capture') {
            setSelectedCapture(node.data as Capture)
          } else if (node.type === 'note') {
            setSelectedNote(node.data as AtomicNote)
          } else if (node.type === 'concept') {
            setSelectedConcept(node.data as Concept)
          }
          return
        }
      }
      setSelectedNode(null)
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom(prev => Math.min(3, Math.max(0.3, prev * delta)))
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseUp)
    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', updateSize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseUp)
      canvas.removeEventListener('click', handleClick)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [viewMode, zoom, offset, isDragging, dragStart, hoveredNode, selectedNode, setSelectedCapture, setSelectedNote, setSelectedConcept])

  const resetView = () => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setSelectedNode(null)
    // Regenerate nodes
    nodesRef.current = generateNodes
    edgesRef.current = generateEdges
  }

  const totalItems = (showCaptures ? captures.length : 0) + (showNotes ? notes.length : 0) + (showConcepts ? concepts.length : 0)

  return (
    <div className="h-full flex flex-col bg-deep-obsidian">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-ash-stone/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-serif text-parchment">Visualize</h1>
            <p className="text-sm text-warm-gray mt-1">
              Explore {totalItems} items across your knowledge base
            </p>
          </div>
          
          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(3, z * 1.2))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-sm text-warm-gray w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.3, z * 0.8))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={resetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View mode selector */}
        <div className="flex gap-2 flex-wrap">
          {VIEW_MODES.map(mode => (
            <Button
              key={mode.id}
              variant={viewMode === mode.id ? 'gold' : 'outline'}
              size="sm"
              onClick={() => {
                setViewMode(mode.id)
                resetView()
              }}
              className="gap-2"
            >
              <mode.icon className="h-4 w-4" />
              {mode.label}
            </Button>
          ))}
        </div>

        {/* Filter toggles */}
        <div className="flex gap-3 mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCaptures(!showCaptures)}
            className={cn("gap-2", !showCaptures && "opacity-50")}
          >
            {showCaptures ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS.capture }} />
            Captures ({captures.length})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotes(!showNotes)}
            className={cn("gap-2", !showNotes && "opacity-50")}
          >
            {showNotes ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS.note }} />
            Notes ({notes.length})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConcepts(!showConcepts)}
            className={cn("gap-2", !showConcepts && "opacity-50")}
          >
            {showConcepts ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS.concept }} />
            Concepts ({concepts.length})
          </Button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ background: 'linear-gradient(180deg, #0B0F14 0%, #161E29 100%)' }}
        />

        {/* View description */}
        <div className="absolute bottom-4 left-4">
          <Card className="p-3 bg-charcoal-slate/90 border-ash-stone/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4 text-icon-gold" />
              <span className="text-parchment font-medium">
                {VIEW_MODES.find(m => m.id === viewMode)?.label}
              </span>
            </div>
            <p className="text-xs text-warm-gray mt-1">
              {VIEW_MODES.find(m => m.id === viewMode)?.description}
            </p>
            <p className="text-xs text-warm-gray mt-2">
              Scroll to zoom • Drag to pan • Click nodes to select
            </p>
          </Card>
        </div>

        {/* Selected node info */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-72">
            <Card className="p-4 bg-charcoal-slate/95 border-ash-stone/50 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-2">
                <Badge 
                  variant="outline" 
                  style={{ borderColor: selectedNode.color, color: selectedNode.color }}
                >
                  {selectedNode.type}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => setSelectedNode(null)}
                >
                  ×
                </Button>
              </div>
              <h3 className="text-parchment font-medium mb-2">{selectedNode.label}</h3>
              
              {selectedNode.type === 'capture' && (
                <p className="text-sm text-warm-gray line-clamp-3">
                  {(selectedNode.data as Capture).content}
                </p>
              )}
              {selectedNode.type === 'note' && (
                <p className="text-sm text-warm-gray line-clamp-3">
                  {(selectedNode.data as AtomicNote).summary}
                </p>
              )}
              {selectedNode.type === 'concept' && (
                <p className="text-sm text-warm-gray line-clamp-3">
                  {(selectedNode.data as Concept).definition}
                </p>
              )}
              
              <p className="text-xs text-warm-gray/70 mt-3">
                Click to view full details in side panel
              </p>
            </Card>
          </div>
        )}

        {/* Empty state */}
        {totalItems === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Boxes className="h-12 w-12 text-warm-gray mx-auto mb-4" />
              <h3 className="text-parchment font-medium mb-2">No data to visualize</h3>
              <p className="text-sm text-warm-gray">
                Start by adding captures, notes, or concepts
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
