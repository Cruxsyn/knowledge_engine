import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseExpression, sampleFunction } from '@/lib/math/parser'
import { useAppStore } from '@/stores/appStore'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineGraphProps {
  expression: string
  xMin?: number
  xMax?: number
  height?: number
  className?: string
}

export function InlineGraph({ expression, xMin = -10, xMax = 10, height = 256, className }: InlineGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const navigate = useNavigate()
  const { setPrefillMathInput } = useAppStore()

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.parentElement?.getBoundingClientRect()
    if (!rect) return

    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${height}px`
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const w = rect.width
    const h = height

    // Parse and sample
    const parsed = parseExpression(expression)
    if (!parsed.success || !parsed.expression) {
      ctx.fillStyle = '#B8B1A6'
      ctx.font = '13px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`Could not parse: ${expression}`, w / 2, h / 2)
      return
    }

    const points = sampleFunction(parsed.expression, xMin, xMax, Math.min(w, 500))

    // Auto-compute y bounds from data
    let yMinData = Infinity
    let yMaxData = -Infinity
    for (const p of points) {
      if (!isNaN(p.y) && isFinite(p.y)) {
        if (p.y < yMinData) yMinData = p.y
        if (p.y > yMaxData) yMaxData = p.y
      }
    }

    if (!isFinite(yMinData)) {
      yMinData = -5
      yMaxData = 5
    }

    const yPadding = (yMaxData - yMinData) * 0.15 || 1
    const yMin = yMinData - yPadding
    const yMax = yMaxData + yPadding

    // Coordinate conversion
    const toCanvasX = (x: number) => ((x - xMin) / (xMax - xMin)) * w
    const toCanvasY = (y: number) => h - ((y - yMin) / (yMax - yMin)) * h

    // Background
    ctx.fillStyle = '#0D1117'
    ctx.fillRect(0, 0, w, h)

    // Grid lines
    ctx.strokeStyle = '#161E29'
    ctx.lineWidth = 1

    const gridStepX = niceStep(xMax - xMin, 8)
    const gridStepY = niceStep(yMax - yMin, 6)

    for (let x = Math.ceil(xMin / gridStepX) * gridStepX; x <= xMax; x += gridStepX) {
      const cx = toCanvasX(x)
      ctx.beginPath()
      ctx.moveTo(cx, 0)
      ctx.lineTo(cx, h)
      ctx.stroke()
    }

    for (let y = Math.ceil(yMin / gridStepY) * gridStepY; y <= yMax; y += gridStepY) {
      const cy = toCanvasY(y)
      ctx.beginPath()
      ctx.moveTo(0, cy)
      ctx.lineTo(w, cy)
      ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = '#2E3A4A'
    ctx.lineWidth = 1.5

    // X axis
    if (yMin <= 0 && yMax >= 0) {
      const axisY = toCanvasY(0)
      ctx.beginPath()
      ctx.moveTo(0, axisY)
      ctx.lineTo(w, axisY)
      ctx.stroke()
    }

    // Y axis
    if (xMin <= 0 && xMax >= 0) {
      const axisX = toCanvasX(0)
      ctx.beginPath()
      ctx.moveTo(axisX, 0)
      ctx.lineTo(axisX, h)
      ctx.stroke()
    }

    // Axis labels
    ctx.fillStyle = '#B8B1A6'
    ctx.font = '10px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'

    for (let x = Math.ceil(xMin / gridStepX) * gridStepX; x <= xMax; x += gridStepX) {
      if (Math.abs(x) < 0.001) continue
      const cx = toCanvasX(x)
      const labelY = yMin <= 0 && yMax >= 0 ? Math.min(toCanvasY(0) + 14, h - 4) : h - 4
      ctx.fillText(formatNum(x), cx, labelY)
    }

    ctx.textAlign = 'right'
    for (let y = Math.ceil(yMin / gridStepY) * gridStepY; y <= yMax; y += gridStepY) {
      if (Math.abs(y) < 0.001) continue
      const cy = toCanvasY(y)
      const labelX = xMin <= 0 && xMax >= 0 ? Math.max(toCanvasX(0) - 4, 30) : 30
      ctx.fillText(formatNum(y), labelX, cy + 3)
    }

    // Plot function
    ctx.strokeStyle = '#C8A24A'
    ctx.lineWidth = 2
    ctx.beginPath()

    let drawing = false
    for (const p of points) {
      const cx = toCanvasX(p.x)
      const cy = toCanvasY(p.y)

      if (isNaN(p.y) || !isFinite(p.y) || cy < -100 || cy > h + 100) {
        drawing = false
        continue
      }

      if (!drawing) {
        ctx.moveTo(cx, cy)
        drawing = true
      } else {
        ctx.lineTo(cx, cy)
      }
    }
    ctx.stroke()

    // Expression label
    ctx.fillStyle = '#C8A24A'
    ctx.font = '12px "JetBrains Mono", monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`y = ${expression}`, 8, 16)
  }, [expression, xMin, xMax, height])

  useEffect(() => {
    draw()
    const handleResize = () => draw()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [draw])

  const openInMathViz = () => {
    setPrefillMathInput(expression)
    navigate('/math-viz')
  }

  return (
    <div className={cn('relative my-8 rounded-lg border border-ash-stone/50 overflow-hidden', className)}>
      <canvas ref={canvasRef} className="w-full" style={{ height }} />
      <button
        onClick={openInMathViz}
        className="absolute top-2 right-2 p-1.5 rounded bg-charcoal-slate/80 text-warm-gray hover:text-icon-gold transition-colors"
        title="Open in Math Viz"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function niceStep(range: number, targetSteps: number): number {
  const rough = range / targetSteps
  const pow = Math.pow(10, Math.floor(Math.log10(rough)))
  const normalized = rough / pow
  if (normalized < 1.5) return pow
  if (normalized < 3.5) return 2 * pow
  if (normalized < 7.5) return 5 * pow
  return 10 * pow
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return n.toString()
  return n.toFixed(1)
}
