import { useCallback } from 'react'
import { VisualizationCanvas, type TransformContext } from './VisualizationCanvas'
import type { ParsedExpression } from '@/hooks/useMathVisualization'

interface FunctionGraphProps {
  expressions: ParsedExpression[]
  className?: string
}

export function FunctionGraph({ expressions, className }: FunctionGraphProps) {
  const renderFunctions = useCallback((ctx: CanvasRenderingContext2D, transform: TransformContext) => {
    const { height, bounds } = transform
    const { yMin, yMax } = bounds
    const yRange = yMax - yMin

    // Draw each function
    for (const expr of expressions) {
      if (expr.expression.visualizationType !== 'function-2d' || !expr.points) continue

      const points = expr.points
      const color = expr.expression.color

      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      let isDrawing = false
      let prevPoint: { x: number; y: number } | null = null

      ctx.beginPath()

      for (let i = 0; i < points.length; i++) {
        const point = points[i]

        // Skip NaN points (discontinuities)
        if (isNaN(point.y)) {
          if (isDrawing) {
            ctx.stroke()
            ctx.beginPath()
            isDrawing = false
          }
          prevPoint = null
          continue
        }

        // Skip points way outside the visible range (prevent rendering issues)
        const yPadding = yRange * 10
        if (point.y < yMin - yPadding || point.y > yMax + yPadding) {
          if (isDrawing) {
            ctx.stroke()
            ctx.beginPath()
            isDrawing = false
          }
          prevPoint = null
          continue
        }

        const canvasPoint = transform.toCanvas(point.x, point.y)

        // Detect discontinuities (large jumps)
        if (prevPoint) {
          const prevCanvas = transform.toCanvas(prevPoint.x, prevPoint.y)
          const dy = Math.abs(canvasPoint.y - prevCanvas.y)

          // If jump is more than half the canvas height, treat as discontinuity
          if (dy > height * 0.5) {
            ctx.stroke()
            ctx.beginPath()
            isDrawing = false
          }
        }

        if (!isDrawing) {
          ctx.moveTo(canvasPoint.x, canvasPoint.y)
          isDrawing = true
        } else {
          ctx.lineTo(canvasPoint.x, canvasPoint.y)
        }

        prevPoint = point
      }

      if (isDrawing) {
        ctx.stroke()
      }
    }

    // Draw derivative lines (dashed)
    for (const expr of expressions) {
      if (expr.expression.visualizationType !== 'function-2d' || !expr.derivativePoints) continue

      const dPoints = expr.derivativePoints
      const color = expr.expression.color

      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.setLineDash([6, 4])
      ctx.globalAlpha = 0.7

      let isDrawingD = false

      ctx.beginPath()

      for (let i = 0; i < dPoints.length; i++) {
        const point = dPoints[i]
        if (isNaN(point.y)) {
          if (isDrawingD) { ctx.stroke(); ctx.beginPath(); isDrawingD = false }
          continue
        }

        const yPadding = yRange * 10
        if (point.y < yMin - yPadding || point.y > yMax + yPadding) {
          if (isDrawingD) { ctx.stroke(); ctx.beginPath(); isDrawingD = false }
          continue
        }

        const canvasPoint = transform.toCanvas(point.x, point.y)

        if (!isDrawingD) {
          ctx.moveTo(canvasPoint.x, canvasPoint.y)
          isDrawingD = true
        } else {
          ctx.lineTo(canvasPoint.x, canvasPoint.y)
        }
      }

      if (isDrawingD) ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }

    // Draw expression labels in corner
    let labelY = 20
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    for (const expr of expressions) {
      if (expr.expression.visualizationType !== 'function-2d') continue

      ctx.fillStyle = expr.expression.color
      ctx.font = 'bold 12px Inter, system-ui, sans-serif'
      ctx.fillText(`● ${expr.expression.input}`, 10, labelY)
      labelY += 18

      if (expr.derivativePoints) {
        ctx.font = '11px Inter, system-ui, sans-serif'
        ctx.globalAlpha = 0.7
        ctx.fillText(`  ⤷ f'(x) derivative`, 10, labelY)
        ctx.globalAlpha = 1
        labelY += 16
      }
    }
  }, [expressions])

  return (
    <VisualizationCanvas className={className}>
      {renderFunctions}
    </VisualizationCanvas>
  )
}
