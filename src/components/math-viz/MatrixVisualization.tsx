import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  matrixDeterminant,
  matrixTranspose,
  matrixInverse,
  matrixMultiply,
  matrixAdd,
  matrixSubtract,
  matrixEigenvalues,
  matrixScalarMultiply,
  matrixTrace,
  matrixRank,
  matrixPower,
  matrixDotProduct,
} from '@/lib/math/parser'
import { MatrixTransformCanvas } from './MatrixTransformCanvas'
import { ArrowRightLeft, RotateCcw, Grid3X3, X, Plus, Minus, Equal, Move, Hash, Layers, PlusCircle } from 'lucide-react'
import type { ParsedExpression } from '@/hooks/useMathVisualization'
import { useMathVizStore, GRAPH_COLORS } from '@/stores/mathVizStore'

interface MatrixVisualizationProps {
  expressions: ParsedExpression[]
  className?: string
}

type TransformType = 'original' | 'transpose' | 'inverse' | 'multiply' | 'add' | 'subtract' | 'eigenvalues' | 'scale' | 'power' | 'dot'

export function MatrixVisualization({ expressions, className }: MatrixVisualizationProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [transformedMatrix, setTransformedMatrix] = useState<number[][] | null>(null)
  const [transformType, setTransformType] = useState<TransformType>('original')
  const [eigenvals, setEigenvals] = useState<number[] | null>(null)
  const [scalarInput, setScalarInput] = useState('2')
  const [powerInput, setPowerInput] = useState('2')
  const [dotProductResult, setDotProductResult] = useState<number | null>(null)

  // Matrix builder state
  const [showBuilder, setShowBuilder] = useState(false)
  const [builderRows, setBuilderRows] = useState(2)
  const [builderCols, setBuilderCols] = useState(2)
  const [builderValues, setBuilderValues] = useState<string[][]>([['1', '0'], ['0', '1']])

  const { addExpression, expressions: storeExpressions } = useMathVizStore()

  // Count expressions marked as matrices (regardless of parsing success)
  const matrixTypeExpressions = useMemo(() =>
    expressions.filter((e) => e.expression.visualizationType === 'matrix'),
    [expressions]
  )

  // Filter for successfully parsed matrices
  const matrixExpressions = useMemo(() =>
    expressions.filter(
      (e) => e.expression.visualizationType === 'matrix' && e.matrix
    ),
    [expressions]
  )

  const selectedExpr = selectedId
    ? matrixExpressions.find((e) => e.expression.id === selectedId)
    : matrixExpressions[0]

  const displayMatrix = transformedMatrix || selectedExpr?.matrix || []
  const originalIsSquare = selectedExpr?.matrix &&
    selectedExpr.matrix.length === selectedExpr.matrix[0]?.length

  const handleTranspose = () => {
    if (!selectedExpr?.matrix) return
    const transposed = matrixTranspose(selectedExpr.matrix)
    setTransformedMatrix(transposed)
    setTransformType('transpose')
    setEigenvals(null)
  }

  const handleInverse = () => {
    if (!selectedExpr?.matrix) return
    const inverted = matrixInverse(selectedExpr.matrix)
    if (inverted) {
      setTransformedMatrix(inverted)
      setTransformType('inverse')
      setEigenvals(null)
    }
  }

  const handleMultiply = (otherId: string) => {
    if (!selectedExpr?.matrix) return
    const other = matrixExpressions.find(e => e.expression.id === otherId)
    if (!other?.matrix) return

    const result = matrixMultiply(selectedExpr.matrix, other.matrix)
    if (result) {
      setTransformedMatrix(result)
      setTransformType('multiply')
      setEigenvals(null)
    }
  }

  const handleAdd = (otherId: string) => {
    if (!selectedExpr?.matrix) return
    const other = matrixExpressions.find(e => e.expression.id === otherId)
    if (!other?.matrix) return

    const result = matrixAdd(selectedExpr.matrix, other.matrix)
    if (result) {
      setTransformedMatrix(result)
      setTransformType('add')
      setEigenvals(null)
    }
  }

  const handleEigenvalues = () => {
    if (!selectedExpr?.matrix || !originalIsSquare) return
    const eigs = matrixEigenvalues(selectedExpr.matrix)
    if (eigs) {
      setEigenvals(eigs)
      setTransformType('eigenvalues')
      setTransformedMatrix(null)
      setDotProductResult(null)
    }
  }

  const handleSubtract = (otherId: string) => {
    if (!selectedExpr?.matrix) return
    const other = matrixExpressions.find(e => e.expression.id === otherId)
    if (!other?.matrix) return

    const result = matrixSubtract(selectedExpr.matrix, other.matrix)
    if (result) {
      setTransformedMatrix(result)
      setTransformType('subtract')
      setEigenvals(null)
      setDotProductResult(null)
    }
  }

  const handleScale = () => {
    if (!selectedExpr?.matrix) return
    const scalar = parseFloat(scalarInput)
    if (isNaN(scalar)) return

    const result = matrixScalarMultiply(selectedExpr.matrix, scalar)
    setTransformedMatrix(result)
    setTransformType('scale')
    setEigenvals(null)
    setDotProductResult(null)
  }

  const handlePower = () => {
    if (!selectedExpr?.matrix || !originalIsSquare) return
    const n = parseInt(powerInput)
    if (isNaN(n) || n < 0) return

    const result = matrixPower(selectedExpr.matrix, n)
    if (result) {
      setTransformedMatrix(result)
      setTransformType('power')
      setEigenvals(null)
      setDotProductResult(null)
    }
  }

  const handleDotProduct = (otherId: string) => {
    if (!selectedExpr?.matrix) return
    const other = matrixExpressions.find(e => e.expression.id === otherId)
    if (!other?.matrix) return

    const result = matrixDotProduct(selectedExpr.matrix, other.matrix)
    if (result !== null) {
      setDotProductResult(result)
      setTransformType('dot')
      setTransformedMatrix(null)
      setEigenvals(null)
    }
  }

  const handleReset = () => {
    setTransformedMatrix(null)
    setTransformType('original')
    setEigenvals(null)
    setDotProductResult(null)
  }

  // Matrix builder functions
  const initBuilderGrid = useCallback((rows: number, cols: number) => {
    const newValues: string[][] = []
    for (let i = 0; i < rows; i++) {
      const row: string[] = []
      for (let j = 0; j < cols; j++) {
        // Preserve existing values if possible
        row.push(builderValues[i]?.[j] ?? (i === j ? '1' : '0'))
      }
      newValues.push(row)
    }
    setBuilderValues(newValues)
  }, [builderValues])

  const handleBuilderRowsChange = (newRows: number) => {
    if (newRows < 1 || newRows > 10) return
    setBuilderRows(newRows)
    initBuilderGrid(newRows, builderCols)
  }

  const handleBuilderColsChange = (newCols: number) => {
    if (newCols < 1 || newCols > 10) return
    setBuilderCols(newCols)
    initBuilderGrid(builderRows, newCols)
  }

  const handleBuilderValueChange = (row: number, col: number, value: string) => {
    const newValues = builderValues.map((r, i) =>
      i === row ? r.map((c, j) => (j === col ? value : c)) : r
    )
    setBuilderValues(newValues)
  }

  const handleBuilderSubmit = () => {
    // Convert string values to numbers
    const matrix: number[][] = builderValues.map(row =>
      row.map(val => {
        const num = parseFloat(val)
        return isNaN(num) ? 0 : num
      })
    )

    // Create matrix string representation
    const matrixStr = '[' + matrix.map(row => '[' + row.join(',') + ']').join(',') + ']'

    // Add as new expression
    const colorIndex = storeExpressions.length % GRAPH_COLORS.length
    addExpression({
      id: crypto.randomUUID(),
      input: matrixStr,
      visualizationType: 'matrix',
      timestamp: new Date(),
      color: GRAPH_COLORS[colorIndex],
    })

    setShowBuilder(false)
  }

  const handleBuilderPreset = (preset: 'identity' | 'zero' | 'random') => {
    const newValues: string[][] = []
    for (let i = 0; i < builderRows; i++) {
      const row: string[] = []
      for (let j = 0; j < builderCols; j++) {
        if (preset === 'identity') {
          row.push(i === j ? '1' : '0')
        } else if (preset === 'zero') {
          row.push('0')
        } else {
          row.push(String(Math.floor(Math.random() * 19) - 9)) // -9 to 9
        }
      }
      newValues.push(row)
    }
    setBuilderValues(newValues)
  }

  const det = selectedExpr?.matrix && originalIsSquare
    ? matrixDeterminant(selectedExpr.matrix)
    : null

  // Check if displayed matrix is 2×2 (for transformation visualization)
  // Use displayMatrix so transformed results can be visualized too
  const displayIs2x2 = displayMatrix.length === 2 && displayMatrix[0]?.length === 2

  // Check if multiplication is possible with another matrix
  const canMultiplyWith = (other: ParsedExpression) => {
    if (!selectedExpr?.matrix || !other.matrix) return false
    // For A×B, columns of A must equal rows of B
    return selectedExpr.matrix[0]?.length === other.matrix.length
  }

  // Check if addition is possible with another matrix
  const canAddWith = (other: ParsedExpression) => {
    if (!selectedExpr?.matrix || !other.matrix) return false
    // Same dimensions required
    return selectedExpr.matrix.length === other.matrix.length &&
           selectedExpr.matrix[0]?.length === other.matrix[0]?.length
  }

  // Calculate trace and rank for display
  const trace = selectedExpr?.matrix && originalIsSquare
    ? matrixTrace(selectedExpr.matrix)
    : null

  const rank = selectedExpr?.matrix
    ? matrixRank(selectedExpr.matrix)
    : null

  const getTransformLabel = () => {
    switch (transformType) {
      case 'transpose': return 'Transposed'
      case 'inverse': return 'Inverse'
      case 'multiply': return 'A × B'
      case 'add': return 'A + B'
      case 'subtract': return 'A - B'
      case 'eigenvalues': return 'Eigenvalues'
      case 'scale': return `${scalarInput} × A`
      case 'power': return `A^${powerInput}`
      case 'dot': return 'Dot Product'
      default: return ''
    }
  }

  // Empty state - no matrices and no builder shown
  const hasUnparsedMatrices = matrixTypeExpressions.length > 0
  if (matrixExpressions.length === 0 && !showBuilder) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center text-warm-gray">
          <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No matrices to display</p>
          <p className="text-sm mt-2">Enter a matrix like [[1,2],[3,4]]</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBuilder(true)}
            className="mt-4 gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            Create Matrix
          </Button>
          {hasUnparsedMatrices && (
            <p className="text-xs mt-3 text-oxide-red">
              {matrixTypeExpressions.length} matrix expression(s) detected but failed to parse.
              <br />
              Try: [[1,2],[3,4]]
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Matrix selector - only show if we have matrices */}
      {matrixExpressions.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center p-4 pb-2">
          <span className="text-sm text-warm-gray mr-2">Select matrix:</span>
          {matrixExpressions.map((expr, idx) => (
            <Button
              key={expr.expression.id}
              variant={selectedExpr?.expression.id === expr.expression.id ? 'gold' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedId(expr.expression.id)
                handleReset()
              }}
            >
              {String.fromCharCode(65 + idx)} {/* A, B, C, ... */}
              <span className="ml-1 text-xs opacity-60">
                {expr.matrix?.length}×{expr.matrix?.[0]?.length}
              </span>
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBuilder(!showBuilder)}
            className="gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            New
          </Button>
        </div>
      )}

      {/* Matrix Builder */}
      {showBuilder && (
        <Card className="mx-4 mb-4 p-4 bg-charcoal-slate border-ash-stone/50">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-parchment">Create Matrix</span>
              <Button variant="ghost" size="sm" onClick={() => setShowBuilder(false)}>
                ✕
              </Button>
            </div>

            {/* Dimension controls */}
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-warm-gray">Rows:</span>
                <Button variant="outline" size="sm" onClick={() => handleBuilderRowsChange(builderRows - 1)} disabled={builderRows <= 1}>-</Button>
                <span className="w-8 text-center font-mono">{builderRows}</span>
                <Button variant="outline" size="sm" onClick={() => handleBuilderRowsChange(builderRows + 1)} disabled={builderRows >= 10}>+</Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-warm-gray">Cols:</span>
                <Button variant="outline" size="sm" onClick={() => handleBuilderColsChange(builderCols - 1)} disabled={builderCols <= 1}>-</Button>
                <span className="w-8 text-center font-mono">{builderCols}</span>
                <Button variant="outline" size="sm" onClick={() => handleBuilderColsChange(builderCols + 1)} disabled={builderCols >= 10}>+</Button>
              </div>
            </div>

            {/* Presets */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBuilderPreset('identity')}>Identity</Button>
              <Button variant="outline" size="sm" onClick={() => handleBuilderPreset('zero')}>Zero</Button>
              <Button variant="outline" size="sm" onClick={() => handleBuilderPreset('random')}>Random</Button>
            </div>

            {/* Matrix grid input */}
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${builderCols}, minmax(3rem, 1fr))`,
                maxWidth: `${builderCols * 4}rem`,
              }}
            >
              {builderValues.map((row, i) =>
                row.map((val, j) => (
                  <Input
                    key={`${i}-${j}`}
                    type="text"
                    value={val}
                    onChange={(e) => handleBuilderValueChange(i, j, e.target.value)}
                    className="h-10 text-center font-mono text-sm px-1"
                  />
                ))
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-2">
              <Button variant="gold" size="sm" onClick={handleBuilderSubmit}>
                <Plus className="h-4 w-4 mr-1" />
                Add Matrix
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowBuilder(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs for Values and Transform (Transform only for 2×2) */}
      <Tabs defaultValue="values" className="flex-1 flex flex-col px-4">
        <TabsList className="grid w-fit grid-cols-2 mb-4">
          <TabsTrigger value="values" className="gap-1">
            <Grid3X3 className="h-4 w-4" />
            Values
          </TabsTrigger>
          {displayIs2x2 && (
            <TabsTrigger value="transform" className="gap-1">
              <Move className="h-4 w-4" />
              Transform
            </TabsTrigger>
          )}
        </TabsList>

        {/* Values Tab */}
        <TabsContent value="values" className="flex-1 overflow-auto space-y-4 mt-0">
          {/* Matrix display */}
          <Card className="p-6 bg-charcoal-slate border-ash-stone/50">
            <div className="flex items-center gap-2 mb-4">
              <Badge
                variant="outline"
                style={{
                  borderColor: selectedExpr?.expression.color,
                  color: selectedExpr?.expression.color,
                }}
              >
                {displayMatrix.length} × {displayMatrix[0]?.length || 0}
              </Badge>
              {transformType !== 'original' && transformType !== 'eigenvalues' && (
                <Badge variant="outline" className="text-icon-gold border-icon-gold">
                  {getTransformLabel()}
                </Badge>
              )}
            </div>

            {/* Show eigenvalues if computed */}
            {transformType === 'eigenvalues' && eigenvals ? (
              <div className="space-y-2">
                <div className="text-sm text-warm-gray mb-2">Eigenvalues:</div>
                <div className="flex flex-wrap gap-2">
                  {eigenvals.map((val, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 bg-ash-stone/30 rounded font-mono text-parchment"
                    >
                      λ{i + 1} = {formatMatrixValue(val)}
                    </div>
                  ))}
                </div>
              </div>
            ) : transformType === 'dot' && dotProductResult !== null ? (
              <div className="space-y-2">
                <div className="text-sm text-warm-gray mb-2">Dot Product (Frobenius inner product):</div>
                <div className="px-4 py-3 bg-ash-stone/30 rounded font-mono text-2xl text-parchment">
                  A · B = {formatMatrixValue(dotProductResult)}
                </div>
              </div>
            ) : (
              /* Matrix grid */
              <div className="flex items-center gap-2">
                {/* Left bracket */}
                <div className="text-4xl text-warm-gray font-light">[</div>

                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${displayMatrix[0]?.length || 1}, minmax(3rem, 1fr))`,
                  }}
                >
                  {displayMatrix.map((row, i) =>
                    row.map((val, j) => (
                      <div
                        key={`${i}-${j}`}
                        className={cn(
                          "px-3 py-2 text-center font-mono text-sm rounded",
                          "bg-ash-stone/30 text-parchment",
                          "hover:bg-ash-stone/50 transition-colors"
                        )}
                      >
                        {formatMatrixValue(val)}
                      </div>
                    ))
                  )}
                </div>

                {/* Right bracket */}
                <div className="text-4xl text-warm-gray font-light">]</div>
              </div>
            )}

            {/* Properties */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {det !== null && transformType === 'original' && (
                <div className="text-warm-gray">
                  Determinant: <span className="text-parchment font-mono">{formatMatrixValue(det)}</span>
                </div>
              )}
              {trace !== null && transformType === 'original' && (
                <div className="text-warm-gray">
                  Trace: <span className="text-parchment font-mono">{formatMatrixValue(trace)}</span>
                </div>
              )}
              {rank !== null && transformType === 'original' && (
                <div className="text-warm-gray">
                  Rank: <span className="text-parchment font-mono">{rank}</span>
                </div>
              )}
              <div className="text-warm-gray">
                Dimensions: <span className="text-parchment">{displayMatrix.length} × {displayMatrix[0]?.length || 0}</span>
              </div>
            </div>
          </Card>

          {/* Single-matrix operations */}
          <div className="space-y-2">
            <div className="text-sm text-warm-gray">Single-matrix operations:</div>
            <div className="flex gap-2 flex-wrap items-center">
              <Button variant="outline" size="sm" onClick={handleTranspose}>
                <ArrowRightLeft className="h-4 w-4 mr-1" />
                Transpose
              </Button>
              {originalIsSquare && det !== 0 && (
                <Button variant="outline" size="sm" onClick={handleInverse}>
                  <Grid3X3 className="h-4 w-4 mr-1" />
                  Inverse
                </Button>
              )}
              {originalIsSquare && (
                <Button variant="outline" size="sm" onClick={handleEigenvalues}>
                  <Equal className="h-4 w-4 mr-1" />
                  Eigenvalues
                </Button>
              )}
              {transformType !== 'original' && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
            </div>

            {/* Scalar multiply */}
            <div className="flex gap-2 items-center mt-2">
              <span className="text-sm text-warm-gray">Scale by:</span>
              <Input
                type="number"
                value={scalarInput}
                onChange={(e) => setScalarInput(e.target.value)}
                className="w-20 h-8 text-sm"
                placeholder="2"
              />
              <Button variant="outline" size="sm" onClick={handleScale}>
                <Hash className="h-4 w-4 mr-1" />
                Scale
              </Button>
            </div>

            {/* Matrix power (only for square matrices) */}
            {originalIsSquare && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-warm-gray">Power:</span>
                <Input
                  type="number"
                  value={powerInput}
                  onChange={(e) => setPowerInput(e.target.value)}
                  className="w-20 h-8 text-sm"
                  placeholder="2"
                  min="0"
                />
                <Button variant="outline" size="sm" onClick={handlePower}>
                  <Layers className="h-4 w-4 mr-1" />
                  A^n
                </Button>
              </div>
            )}
          </div>

          {/* Multi-matrix operations (if multiple matrices) */}
          {matrixExpressions.length > 1 && (
            <div className="space-y-2">
              <div className="text-sm text-warm-gray">Matrix operations with:</div>
              <div className="flex flex-col gap-2">
                {matrixExpressions
                  .filter(e => e.expression.id !== selectedExpr?.expression.id)
                  .map((other) => {
                    const actualIdx = matrixExpressions.findIndex(m => m.expression.id === other.expression.id)
                    const letter = String.fromCharCode(65 + actualIdx)
                    const canMult = canMultiplyWith(other)
                    const canAdd = canAddWith(other)

                    return (
                      <div key={other.expression.id} className="flex gap-1 flex-wrap items-center">
                        <span className="text-sm text-warm-gray mr-1">with {letter}:</span>
                        {canMult && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMultiply(other.expression.id)}
                          >
                            <X className="h-3 w-3 mr-1" />
                            × {letter}
                          </Button>
                        )}
                        {canAdd && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAdd(other.expression.id)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              + {letter}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSubtract(other.expression.id)}
                            >
                              <Minus className="h-3 w-3 mr-1" />
                              - {letter}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDotProduct(other.expression.id)}
                            >
                              <Equal className="h-3 w-3 mr-1" />
                              A · {letter}
                            </Button>
                          </>
                        )}
                        {!canMult && !canAdd && (
                          <span className="text-xs text-warm-gray px-2">
                            dimensions incompatible
                          </span>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-warm-gray pb-4">
            {originalIsSquare ? (
              det === 0 ? (
                <span className="text-oxide-red">Matrix is singular (det = 0), no inverse exists</span>
              ) : (
                'Square matrix - can compute determinant, inverse, and eigenvalues'
              )
            ) : (
              'Non-square matrix - can transpose'
            )}
            {matrixExpressions.length > 1 && (
              <span className="ml-2">• Add more matrices to perform multiplication (A×B) or addition (A+B)</span>
            )}
          </div>
        </TabsContent>

        {/* Transform Tab (only for 2×2 matrices) */}
        {displayIs2x2 && (
          <TabsContent value="transform" className="flex-1 mt-0">
            <div className="h-full flex flex-col">
              {transformType !== 'original' && (
                <div className="px-2 py-1 mb-2 bg-ash-stone/30 rounded text-sm text-warm-gray flex items-center gap-2">
                  <Badge variant="outline" className="text-icon-gold border-icon-gold">
                    {getTransformLabel()}
                  </Badge>
                  <span className="text-xs">Showing transformed matrix</span>
                </div>
              )}
              <MatrixTransformCanvas
                matrix={displayMatrix as number[][]}
                color={selectedExpr?.expression.color || '#4A9E8F'}
                className="flex-1"
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function formatMatrixValue(val: number): string {
  if (Number.isInteger(val)) return val.toString()
  if (Math.abs(val) < 0.0001) return '0'
  return val.toFixed(3).replace(/\.?0+$/, '')
}
