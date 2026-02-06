import { useMemo, useCallback } from 'react'
import { useMathVizStore, GRAPH_COLORS, type MathExpression } from '@/stores/mathVizStore'
import { parseExpression, sampleFunction, parseMatrix, parseVector, computeDerivative, type ParseResult } from '@/lib/math/parser'
import { detectVisualizationType } from '@/lib/math/visualizationDetector'
import { generateId } from '@/lib/utils'

export interface ParsedExpression {
  expression: MathExpression
  parseResult: ParseResult
  points?: { x: number; y: number }[]
  derivativePoints?: { x: number; y: number }[]
  matrix?: number[][]
  vector?: number[]
}

export function useMathVisualization() {
  const {
    currentInput,
    setCurrentInput,
    expressions,
    addExpression,
    removeExpression,
    clearHistory,
    activeExpressionIds,
    toggleActiveExpression,
    graphBounds,
    setGraphBounds,
    resetBounds,
    zoom,
    setZoom,
    showGrid,
    toggleGrid,
    showAxes,
    toggleAxes,
    mouseCoords,
    setMouseCoords,
    derivativeExpressionIds,
    toggleDerivative,
  } = useMathVizStore()

  // Parse the current input and detect visualization type
  const currentParsed = useMemo(() => {
    if (!currentInput.trim()) return null

    const vizType = detectVisualizationType(currentInput)
    const parseResult = parseExpression(currentInput)

    return {
      input: currentInput,
      visualizationType: vizType,
      parseResult,
    }
  }, [currentInput])

  // Get active expressions with their parsed data and sample points
  // NOTE: We use a fixed sample range (-100 to 100) to avoid recomputing on every pan/zoom
  // This makes panning smooth. Points outside the view are simply not rendered.
  const activeExpressions = useMemo((): ParsedExpression[] => {
    return expressions
      .filter((expr) => activeExpressionIds.includes(expr.id))
      .map((expr) => {
        const parseResult = parseExpression(expr.input)

        let points: { x: number; y: number }[] | undefined
        let matrix: number[][] | undefined
        let vector: number[] | undefined

        let derivativePoints: { x: number; y: number }[] | undefined

        // Generate visualization data based on type
        if (expr.visualizationType === 'function-2d' && parseResult.success && parseResult.expression) {
          const sampleMin = -100
          const sampleMax = 100
          const numSamples = 2000
          points = sampleFunction(parseResult.expression, sampleMin, sampleMax, numSamples)

          // Compute derivative if toggled on
          if (derivativeExpressionIds.includes(expr.id)) {
            const deriv = computeDerivative(parseResult.expression)
            if (deriv) {
              derivativePoints = sampleFunction(deriv, sampleMin, sampleMax, numSamples)
            }
          }
        }

        if (expr.visualizationType === 'matrix') {
          const matrixResult = parseMatrix(expr.input)
          if (matrixResult.success) {
            matrix = matrixResult.matrix
          }
        }

        if (expr.visualizationType === 'vector') {
          const vectorResult = parseVector(expr.input)
          if (vectorResult.success) {
            vector = vectorResult.vector
          }
        }

        return {
          expression: expr,
          parseResult,
          points,
          derivativePoints,
          matrix,
          vector,
        }
      })
  }, [expressions, activeExpressionIds, derivativeExpressionIds])

  // Submit current input as a new expression
  const submitExpression = useCallback(() => {
    if (!currentInput.trim()) return false

    const vizType = detectVisualizationType(currentInput)
    const parseResult = parseExpression(currentInput)

    // Only add if parseable (or if it's a matrix/vector which might not need standard parsing)
    if (parseResult.success || vizType === 'matrix' || vizType === 'vector' || vizType === 'geometry') {
      const colorIndex = expressions.length % GRAPH_COLORS.length
      const newExpr: MathExpression = {
        id: generateId(),
        input: currentInput,
        visualizationType: vizType,
        timestamp: new Date(),
        color: GRAPH_COLORS[colorIndex],
      }

      addExpression(newExpr)
      setCurrentInput('')
      return true
    }

    return false
  }, [currentInput, expressions.length, addExpression, setCurrentInput])

  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoom(zoom * 1.2)
  }, [zoom, setZoom])

  const zoomOut = useCallback(() => {
    setZoom(zoom / 1.2)
  }, [zoom, setZoom])

  // Pan controls (adjust bounds)
  const pan = useCallback((dx: number, dy: number) => {
    const range = graphBounds.xMax - graphBounds.xMin
    const xShift = dx * range * 0.1
    const yShift = dy * range * 0.1

    setGraphBounds({
      xMin: graphBounds.xMin - xShift,
      xMax: graphBounds.xMax - xShift,
      yMin: graphBounds.yMin + yShift,
      yMax: graphBounds.yMax + yShift,
    })
  }, [graphBounds, setGraphBounds])

  return {
    // Input
    currentInput,
    setCurrentInput,
    currentParsed,
    submitExpression,

    // Expressions
    expressions,
    activeExpressions,
    removeExpression,
    clearHistory,
    toggleActiveExpression,
    activeExpressionIds,

    // View controls
    graphBounds,
    setGraphBounds,
    resetBounds,
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    pan,

    // Display options
    showGrid,
    toggleGrid,
    showAxes,
    toggleAxes,

    // Mouse position
    mouseCoords,
    setMouseCoords,

    // Derivatives
    derivativeExpressionIds,
    toggleDerivative,
  }
}
