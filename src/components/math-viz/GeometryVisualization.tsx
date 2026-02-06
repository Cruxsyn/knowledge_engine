import { useCallback, useMemo } from 'react'
import { VisualizationCanvas, type TransformContext } from './VisualizationCanvas'
import { cn } from '@/lib/utils'
import type { ParsedExpression } from '@/hooks/useMathVisualization'

interface GeometryVisualizationProps {
  expressions: ParsedExpression[]
  className?: string
}

interface GeometryShape {
  type: 'circle' | 'line' | 'point' | 'rectangle'
  params: number[]
  color: string
  label: string
}

export function GeometryVisualization({ expressions, className }: GeometryVisualizationProps) {
  const geometryExpressions = expressions.filter(
    (e) => e.expression.visualizationType === 'geometry'
  )

  // Parse geometry expressions into shapes
  const shapes = useMemo((): GeometryShape[] => {
    const result: GeometryShape[] = []

    for (const expr of geometryExpressions) {
      const input = expr.expression.input.toLowerCase()
      const color = expr.expression.color

      // Parse circle(x, y, r)
      const circleMatch = input.match(/circle\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/)
      if (circleMatch) {
        const [, cx, cy, r] = circleMatch
        result.push({
          type: 'circle',
          params: [parseFloat(cx), parseFloat(cy), parseFloat(r)],
          color,
          label: expr.expression.input,
        })
        continue
      }

      // Parse line(x1, y1, x2, y2)
      const lineMatch = input.match(/line\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/)
      if (lineMatch) {
        const [, x1, y1, x2, y2] = lineMatch
        result.push({
          type: 'line',
          params: [parseFloat(x1), parseFloat(y1), parseFloat(x2), parseFloat(y2)],
          color,
          label: expr.expression.input,
        })
        continue
      }

      // Parse point(x, y)
      const pointMatch = input.match(/point\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/)
      if (pointMatch) {
        const [, x, y] = pointMatch
        result.push({
          type: 'point',
          params: [parseFloat(x), parseFloat(y)],
          color,
          label: expr.expression.input,
        })
        continue
      }

      // Parse rectangle(x, y, width, height)
      const rectMatch = input.match(/rectangle\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/)
      if (rectMatch) {
        const [, x, y, w, h] = rectMatch
        result.push({
          type: 'rectangle',
          params: [parseFloat(x), parseFloat(y), parseFloat(w), parseFloat(h)],
          color,
          label: expr.expression.input,
        })
        continue
      }
    }

    return result
  }, [geometryExpressions])

  const renderGeometry = useCallback((ctx: CanvasRenderingContext2D, transform: TransformContext) => {
    for (const shape of shapes) {
      ctx.strokeStyle = shape.color
      ctx.fillStyle = shape.color + '30' // Semi-transparent fill
      ctx.lineWidth = 2

      switch (shape.type) {
        case 'circle': {
          const [cx, cy, r] = shape.params
          const center = transform.toCanvas(cx, cy)
          const edge = transform.toCanvas(cx + r, cy)
          const radiusPx = Math.abs(edge.x - center.x)

          ctx.beginPath()
          ctx.arc(center.x, center.y, radiusPx, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()

          // Label
          ctx.fillStyle = shape.color
          ctx.font = '11px Inter, system-ui, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(`r=${r}`, center.x, center.y + radiusPx + 15)

          // Center point
          ctx.beginPath()
          ctx.arc(center.x, center.y, 3, 0, Math.PI * 2)
          ctx.fill()
          break
        }

        case 'line': {
          const [x1, y1, x2, y2] = shape.params
          const p1 = transform.toCanvas(x1, y1)
          const p2 = transform.toCanvas(x2, y2)

          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()

          // Endpoints
          ctx.fillStyle = shape.color
          ctx.beginPath()
          ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(p2.x, p2.y, 4, 0, Math.PI * 2)
          ctx.fill()

          // Labels
          ctx.font = '10px Inter, system-ui, sans-serif'
          ctx.textAlign = 'left'
          ctx.fillText(`(${x1}, ${y1})`, p1.x + 6, p1.y - 6)
          ctx.fillText(`(${x2}, ${y2})`, p2.x + 6, p2.y - 6)

          // Length
          const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
          const midX = (p1.x + p2.x) / 2
          const midY = (p1.y + p2.y) / 2
          ctx.textAlign = 'center'
          ctx.fillText(`L=${length.toFixed(2)}`, midX, midY - 8)
          break
        }

        case 'point': {
          const [x, y] = shape.params
          const p = transform.toCanvas(x, y)

          ctx.fillStyle = shape.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
          ctx.fill()

          // Label
          ctx.font = '11px Inter, system-ui, sans-serif'
          ctx.textAlign = 'left'
          ctx.fillText(`(${x}, ${y})`, p.x + 8, p.y - 4)
          break
        }

        case 'rectangle': {
          const [x, y, w, h] = shape.params
          const topLeft = transform.toCanvas(x, y + h)
          const bottomRight = transform.toCanvas(x + w, y)

          const rectWidth = bottomRight.x - topLeft.x
          const rectHeight = bottomRight.y - topLeft.y

          ctx.fillRect(topLeft.x, topLeft.y, rectWidth, rectHeight)
          ctx.strokeRect(topLeft.x, topLeft.y, rectWidth, rectHeight)

          // Dimensions label
          ctx.fillStyle = shape.color
          ctx.font = '10px Inter, system-ui, sans-serif'
          ctx.textAlign = 'center'
          const centerX = topLeft.x + rectWidth / 2
          const centerY = topLeft.y + rectHeight / 2
          ctx.fillText(`${w} × ${h}`, centerX, centerY)
          break
        }
      }
    }

    // Legend
    let labelY = 20
    ctx.textAlign = 'left'
    for (const shape of shapes) {
      ctx.fillStyle = shape.color
      ctx.font = 'bold 11px Inter, system-ui, sans-serif'
      ctx.fillText(`● ${shape.label}`, 10, labelY)
      labelY += 16
    }
  }, [shapes])

  if (geometryExpressions.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center text-warm-gray">
          <p className="mb-2">No geometry to display</p>
          <p className="text-sm">Try: circle(0, 0, 5), line(0, 0, 3, 4), point(2, 3)</p>
        </div>
      </div>
    )
  }

  return (
    <VisualizationCanvas className={className}>
      {renderGeometry}
    </VisualizationCanvas>
  )
}
