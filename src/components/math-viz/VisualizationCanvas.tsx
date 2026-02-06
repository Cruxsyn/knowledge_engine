import { useRef, useEffect, useCallback } from 'react'
import { useMathVizStore } from '@/stores/mathVizStore'

interface VisualizationCanvasProps {
  children?: (ctx: CanvasRenderingContext2D, transform: TransformContext) => void
  onMouseMove?: (coords: { x: number; y: number }) => void
  className?: string
}

export interface TransformContext {
  // Convert math coordinates to canvas pixels
  toCanvas: (x: number, y: number) => { x: number; y: number }
  // Convert canvas pixels to math coordinates
  toMath: (x: number, y: number) => { x: number; y: number }
  // Canvas dimensions
  width: number
  height: number
  // Math bounds
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number }
}

export function VisualizationCanvas({ children, onMouseMove, className }: VisualizationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const {
    graphBounds,
    setGraphBounds,
    showGrid,
    showAxes,
    setMouseCoords,
  } = useMathVizStore()

  // Create transform functions
  const createTransform = useCallback((canvas: HTMLCanvasElement): TransformContext => {
    const width = canvas.width
    const height = canvas.height
    const { xMin, xMax, yMin, yMax } = graphBounds

    const xRange = xMax - xMin
    const yRange = yMax - yMin

    return {
      toCanvas: (x: number, y: number) => ({
        x: ((x - xMin) / xRange) * width,
        y: ((yMax - y) / yRange) * height, // Flip y-axis
      }),
      toMath: (canvasX: number, canvasY: number) => ({
        x: (canvasX / width) * xRange + xMin,
        y: yMax - (canvasY / height) * yRange, // Flip y-axis
      }),
      width,
      height,
      bounds: graphBounds,
    }
  }, [graphBounds])

  // Draw grid
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, transform: TransformContext) => {
    const { width, height, bounds } = transform
    const { xMin, xMax, yMin, yMax } = bounds

    // Calculate grid spacing (aim for ~10-20 grid lines per axis)
    const xRange = xMax - xMin
    const yRange = yMax - yMin

    const getGridStep = (range: number) => {
      const rawStep = range / 10
      const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
      const normalized = rawStep / magnitude

      if (normalized <= 1) return magnitude
      if (normalized <= 2) return 2 * magnitude
      if (normalized <= 5) return 5 * magnitude
      return 10 * magnitude
    }

    const xStep = getGridStep(xRange)
    const yStep = getGridStep(yRange)

    ctx.strokeStyle = '#2a2a2a'
    ctx.lineWidth = 1

    // Vertical grid lines
    const xStart = Math.ceil(xMin / xStep) * xStep
    for (let x = xStart; x <= xMax; x += xStep) {
      const { x: canvasX } = transform.toCanvas(x, 0)
      ctx.beginPath()
      ctx.moveTo(canvasX, 0)
      ctx.lineTo(canvasX, height)
      ctx.stroke()
    }

    // Horizontal grid lines
    const yStart = Math.ceil(yMin / yStep) * yStep
    for (let y = yStart; y <= yMax; y += yStep) {
      const { y: canvasY } = transform.toCanvas(0, y)
      ctx.beginPath()
      ctx.moveTo(0, canvasY)
      ctx.lineTo(width, canvasY)
      ctx.stroke()
    }
  }, [])

  // Draw axes
  const drawAxes = useCallback((ctx: CanvasRenderingContext2D, transform: TransformContext) => {
    const { width, height, bounds } = transform
    const { xMin, xMax, yMin, yMax } = bounds

    ctx.strokeStyle = '#666666'
    ctx.lineWidth = 2

    // X-axis (y = 0)
    if (yMin <= 0 && yMax >= 0) {
      const { y: axisY } = transform.toCanvas(0, 0)
      ctx.beginPath()
      ctx.moveTo(0, axisY)
      ctx.lineTo(width, axisY)
      ctx.stroke()
    }

    // Y-axis (x = 0)
    if (xMin <= 0 && xMax >= 0) {
      const { x: axisX } = transform.toCanvas(0, 0)
      ctx.beginPath()
      ctx.moveTo(axisX, 0)
      ctx.lineTo(axisX, height)
      ctx.stroke()
    }

    // Axis labels
    ctx.fillStyle = '#888888'
    ctx.font = '11px Inter, system-ui, sans-serif'

    // Calculate label step
    const xRange = xMax - xMin
    const yRange = yMax - yMin
    const getStep = (range: number) => {
      const rawStep = range / 5
      const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
      const normalized = rawStep / magnitude
      if (normalized <= 1) return magnitude
      if (normalized <= 2) return 2 * magnitude
      if (normalized <= 5) return 5 * magnitude
      return 10 * magnitude
    }

    const xStep = getStep(xRange)
    const yStep = getStep(yRange)

    // X-axis labels
    const xStart = Math.ceil(xMin / xStep) * xStep
    for (let x = xStart; x <= xMax; x += xStep) {
      if (Math.abs(x) < 0.0001) continue // Skip origin
      const { x: canvasX } = transform.toCanvas(x, 0)
      let labelY = height - 5
      if (yMin <= 0 && yMax >= 0) {
        const { y: axisY } = transform.toCanvas(0, 0)
        labelY = Math.min(axisY + 15, height - 5)
      }
      ctx.textAlign = 'center'
      ctx.fillText(formatNumber(x), canvasX, labelY)
    }

    // Y-axis labels
    const yStart = Math.ceil(yMin / yStep) * yStep
    for (let y = yStart; y <= yMax; y += yStep) {
      if (Math.abs(y) < 0.0001) continue // Skip origin
      const { y: canvasY } = transform.toCanvas(0, y)
      let labelX = 5
      if (xMin <= 0 && xMax >= 0) {
        const { x: axisX } = transform.toCanvas(0, 0)
        labelX = Math.max(axisX + 5, 5)
      }
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(formatNumber(y), labelX, canvasY)
    }
  }, [])

  // Store canvas dimensions in refs to avoid re-renders
  const canvasSizeRef = useRef({ width: 0, height: 0 })

  // Effect 1: Canvas setup (runs once on mount) - handles sizing and ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const updateSize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        const dpr = window.devicePixelRatio || 1
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`
        // Use setTransform to reset and apply scale (avoids accumulation)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        canvasSizeRef.current = { width: rect.width, height: rect.height }
      }
    }

    updateSize()

    const resizeObserver = new ResizeObserver(updateSize)
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, []) // Empty deps - only run on mount

  // Effect 2: Render (runs on graphBounds/display options change)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Use requestAnimationFrame for smooth rendering
    const frameId = requestAnimationFrame(() => {
      const displayWidth = canvasSizeRef.current.width || canvas.width / (window.devicePixelRatio || 1)
      const displayHeight = canvasSizeRef.current.height || canvas.height / (window.devicePixelRatio || 1)

      if (displayWidth === 0 || displayHeight === 0) return

      // Clear
      ctx.fillStyle = '#0D1117'
      ctx.fillRect(0, 0, displayWidth, displayHeight)

      // Create transform with display dimensions
      const transform: TransformContext = {
        ...createTransform(canvas),
        width: displayWidth,
        height: displayHeight,
        toCanvas: (x: number, y: number) => {
          const { xMin, xMax, yMin, yMax } = graphBounds
          const xRange = xMax - xMin
          const yRange = yMax - yMin
          return {
            x: ((x - xMin) / xRange) * displayWidth,
            y: ((yMax - y) / yRange) * displayHeight,
          }
        },
        toMath: (canvasX: number, canvasY: number) => {
          const { xMin, xMax, yMin, yMax } = graphBounds
          const xRange = xMax - xMin
          const yRange = yMax - yMin
          return {
            x: (canvasX / displayWidth) * xRange + xMin,
            y: yMax - (canvasY / displayHeight) * yRange,
          }
        },
      }

      // Draw grid
      if (showGrid) {
        drawGrid(ctx, transform)
      }

      // Draw axes
      if (showAxes) {
        drawAxes(ctx, transform)
      }

      // Draw custom content
      if (children) {
        children(ctx, transform)
      }
    })

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [graphBounds, showGrid, showAxes, children, createTransform, drawGrid, drawAxes])

  // Pan state - declared early so mouse move handler can check it
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  // Mouse move handler stored in ref - updated on every render with latest graphBounds
  const handleMouseMoveRef = useRef<(e: React.MouseEvent<HTMLCanvasElement>) => void>(() => {})

  handleMouseMoveRef.current = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Adjust for display size
    const displayWidth = canvas.width / (window.devicePixelRatio || 1)
    const displayHeight = canvas.height / (window.devicePixelRatio || 1)

    const { xMin, xMax, yMin, yMax } = graphBounds
    const xRange = xMax - xMin
    const yRange = yMax - yMin

    const mathCoords = {
      x: (x / displayWidth) * xRange + xMin,
      y: yMax - (y / displayHeight) * yRange,
    }

    // Don't update store during drag (reduces re-renders for smoother panning)
    if (!isDragging.current) {
      setMouseCoords(mathCoords)
    }
    onMouseMove?.(mathCoords)
  }

  // Stable callback that delegates to ref
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    handleMouseMoveRef.current(e)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setMouseCoords(null)
  }, [setMouseCoords])

  // Wheel zoom handler - stored in ref so we can attach with { passive: false }
  const handleWheelRef = useRef<(e: WheelEvent) => void>(() => {})

  handleWheelRef.current = (e: WheelEvent) => {
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const displayWidth = rect.width
    const displayHeight = rect.height

    // Get mouse position in math coordinates before zoom
    const { xMin, xMax, yMin, yMax } = graphBounds
    const xRange = xMax - xMin
    const yRange = yMax - yMin

    const mathX = (mouseX / displayWidth) * xRange + xMin
    const mathY = yMax - (mouseY / displayHeight) * yRange

    // Calculate zoom factor
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9

    // New ranges
    const newXRange = xRange * zoomFactor
    const newYRange = yRange * zoomFactor

    // Calculate new bounds centered on mouse position
    const xRatio = (mathX - xMin) / xRange
    const yRatio = (yMax - mathY) / yRange

    const newXMin = mathX - xRatio * newXRange
    const newXMax = mathX + (1 - xRatio) * newXRange
    const newYMin = mathY - (1 - yRatio) * newYRange
    const newYMax = mathY + yRatio * newYRange

    setGraphBounds({
      xMin: newXMin,
      xMax: newXMax,
      yMin: newYMin,
      yMax: newYMax,
    })
  }

  // Attach wheel event listener with { passive: false } to allow preventDefault
  // Empty dependency array because we use ref pattern - handleWheelRef.current always has latest state
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const wheelHandler = (e: WheelEvent) => {
      handleWheelRef.current(e)
    }

    canvas.addEventListener('wheel', wheelHandler, { passive: false })

    return () => {
      canvas.removeEventListener('wheel', wheelHandler)
    }
  }, [])

  // Pan with drag
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  // Drag handler stored in ref - updated on every render with latest graphBounds
  const handleDragRef = useRef<(e: React.MouseEvent<HTMLCanvasElement>) => void>(() => {})

  handleDragRef.current = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }

    const { xMin, xMax, yMin, yMax } = graphBounds
    const xRange = xMax - xMin
    const yRange = yMax - yMin

    const xShift = (dx / rect.width) * xRange
    const yShift = (dy / rect.height) * yRange

    setGraphBounds({
      xMin: xMin - xShift,
      xMax: xMax - xShift,
      yMin: yMin + yShift,
      yMax: yMax + yShift,
    })
  }

  // Stable callback that delegates to ref
  const handleDrag = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    handleDragRef.current(e)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ cursor: isDragging.current ? 'grabbing' : 'crosshair' }}
      onMouseMove={(e) => {
        handleMouseMove(e)
        handleDrag(e)
      }}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    />
  )
}

// Helper to format numbers nicely
function formatNumber(n: number): string {
  if (Math.abs(n) < 0.0001) return '0'
  if (Math.abs(n) >= 1000 || Math.abs(n) < 0.01) {
    return n.toExponential(1)
  }
  // Remove trailing zeros
  return parseFloat(n.toPrecision(3)).toString()
}
