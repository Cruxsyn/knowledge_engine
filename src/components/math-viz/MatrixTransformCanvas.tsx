import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { VisualizationCanvas, type TransformContext } from './VisualizationCanvas'
import { Button } from '@/components/ui/button'
import { matrixEigenvectors } from '@/lib/math/parser'
import { useMathVizStore } from '@/stores/mathVizStore'
import { Play, RotateCcw, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MatrixTransformCanvasProps {
  matrix: number[][]
  color?: string
  className?: string
}

// Unit square corners
const UNIT_SQUARE = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
]

// Basis vectors
const BASIS_E1 = [1, 0]
const BASIS_E2 = [0, 1]

export function MatrixTransformCanvas({ matrix, color = '#4A9E8F', className }: MatrixTransformCanvasProps) {
  const { matrixAnimating, setMatrixAnimating } = useMathVizStore()
  const [animationProgress, setAnimationProgress] = useState(1) // 0 = original, 1 = transformed
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  // Transform a point by the matrix
  const transformPoint = useCallback((point: number[], progress: number): number[] => {
    const [x, y] = point
    // Interpolate between identity transform and matrix transform
    const a = 1 + (matrix[0][0] - 1) * progress
    const b = matrix[0][1] * progress
    const c = matrix[1][0] * progress
    const d = 1 + (matrix[1][1] - 1) * progress

    return [
      a * x + b * y,
      c * x + d * y,
    ]
  }, [matrix])

  // Get eigenvector data
  const eigenData = useMemo(() => matrixEigenvectors(matrix), [matrix])

  // Animation loop
  useEffect(() => {
    if (!matrixAnimating) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    const ANIMATION_DURATION = 1500 // ms
    startTimeRef.current = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1)

      // Ease-in-out cubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2

      setAnimationProgress(eased)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setMatrixAnimating(false)
        animationRef.current = null
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [matrixAnimating, setMatrixAnimating])

  // Handle play button
  const handlePlay = () => {
    if (matrixAnimating) {
      // Pause
      setMatrixAnimating(false)
    } else {
      // Start from beginning
      setAnimationProgress(0)
      setMatrixAnimating(true)
    }
  }

  // Handle reset
  const handleReset = () => {
    setMatrixAnimating(false)
    setAnimationProgress(0)
  }

  // Show transformed state
  const handleShowTransformed = () => {
    setMatrixAnimating(false)
    setAnimationProgress(1)
  }

  // Draw arrow helper
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromCanvas: { x: number; y: number },
    toCanvas: { x: number; y: number },
    color: string,
    lineWidth: number = 2,
    dashed: boolean = false
  ) => {
    const dx = toCanvas.x - fromCanvas.x
    const dy = toCanvas.y - fromCanvas.y
    const angle = Math.atan2(dy, dx)
    const length = Math.sqrt(dx * dx + dy * dy)

    if (length < 5) return // Skip tiny arrows

    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'

    if (dashed) {
      ctx.setLineDash([6, 4])
    } else {
      ctx.setLineDash([])
    }

    // Draw line
    ctx.beginPath()
    ctx.moveTo(fromCanvas.x, fromCanvas.y)
    ctx.lineTo(toCanvas.x, toCanvas.y)
    ctx.stroke()

    // Draw arrowhead
    const arrowLength = Math.min(12, length * 0.3)
    const arrowAngle = Math.PI / 6

    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(toCanvas.x, toCanvas.y)
    ctx.lineTo(
      toCanvas.x - arrowLength * Math.cos(angle - arrowAngle),
      toCanvas.y - arrowLength * Math.sin(angle - arrowAngle)
    )
    ctx.lineTo(
      toCanvas.x - arrowLength * Math.cos(angle + arrowAngle),
      toCanvas.y - arrowLength * Math.sin(angle + arrowAngle)
    )
    ctx.closePath()
    ctx.fill()
  }

  // Render function
  const renderTransformation = useMemo(() => {
    return (ctx: CanvasRenderingContext2D, transform: TransformContext) => {
      const progress = animationProgress

      // Transform unit square corners
      const transformedSquare = UNIT_SQUARE.map(p => transformPoint(p, progress))

      // Get canvas coordinates for unit square
      const originalCanvas = UNIT_SQUARE.map(([x, y]) => transform.toCanvas(x, y))
      const transformedCanvas = transformedSquare.map(([x, y]) => transform.toCanvas(x, y))

      // Draw original unit square (dashed, gray)
      ctx.strokeStyle = '#666666'
      ctx.lineWidth = 1.5
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      originalCanvas.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      })
      ctx.closePath()
      ctx.stroke()
      ctx.setLineDash([])

      // Fill transformed parallelogram (semi-transparent)
      ctx.fillStyle = color + '30' // Add alpha
      ctx.beginPath()
      transformedCanvas.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      })
      ctx.closePath()
      ctx.fill()

      // Stroke transformed parallelogram
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      transformedCanvas.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      })
      ctx.closePath()
      ctx.stroke()

      // Origin
      const origin = transform.toCanvas(0, 0)

      // Draw original basis vectors (dashed, gray)
      const e1Original = transform.toCanvas(BASIS_E1[0], BASIS_E1[1])
      const e2Original = transform.toCanvas(BASIS_E2[0], BASIS_E2[1])

      drawArrow(ctx, origin, e1Original, '#888888', 1.5, true)
      drawArrow(ctx, origin, e2Original, '#888888', 1.5, true)

      // Draw transformed basis vectors
      const e1Transformed = transformPoint(BASIS_E1, progress)
      const e2Transformed = transformPoint(BASIS_E2, progress)
      const e1TransCanvas = transform.toCanvas(e1Transformed[0], e1Transformed[1])
      const e2TransCanvas = transform.toCanvas(e2Transformed[0], e2Transformed[1])

      drawArrow(ctx, origin, e1TransCanvas, '#E85D5D', 2.5) // Red for e₁
      drawArrow(ctx, origin, e2TransCanvas, '#5D9EE8', 2.5) // Blue for e₂

      // Draw eigenvectors if eigenvalues are real and we're showing transformed state
      if (eigenData?.allReal && progress > 0.5) {
        const eigAlpha = Math.min(1, (progress - 0.5) * 2)

        eigenData.vectors.forEach((vec, i) => {
          // Scale eigenvector for visibility (show in both directions)
          const scale = 2
          const ev1 = transform.toCanvas(vec[0] * scale, vec[1] * scale)
          const ev2 = transform.toCanvas(-vec[0] * scale, -vec[1] * scale)

          ctx.strokeStyle = `rgba(200, 162, 74, ${eigAlpha})` // Gold
          ctx.lineWidth = 1.5
          ctx.setLineDash([4, 4])
          ctx.beginPath()
          ctx.moveTo(ev2.x, ev2.y)
          ctx.lineTo(ev1.x, ev1.y)
          ctx.stroke()
          ctx.setLineDash([])

          // Label eigenvalue
          ctx.fillStyle = `rgba(200, 162, 74, ${eigAlpha})`
          ctx.font = 'bold 11px Inter, system-ui, sans-serif'
          ctx.textAlign = 'left'
          ctx.fillText(`λ${i + 1}=${eigenData.values[i].toFixed(2)}`, ev1.x + 5, ev1.y - 5)
        })
      }

      // Labels for basis vectors
      ctx.font = 'bold 12px Inter, system-ui, sans-serif'
      ctx.textBaseline = 'middle'

      // e₁ label (transformed position)
      ctx.fillStyle = '#E85D5D'
      ctx.textAlign = 'left'
      ctx.fillText('e₁\'', e1TransCanvas.x + 8, e1TransCanvas.y)

      // e₂ label (transformed position)
      ctx.fillStyle = '#5D9EE8'
      ctx.textAlign = 'center'
      ctx.fillText('e₂\'', e2TransCanvas.x, e2TransCanvas.y - 12)

      // Origin label
      ctx.fillStyle = '#888888'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'top'
      ctx.fillText('O', origin.x - 5, origin.y + 5)

      // Draw legend
      const legendX = 15
      let legendY = 20

      ctx.font = '11px Inter, system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'

      // Original square
      ctx.strokeStyle = '#666666'
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.rect(legendX, legendY - 5, 20, 10)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#888888'
      ctx.fillText('Unit square', legendX + 28, legendY)
      legendY += 18

      // Transformed
      ctx.fillStyle = color + '30'
      ctx.fillRect(legendX, legendY - 5, 20, 10)
      ctx.strokeStyle = color
      ctx.strokeRect(legendX, legendY - 5, 20, 10)
      ctx.fillStyle = color
      ctx.fillText('Transformed', legendX + 28, legendY)
      legendY += 18

      // e₁
      ctx.fillStyle = '#E85D5D'
      ctx.fillText('── e₁\' (column 1)', legendX, legendY)
      legendY += 16

      // e₂
      ctx.fillStyle = '#5D9EE8'
      ctx.fillText('── e₂\' (column 2)', legendX, legendY)
      legendY += 16

      // Eigenvectors
      if (eigenData?.allReal) {
        ctx.fillStyle = '#C8A24A'
        ctx.fillText('- - Eigenvectors', legendX, legendY)
      }

      // Show determinant as area info
      const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]
      ctx.fillStyle = '#888888'
      ctx.font = '11px Inter, system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      ctx.fillText(
        `Area scale: ${Math.abs(det).toFixed(2)}× ${det < 0 ? '(flipped)' : ''}`,
        transform.width - 10,
        transform.height - 10
      )
    }
  }, [animationProgress, matrix, color, eigenData, transformPoint])

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Canvas */}
      <div className="flex-1 relative min-h-[300px]">
        <VisualizationCanvas className="w-full h-full">
          {renderTransformation}
        </VisualizationCanvas>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 p-3 border-t border-ash-stone/30">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePlay}
          className="gap-1"
        >
          {matrixAnimating ? (
            <>
              <Pause className="h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Animate
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="gap-1"
        >
          <RotateCcw className="h-4 w-4" />
          Original
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleShowTransformed}
        >
          Transformed
        </Button>

        <div className="ml-auto text-xs text-warm-gray">
          {animationProgress < 0.01 ? 'Original' :
           animationProgress > 0.99 ? 'Transformed' :
           `${Math.round(animationProgress * 100)}%`}
        </div>
      </div>
    </div>
  )
}
