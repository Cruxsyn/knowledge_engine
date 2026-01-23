import { useEffect, useRef } from 'react'
import { useConcepts } from '@/hooks/useConcepts'
import { useAppStore } from '@/stores/appStore'

interface ConceptGraphProps {
  conceptId?: string
}

interface Node {
  id: string
  name: string
  x: number
  y: number
  vx: number
  vy: number
  isCurrent: boolean
}

interface Edge {
  from: string
  to: string
  relationship: string
}

export function ConceptGraph({ conceptId }: ConceptGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { concepts, getGraphData, getConceptById } = useConcepts()
  const { setSelectedConcept } = useAppStore()
  const animationRef = useRef<number | undefined>(undefined)
  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<Edge[]>([])

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

    // Get graph data
    const graphData = getGraphData()
    
    // Create nodes with positions
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(canvas.width, canvas.height) / 3

    nodesRef.current = concepts.map((concept, i) => {
      const angle = (i / concepts.length) * Math.PI * 2
      return {
        id: concept.id,
        name: concept.name,
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 50,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
        isCurrent: concept.id === conceptId,
      }
    })

    edgesRef.current = graphData.edges

    // Simple force-directed layout
    const simulate = () => {
      const nodes = nodesRef.current
      const edges = edgesRef.current
      const damping = 0.9
      const repulsion = 2000
      const attraction = 0.01
      const centerForce = 0.001

      // Apply forces
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
          node.vx += (dx / dist) * force
          node.vy += (dy / dist) * force
        }

        // Attraction to connected nodes
        for (const edge of edges) {
          let other: Node | undefined
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

        // Apply damping
        node.vx *= damping
        node.vy *= damping

        // Update position
        node.x += node.vx
        node.y += node.vy

        // Keep in bounds
        node.x = Math.max(50, Math.min(canvas.width - 50, node.x))
        node.y = Math.max(30, Math.min(canvas.height - 30, node.y))
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const nodes = nodesRef.current
      const edges = edgesRef.current

      // Draw edges
      ctx.strokeStyle = '#1E4E8C'
      ctx.lineWidth = 1
      for (const edge of edges) {
        const from = nodes.find(n => n.id === edge.from)
        const to = nodes.find(n => n.id === edge.to)
        if (from && to) {
          ctx.beginPath()
          ctx.moveTo(from.x, from.y)
          ctx.lineTo(to.x, to.y)
          ctx.stroke()
        }
      }

      // Draw nodes
      for (const node of nodes) {
        // Node circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.isCurrent ? 12 : 8, 0, Math.PI * 2)
        ctx.fillStyle = node.isCurrent ? '#C8A24A' : '#2E6F68'
        ctx.fill()
        ctx.strokeStyle = node.isCurrent ? '#C8A24A' : '#161E29'
        ctx.lineWidth = 2
        ctx.stroke()

        // Node label
        ctx.fillStyle = '#E7E0D4'
        ctx.font = '11px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(
          node.name.length > 15 ? node.name.slice(0, 15) + '...' : node.name,
          node.x,
          node.y + 22
        )
      }
    }

    const animate = () => {
      simulate()
      draw()
      animationRef.current = requestAnimationFrame(animate)
    }

    // Run simulation for a bit then stop
    let frameCount = 0
    const maxFrames = 200
    
    const animateWithLimit = () => {
      simulate()
      draw()
      frameCount++
      if (frameCount < maxFrames) {
        animationRef.current = requestAnimationFrame(animateWithLimit)
      }
    }

    animateWithLimit()

    // Click handler
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      for (const node of nodesRef.current) {
        const dx = x - node.x
        const dy = y - node.y
        if (dx * dx + dy * dy < 144) { // 12^2
          const concept = getConceptById(node.id)
          if (concept) {
            setSelectedConcept(concept)
          }
          break
        }
      }
    }

    canvas.addEventListener('click', handleClick)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      canvas.removeEventListener('click', handleClick)
    }
  }, [concepts, conceptId, getGraphData, getConceptById, setSelectedConcept])

  if (concepts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-warm-gray text-sm">
        No concepts to visualize
      </div>
    )
  }

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full cursor-pointer"
      style={{ background: '#0B0F14' }}
    />
  )
}
