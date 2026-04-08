import { useState, useEffect, useRef, useMemo } from 'react'
import { useNotes } from '@/hooks/useNotes'
import { useConcepts } from '@/hooks/useConcepts'
import { useAppStore } from '@/stores/appStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  Network
} from 'lucide-react'
import { FormattedText } from '@/components/ui/formatted-text'
import { BranchTerminal } from '@/components/visualize/BranchTerminal'
import { BranchPreview } from '@/components/visualize/BranchPreview'
import type { AtomicNote, Concept } from '@/types'
import { getNoteDisplayText } from '@/types'

type NodeType = 'note' | 'concept'

interface VisNode {
  id: string
  type: NodeType
  label: string
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  data: AtomicNote | Concept
}

interface VisEdge {
  from: string
  to: string
  color: string
}

const NODE_COLORS = {
  note: '#4A9E8F', // matte teal
  concept: '#5B7DB8', // matte blue
}

const EDGE_COLORS = {
  noteToContent: '#8B7355', // matte gold/brown
  conceptToConcept: '#5B7DB8', // matte blue
}

export function VisualizePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<VisNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<VisNode | null>(null)
  const [showNotes, setShowNotes] = useState(true)
  const [showConcepts, setShowConcepts] = useState(true)
  const [showBranchEditor, setShowBranchEditor] = useState(false)
  const [branchParent, setBranchParent] = useState<VisNode | null>(null)
  const [draftNode, setDraftNode] = useState<VisNode | null>(null)
  const [preBranchView, setPreBranchView] = useState<{ zoom: number; offset: { x: number; y: number } } | null>(null)

  const { notes } = useNotes()
  const { concepts, getGraphData } = useConcepts()
  const { setSelectedNote, setSelectedConcept } = useAppStore()
  
  const animationRef = useRef<number | undefined>(undefined)
  const nodesRef = useRef<VisNode[]>([])
  const edgesRef = useRef<VisEdge[]>([])
  const draftNodeRef = useRef<VisNode | null>(null)
  const branchParentRef = useRef<VisNode | null>(null)
  const showBranchEditorRef = useRef(false)

  // Generate visualization nodes spread across the canvas
  const generateNodes = useMemo(() => {
    const nodes: VisNode[] = []
    const canvas = canvasRef.current
    const width = canvas?.width || 800
    const height = canvas?.height || 600
    const centerX = width / 2
    const centerY = height / 2

    const totalNodes = (showNotes ? notes.length : 0) + (showConcepts ? concepts.length : 0)
    
    // Spread nodes across the entire canvas with more spacing
    const getSpreadPosition = (index: number, total: number) => {
      const angle = (index / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.8
      const maxRadius = Math.min(width, height) * 0.4
      const minRadius = maxRadius * 0.2
      const radius = minRadius + Math.random() * (maxRadius - minRadius)
      
      return {
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 100,
      }
    }

    let nodeIndex = 0

    if (showNotes) {
      notes.forEach((note) => {
        const pos = getSpreadPosition(nodeIndex, totalNodes)
        nodes.push({
          id: `note-${note.id}`,
          type: 'note',
          label: note.title,
          x: pos.x,
          y: pos.y,
          vx: 0,
          vy: 0,
          color: NODE_COLORS.note,
          size: 8,
          data: note,
        })
        nodeIndex++
      })
    }

    if (showConcepts) {
      concepts.forEach((concept) => {
        const pos = getSpreadPosition(nodeIndex, totalNodes)
        nodes.push({
          id: `concept-${concept.id}`,
          type: 'concept',
          label: concept.name,
          x: pos.x,
          y: pos.y,
          vx: 0,
          vy: 0,
          color: NODE_COLORS.concept,
          size: 10,
          data: concept,
        })
        nodeIndex++
      })
    }

    return nodes
  }, [notes, concepts, showNotes, showConcepts])

  // Generate edges based on note-concept relationships
  const [graphEdgesData, setGraphEdgesData] = useState<{ from: string; to: string; relationship: string }[]>([])

  useEffect(() => {
    getGraphData().then(data => setGraphEdgesData(data.edges))
  }, [getGraphData])

  const generateEdges = useMemo(() => {
    const edges: VisEdge[] = []

    // Concept-to-concept relationships
    if (showConcepts) {
      graphEdgesData.forEach(edge => {
        edges.push({
          from: `concept-${edge.from}`,
          to: `concept-${edge.to}`,
          color: EDGE_COLORS.conceptToConcept,
        })
      })
    }

    // Note-to-concept relationships
    if (showNotes && showConcepts) {
      notes.forEach(note => {
        if (note.concepts) {
          note.concepts.forEach(concept => {
            edges.push({
              from: `note-${note.id}`,
              to: `concept-${concept.id}`,
              color: EDGE_COLORS.noteToContent,
            })
          })
        }
      })
    }

    return edges
  }, [notes, showNotes, showConcepts, graphEdgesData])

  // Initialize nodes
  useEffect(() => {
    nodesRef.current = generateNodes
    edgesRef.current = generateEdges
  }, [generateNodes, generateEdges])

  // Keep refs in sync with state for canvas drawing
  useEffect(() => {
    draftNodeRef.current = draftNode
    branchParentRef.current = branchParent
    showBranchEditorRef.current = showBranchEditor
  }, [draftNode, branchParent, showBranchEditor])

  // Branching handlers
  const startBranching = (parent: VisNode) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Save current view for restoration later
    setPreBranchView({ zoom, offset })

    // Calculate position for new draft node (to the right of parent)
    const angle = 0 // 0 degrees = right side
    const distance = 100
    const newX = parent.x + Math.cos(angle) * distance
    const newY = parent.y + Math.sin(angle) * distance

    const draft: VisNode = {
      id: 'draft-node',
      type: 'note',
      label: 'New Note',
      x: newX,
      y: newY,
      vx: 0,
      vy: 0,
      color: NODE_COLORS.note,
      size: 8,
      data: {} as AtomicNote,
    }

    // Auto-zoom and pan to focus on the parent and draft node
    // Center point between parent and draft
    const centerX = (parent.x + newX) / 2
    const centerY = (parent.y + newY) / 2

    // Calculate offset to center this point (accounting for split view - graph is on left half)
    const canvasCenter = canvas.width / 2
    const canvasMiddleY = canvas.height / 2

    // Zoom in to 1.5x for better focus
    const newZoom = 1.8
    setZoom(newZoom)

    // Offset to bring the center point to the visible area
    setOffset({
      x: canvasCenter - centerX,
      y: canvasMiddleY - centerY
    })

    setBranchParent(parent)
    setDraftNode(draft)
    setShowBranchEditor(true)
  }

  const handleBranchSave = () => {
    // Restore previous view
    if (preBranchView) {
      setZoom(preBranchView.zoom)
      setOffset(preBranchView.offset)
      setPreBranchView(null)
    }
    setDraftNode(null)
    setBranchParent(null)
    setShowBranchEditor(false)
  }

  const cancelBranching = () => {
    // Restore previous view
    if (preBranchView) {
      setZoom(preBranchView.zoom)
      setOffset(preBranchView.offset)
      setPreBranchView(null)
    }
    setDraftNode(null)
    setBranchParent(null)
    setShowBranchEditor(false)
  }

  // Keyboard handler for branch creation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter to start branching when hovering a node
      if (e.key === 'Enter' && hoveredNode && !showBranchEditor) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          startBranching(hoveredNode)
        }
      }

      // Escape to cancel branching
      if (e.key === 'Escape' && showBranchEditor) {
        cancelBranching()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hoveredNode, showBranchEditor])

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

    // Force-directed simulation - more spread out
    const simulate = () => {
      const nodes = nodesRef.current
      const edges = edgesRef.current
      const width = canvas.width
      const height = canvas.height
      const centerX = width / 2
      const centerY = height / 2

      const damping = 0.9
      const repulsion = 8000 // Stronger repulsion for more spread
      const attraction = 0.008 // Weaker attraction
      const centerForce = 0.001

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]

        // Repulsion from other nodes - stronger and longer range
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue
          const other = nodes[j]
          const dx = node.x - other.x
          const dy = node.y - other.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          
          if (dist < 400) { // Longer range repulsion
            const force = repulsion / (dist * dist)
            node.vx += (dx / dist) * force * 0.05
            node.vy += (dy / dist) * force * 0.05
          }
        }

        // Attraction to connected nodes - gentle
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
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            // Only attract if far apart
            if (dist > 150) {
              const force = attraction * (dist - 150)
              node.vx += (dx / dist) * force
              node.vy += (dy / dist) * force
            }
          }
        }

        // Very gentle center gravity
        node.vx += (centerX - node.x) * centerForce
        node.vy += (centerY - node.y) * centerForce

        // Apply damping
        node.vx *= damping
        node.vy *= damping

        // Update position
        node.x += node.vx
        node.y += node.vy

        // Soft bounds
        const margin = 60
        if (node.x < margin) node.vx += (margin - node.x) * 0.03
        if (node.x > width - margin) node.vx -= (node.x - (width - margin)) * 0.03
        if (node.y < margin) node.vy += (margin - node.y) * 0.03
        if (node.y > height - margin) node.vy -= (node.y - (height - margin)) * 0.03
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

      // Draw edges - simple straight lines
      for (const edge of edges) {
        const from = nodes.find(n => n.id === edge.from)
        const to = nodes.find(n => n.id === edge.to)
        if (from && to) {
          ctx.strokeStyle = edge.color
          ctx.lineWidth = 1.5
          ctx.globalAlpha = 0.6
          ctx.beginPath()
          ctx.moveTo(from.x, from.y)
          ctx.lineTo(to.x, to.y)
          ctx.stroke()
          ctx.globalAlpha = 1
        }
      }

      // Draw nodes - simple matte circles
      for (const node of nodes) {
        const isHovered = hoveredNode?.id === node.id
        const isSelected = selectedNode?.id === node.id
        const size = node.size * (isHovered ? 1.2 : 1) * (isSelected ? 1.3 : 1)
        
        // Simple matte circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2)
        ctx.fillStyle = node.color
        ctx.fill()

        // Simple border for selected/hovered
        if (isSelected || isHovered) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, size + 2, 0, Math.PI * 2)
          ctx.strokeStyle = isSelected ? '#E7E0D4' : '#A0937D'
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // Label
        ctx.fillStyle = isHovered || isSelected ? '#E7E0D4' : 'rgba(231, 224, 212, 0.7)'
        ctx.font = '10px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        const label = node.label.length > 20 ? node.label.slice(0, 20) + '...' : node.label
        ctx.fillText(label, node.x, node.y + size + 14)
      }

      // Draw branch indicator when hovering a node (and not in branch editor mode)
      if (hoveredNode && !showBranchEditorRef.current) {
        const node = nodes.find(n => n.id === hoveredNode.id)
        if (node) {
          // Calculate position for branch indicator (45 degrees, 50px away)
          const indicatorDistance = 50
          const angle = Math.PI / 4 // 45 degrees
          const indicatorX = node.x + Math.cos(angle) * indicatorDistance
          const indicatorY = node.y - Math.sin(angle) * indicatorDistance

          // Draw dashed line from node to indicator
          ctx.setLineDash([4, 4])
          ctx.strokeStyle = '#A0937D'
          ctx.lineWidth = 1.5
          ctx.globalAlpha = 0.6
          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(indicatorX, indicatorY)
          ctx.stroke()
          ctx.setLineDash([])

          // Draw "+" indicator circle
          ctx.globalAlpha = 1
          ctx.beginPath()
          ctx.arc(indicatorX, indicatorY, 12, 0, Math.PI * 2)
          ctx.fillStyle = '#1A1D23'
          ctx.fill()
          ctx.strokeStyle = '#A0937D'
          ctx.lineWidth = 2
          ctx.stroke()

          // Draw "+" symbol
          ctx.fillStyle = '#A0937D'
          ctx.font = 'bold 14px Inter, system-ui, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('+', indicatorX, indicatorY)

          // Draw hint text
          ctx.globalAlpha = 0.8
          ctx.fillStyle = '#E7E0D4'
          ctx.font = '9px Inter, system-ui, sans-serif'
          ctx.textBaseline = 'alphabetic'
          ctx.fillText('Enter to branch', indicatorX, indicatorY + 22)
          ctx.globalAlpha = 1
        }
      }

      // Draw draft node when branching
      const draft = draftNodeRef.current
      const parent = branchParentRef.current
      if (draft && parent) {
        const parentNode = nodes.find(n => n.id === parent.id)
        if (parentNode) {
          // Draw dashed connection to parent
          ctx.setLineDash([4, 4])
          ctx.strokeStyle = NODE_COLORS.note
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.6
          ctx.beginPath()
          ctx.moveTo(parentNode.x, parentNode.y)
          ctx.lineTo(draft.x, draft.y)
          ctx.stroke()
          ctx.setLineDash([])
          ctx.globalAlpha = 1

          // Draw draft node with dashed border
          const size = draft.size * 1.2
          ctx.beginPath()
          ctx.arc(draft.x, draft.y, size, 0, Math.PI * 2)
          ctx.fillStyle = draft.color
          ctx.globalAlpha = 0.7
          ctx.fill()
          ctx.globalAlpha = 1

          // Dashed border to indicate draft state
          ctx.setLineDash([3, 3])
          ctx.strokeStyle = '#E7E0D4'
          ctx.lineWidth = 2
          ctx.stroke()
          ctx.setLineDash([])

          // Label
          ctx.fillStyle = '#E7E0D4'
          ctx.font = 'italic 10px Inter, system-ui, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'alphabetic'
          ctx.fillText(draft.label, draft.x, draft.y + size + 14)
        }
      }

      ctx.restore()
    }

    // Continuous simulation
    const animate = () => {
      simulate()
      draw()
      animationRef.current = requestAnimationFrame(animate)
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
          
          if (node.type === 'note') {
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
  }, [zoom, offset, isDragging, dragStart, hoveredNode, selectedNode, setSelectedNote, setSelectedConcept])

  const resetView = () => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setSelectedNode(null)
    nodesRef.current = generateNodes
    edgesRef.current = generateEdges
  }

  const totalItems = (showNotes ? notes.length : 0) + (showConcepts ? concepts.length : 0)

  return (
    <div className="h-full flex flex-col bg-deep-obsidian">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-ash-stone/50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-serif text-parchment flex items-center gap-2">
              <Network className="h-6 w-6 text-icon-gold" />
              Knowledge Network
            </h1>
            <p className="text-sm text-warm-gray mt-1">
              {totalItems} items • {edgesRef.current.length} connections
            </p>
          </div>
          
          {/* Controls */}
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

        {/* Filter toggles */}
        <div className="flex gap-3">
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

      {/* Main content area - split view when branching */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area */}
        <div className={cn("relative", showBranchEditor ? "w-1/2" : "w-full")}>
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ background: '#0D1117' }}
          />

          {/* Help text - hide when branching */}
          {!showBranchEditor && (
            <div className="absolute bottom-4 left-4">
              <Card className="p-3 bg-charcoal-slate/90 border-ash-stone/50 backdrop-blur-sm">
                <p className="text-xs text-warm-gray">
                  Scroll to zoom • Drag to pan • Click to select • <span className="text-icon-gold">Hover + Enter to branch</span>
                </p>
              </Card>
            </div>
          )}

          {/* Selected node info - hide when branching */}
          {selectedNode && !showBranchEditor && (
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

                {selectedNode.type === 'note' && (
                  <div className="text-sm text-warm-gray line-clamp-3">
                    <FormattedText inline>{getNoteDisplayText(selectedNode.data as AtomicNote).primary}</FormattedText>
                  </div>
                )}
                {selectedNode.type === 'concept' && (
                  <div className="text-sm text-warm-gray line-clamp-3">
                    <FormattedText inline>{(selectedNode.data as Concept).definition}</FormattedText>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Branch Preview - shows on left side when branching */}
          {showBranchEditor && branchParent && (
            <div className="absolute top-4 left-4 z-10">
              <BranchPreview
                parentNode={{
                  id: branchParent.id,
                  type: branchParent.type,
                  label: branchParent.label,
                  data: branchParent.data,
                }}
                draftLabel={draftNode?.label || 'New Note'}
              />
            </div>
          )}

          {/* Empty state */}
          {totalItems === 0 && !showBranchEditor && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Network className="h-12 w-12 text-warm-gray mx-auto mb-4" />
                <h3 className="text-parchment font-medium mb-2">No data to visualize</h3>
                <p className="text-sm text-warm-gray">
                  Add notes and concepts to see your knowledge network
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Branch Terminal - right side when branching */}
        {showBranchEditor && branchParent && (
          <div className="w-1/2">
            <BranchTerminal
              parentNode={{
                id: branchParent.id,
                type: branchParent.type,
                label: branchParent.label,
                data: branchParent.data,
              }}
              onSave={handleBranchSave}
              onCancel={cancelBranching}
            />
          </div>
        )}
      </div>
    </div>
  )
}
