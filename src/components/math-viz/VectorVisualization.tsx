import { useMemo } from 'react'
import { VisualizationCanvas, type TransformContext } from './VisualizationCanvas'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { vectorMagnitude, vectorAngle } from '@/lib/math/parser'
import { cn } from '@/lib/utils'
import type { ParsedExpression } from '@/hooks/useMathVisualization'
import { ArrowRight } from 'lucide-react'

interface VectorVisualizationProps {
  expressions: ParsedExpression[]
  className?: string
}

export function VectorVisualization({ expressions, className }: VectorVisualizationProps) {
  // Count expressions marked as vectors (regardless of parsing success)
  const vectorTypeExpressions = useMemo(() =>
    expressions.filter((e) => e.expression.visualizationType === 'vector'),
    [expressions]
  )

  // Filter for successfully parsed vectors
  const vectorExpressions = useMemo(() =>
    expressions.filter(
      (e) => e.expression.visualizationType === 'vector' && e.vector
    ),
    [expressions]
  )

  // Show empty state if no valid vectors
  if (vectorExpressions.length === 0) {
    const hasUnparsedVectors = vectorTypeExpressions.length > 0
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center text-warm-gray">
          <ArrowRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No vectors to display</p>
          <p className="text-sm mt-2">Enter a vector like &lt;3, 4&gt; or [1, 2]</p>
          {hasUnparsedVectors && (
            <p className="text-xs mt-3 text-oxide-red">
              {vectorTypeExpressions.length} vector expression(s) detected but failed to parse.
              <br />
              Try: &lt;3, 4&gt; or [1, 2]
            </p>
          )}
        </div>
      </div>
    )
  }

  // Create a stable render function that captures current vector data
  const renderVectors = useMemo(() => {
    // Capture the current vector data in closure
    const vectors = vectorExpressions.map(expr => ({
      vector: expr.vector!,
      color: expr.expression.color,
    }))

    return (ctx: CanvasRenderingContext2D, transform: TransformContext) => {
      // Draw all vectors from origin
      for (const { vector, color } of vectors) {
        if (!vector || vector.length < 2) continue

        const [x, y] = vector

        // Get canvas coordinates
        const origin = transform.toCanvas(0, 0)
        const tip = transform.toCanvas(x, y)

        // Draw vector line
        ctx.strokeStyle = color
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'

        ctx.beginPath()
        ctx.moveTo(origin.x, origin.y)
        ctx.lineTo(tip.x, tip.y)
        ctx.stroke()

        // Draw arrowhead
        const angle = Math.atan2(tip.y - origin.y, tip.x - origin.x)
        const arrowLength = 12
        const arrowAngle = Math.PI / 6

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(tip.x, tip.y)
        ctx.lineTo(
          tip.x - arrowLength * Math.cos(angle - arrowAngle),
          tip.y - arrowLength * Math.sin(angle - arrowAngle)
        )
        ctx.lineTo(
          tip.x - arrowLength * Math.cos(angle + arrowAngle),
          tip.y - arrowLength * Math.sin(angle + arrowAngle)
        )
        ctx.closePath()
        ctx.fill()

        // Label at tip
        ctx.fillStyle = color
        ctx.font = 'bold 11px Inter, system-ui, sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'bottom'
        ctx.fillText(`(${x}, ${y})`, tip.x + 8, tip.y - 4)
      }

      // Draw resultant if multiple vectors
      if (vectors.length > 1) {
        let sumX = 0
        let sumY = 0

        for (const { vector } of vectors) {
          if (!vector || vector.length < 2) continue
          sumX += vector[0]
          sumY += vector[1]
        }

        const origin = transform.toCanvas(0, 0)
        const resultTip = transform.toCanvas(sumX, sumY)

        // Draw resultant vector (dashed)
        ctx.strokeStyle = '#C8A24A' // gold
        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])

        ctx.beginPath()
        ctx.moveTo(origin.x, origin.y)
        ctx.lineTo(resultTip.x, resultTip.y)
        ctx.stroke()

        ctx.setLineDash([])

        // Arrowhead for resultant
        const angle = Math.atan2(resultTip.y - origin.y, resultTip.x - origin.x)
        const arrowLength = 10
        const arrowAngle = Math.PI / 6

        ctx.fillStyle = '#C8A24A'
        ctx.beginPath()
        ctx.moveTo(resultTip.x, resultTip.y)
        ctx.lineTo(
          resultTip.x - arrowLength * Math.cos(angle - arrowAngle),
          resultTip.y - arrowLength * Math.sin(angle - arrowAngle)
        )
        ctx.lineTo(
          resultTip.x - arrowLength * Math.cos(angle + arrowAngle),
          resultTip.y - arrowLength * Math.sin(angle + arrowAngle)
        )
        ctx.closePath()
        ctx.fill()

        // Label
        ctx.fillStyle = '#C8A24A'
        ctx.font = 'bold 11px Inter, system-ui, sans-serif'
        ctx.fillText(`Sum: (${sumX.toFixed(2)}, ${sumY.toFixed(2)})`, resultTip.x + 8, resultTip.y - 4)
      }
    }
  }, [vectorExpressions])

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Canvas */}
      <div className="flex-1 relative">
        <VisualizationCanvas className="w-full h-full">
          {renderVectors}
        </VisualizationCanvas>
      </div>

      {/* Vector info panel */}
      {vectorExpressions.length > 0 && (
        <div className="p-4 border-t border-ash-stone/50 bg-charcoal-slate">
          <div className="flex flex-wrap gap-3">
            {vectorExpressions.map((expr) => {
              if (!expr.vector) return null
              const mag = vectorMagnitude(expr.vector)
              const angle = vectorAngle(expr.vector) * (180 / Math.PI)

              return (
                <Card
                  key={expr.expression.id}
                  className="p-3 bg-ash-stone/30 border-ash-stone/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: expr.expression.color }}
                    />
                    <span className="font-mono text-sm text-parchment">
                      {expr.expression.input}
                    </span>
                  </div>
                  <div className="text-xs text-warm-gray space-y-1">
                    <div>
                      Magnitude: <span className="text-parchment">{mag.toFixed(3)}</span>
                    </div>
                    <div>
                      Angle: <span className="text-parchment">{angle.toFixed(1)}°</span>
                    </div>
                    <div>
                      Components: <span className="text-parchment">
                        ({expr.vector.join(', ')})
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}

            {/* Resultant info */}
            {vectorExpressions.length > 1 && (
              <Card className="p-3 bg-icon-gold/10 border-icon-gold/30">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-icon-gold border-icon-gold">
                    Sum
                  </Badge>
                </div>
                {(() => {
                  let sumX = 0
                  let sumY = 0
                  for (const expr of vectorExpressions) {
                    if (expr.vector && expr.vector.length >= 2) {
                      sumX += expr.vector[0]
                      sumY += expr.vector[1]
                    }
                  }
                  const mag = Math.sqrt(sumX * sumX + sumY * sumY)
                  const angle = Math.atan2(sumY, sumX) * (180 / Math.PI)

                  return (
                    <div className="text-xs text-warm-gray space-y-1">
                      <div>
                        Result: <span className="text-parchment">
                          ({sumX.toFixed(2)}, {sumY.toFixed(2)})
                        </span>
                      </div>
                      <div>
                        Magnitude: <span className="text-parchment">{mag.toFixed(3)}</span>
                      </div>
                      <div>
                        Angle: <span className="text-parchment">{angle.toFixed(1)}°</span>
                      </div>
                    </div>
                  )
                })()}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
