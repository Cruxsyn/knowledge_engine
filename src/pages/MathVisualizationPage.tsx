import { useMemo, useState, useEffect } from 'react'
import { useMathVisualization } from '@/hooks/useMathVisualization'
import { useAppStore } from '@/stores/appStore'
import { MathInput } from '@/components/math-viz/MathInput'
import { FunctionGraph } from '@/components/math-viz/FunctionGraph'
import { MatrixVisualization } from '@/components/math-viz/MatrixVisualization'
import { VectorVisualization } from '@/components/math-viz/VectorVisualization'
import { GeometryVisualization } from '@/components/math-viz/GeometryVisualization'
import { VisualizationToolbar } from '@/components/math-viz/VisualizationToolbar'
import { ExpressionHistory } from '@/components/math-viz/ExpressionHistory'
import { EquationGroups } from '@/components/math-viz/EquationGroups'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Calculator, LineChart, Grid3X3, ArrowRight, Hexagon, History, FolderOpen } from 'lucide-react'

type ViewMode = 'auto' | 'function' | 'matrix' | 'vector' | 'geometry'
type LeftPanel = 'history' | 'groups'

export function MathVisualizationPage() {
  const {
    currentInput,
    setCurrentInput,
    submitExpression,
    expressions,
    activeExpressions,
    removeExpression,
    clearHistory,
    toggleActiveExpression,
    activeExpressionIds,
    graphBounds,
    resetBounds,
    zoom,
    zoomIn,
    zoomOut,
    showGrid,
    toggleGrid,
    showAxes,
    toggleAxes,
    mouseCoords,
    derivativeExpressionIds,
    toggleDerivative,
  } = useMathVisualization()

  const { prefillMathInput, setPrefillMathInput } = useAppStore()

  const [viewMode, setViewMode] = useState<ViewMode>('auto')
  const [parseError, setParseError] = useState<string | undefined>()
  const [leftPanel, setLeftPanel] = useState<LeftPanel>('history')

  // Consume prefill from other features
  useEffect(() => {
    if (prefillMathInput) {
      setCurrentInput(prefillMathInput)
      setPrefillMathInput('')
    }
  }, [prefillMathInput, setCurrentInput, setPrefillMathInput])

  // Determine which visualization to show
  const activeVizType = useMemo(() => {
    if (viewMode !== 'auto') {
      return viewMode === 'function' ? 'function-2d' : viewMode
    }

    // Auto-detect based on active expressions
    const types = activeExpressions.map((e) => e.expression.visualizationType)

    if (types.includes('function-2d')) return 'function-2d'
    if (types.includes('matrix')) return 'matrix'
    if (types.includes('vector')) return 'vector'
    if (types.includes('geometry')) return 'geometry'

    // Default to function graph if nothing active
    return 'function-2d'
  }, [viewMode, activeExpressions])

  // Filter expressions by current view
  const visibleExpressions = useMemo(() => {
    if (viewMode === 'auto') return activeExpressions

    const typeMap: Record<ViewMode, string> = {
      auto: '',
      function: 'function-2d',
      matrix: 'matrix',
      vector: 'vector',
      geometry: 'geometry',
    }

    const targetType = typeMap[viewMode]
    return activeExpressions.filter((e) => e.expression.visualizationType === targetType)
  }, [viewMode, activeExpressions])

  // Handle expression submission
  const handleSubmit = () => {
    setParseError(undefined)
    const success = submitExpression()
    if (!success && currentInput.trim()) {
      setParseError('Could not parse expression. Check syntax and try again.')
    }
    return success
  }

  // Count expressions by type
  const typeCounts = useMemo(() => {
    const counts = { function: 0, matrix: 0, vector: 0, geometry: 0 }
    for (const expr of expressions) {
      if (expr.visualizationType === 'function-2d') counts.function++
      else if (expr.visualizationType === 'matrix') counts.matrix++
      else if (expr.visualizationType === 'vector') counts.vector++
      else if (expr.visualizationType === 'geometry') counts.geometry++
    }
    return counts
  }, [expressions])

  return (
    <div className="h-full flex flex-col bg-deep-obsidian">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-ash-stone/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-serif text-parchment flex items-center gap-2">
              <Calculator className="h-6 w-6 text-icon-gold" />
              Math Visualization
            </h1>
            <p className="text-sm text-warm-gray mt-1">
              Plot functions, visualize matrices, and explore vectors in real-time
            </p>
          </div>
        </div>

        {/* Input */}
        <MathInput
          value={currentInput}
          onChange={setCurrentInput}
          onSubmit={handleSubmit}
          error={parseError}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - History / Groups */}
        <div className="w-64 flex-shrink-0 border-r border-ash-stone/50 bg-charcoal-slate flex flex-col">
          {/* Panel tabs */}
          <div className="flex border-b border-ash-stone/50">
            <button
              onClick={() => setLeftPanel('history')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                leftPanel === 'history'
                  ? 'text-parchment border-b-2 border-icon-gold'
                  : 'text-warm-gray hover:text-parchment'
              )}
            >
              <History className="h-3 w-3" />
              History
            </button>
            <button
              onClick={() => setLeftPanel('groups')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                leftPanel === 'groups'
                  ? 'text-parchment border-b-2 border-icon-gold'
                  : 'text-warm-gray hover:text-parchment'
              )}
            >
              <FolderOpen className="h-3 w-3" />
              Groups
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {leftPanel === 'history' ? (
              <ExpressionHistory
                expressions={expressions}
                activeIds={activeExpressionIds}
                derivativeIds={derivativeExpressionIds}
                onToggle={toggleActiveExpression}
                onRemove={removeExpression}
                onClear={clearHistory}
                onSelect={setCurrentInput}
                onToggleDerivative={toggleDerivative}
              />
            ) : (
              <EquationGroups />
            )}
          </div>
        </div>

        {/* Right panel - Visualization */}
        <div className="flex-1 flex flex-col">
          {/* View mode tabs */}
          <div className="flex-shrink-0 p-3 border-b border-ash-stone/50 bg-charcoal-slate/50">
            <div className="flex items-center justify-between">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList>
                  <TabsTrigger value="auto">
                    Auto
                  </TabsTrigger>
                  <TabsTrigger value="function" className="gap-1">
                    <LineChart className="h-3 w-3" />
                    Functions
                    {typeCounts.function > 0 && (
                      <span className="text-xs opacity-60">({typeCounts.function})</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="matrix" className="gap-1">
                    <Grid3X3 className="h-3 w-3" />
                    Matrices
                    {typeCounts.matrix > 0 && (
                      <span className="text-xs opacity-60">({typeCounts.matrix})</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="vector" className="gap-1">
                    <ArrowRight className="h-3 w-3" />
                    Vectors
                    {typeCounts.vector > 0 && (
                      <span className="text-xs opacity-60">({typeCounts.vector})</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="geometry" className="gap-1">
                    <Hexagon className="h-3 w-3" />
                    Geometry
                    {typeCounts.geometry > 0 && (
                      <span className="text-xs opacity-60">({typeCounts.geometry})</span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Toolbar */}
              <VisualizationToolbar
                zoom={zoom}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onReset={resetBounds}
                showGrid={showGrid}
                onToggleGrid={toggleGrid}
                showAxes={showAxes}
                onToggleAxes={toggleAxes}
                mouseCoords={mouseCoords}
              />
            </div>
          </div>

          {/* Visualization area */}
          <div className="flex-1 relative">
            {activeExpressions.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Card className="p-8 bg-charcoal-slate/50 border-ash-stone/50 max-w-md text-center">
                  <Calculator className="h-12 w-12 text-warm-gray mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-parchment mb-2">
                    Ready to Visualize
                  </h3>
                  <p className="text-sm text-warm-gray mb-4">
                    Enter a mathematical expression above to see it come to life.
                  </p>
                  <div className="text-xs text-warm-gray space-y-1">
                    <p>Try: <code className="bg-ash-stone/30 px-1 rounded">y = sin(x)</code></p>
                    <p>Or: <code className="bg-ash-stone/30 px-1 rounded">sigmoid</code>, <code className="bg-ash-stone/30 px-1 rounded">relu</code></p>
                    <p>Or: <code className="bg-ash-stone/30 px-1 rounded">[[1,2],[3,4]]</code></p>
                  </div>
                  <p className="text-[10px] text-warm-gray/60 mt-3">
                    Switch to <strong>Groups</strong> tab for DL presets
                  </p>
                </Card>
              </div>
            ) : (
              <>
                {/* Function graph view */}
                {activeVizType === 'function-2d' && (
                  <FunctionGraph
                    expressions={visibleExpressions}
                    className="w-full h-full"
                  />
                )}

                {/* Matrix view */}
                {activeVizType === 'matrix' && (
                  <MatrixVisualization
                    expressions={visibleExpressions}
                    className="w-full h-full"
                  />
                )}

                {/* Vector view */}
                {activeVizType === 'vector' && (
                  <VectorVisualization
                    expressions={visibleExpressions}
                    className="w-full h-full"
                  />
                )}

                {/* Geometry view */}
                {activeVizType === 'geometry' && (
                  <GeometryVisualization
                    expressions={visibleExpressions}
                    className="w-full h-full"
                  />
                )}
              </>
            )}
          </div>

          {/* Bounds display */}
          <div className="flex-shrink-0 p-2 border-t border-ash-stone/50 bg-charcoal-slate/30 text-xs text-warm-gray flex justify-between">
            <span>
              X: [{graphBounds.xMin.toFixed(1)}, {graphBounds.xMax.toFixed(1)}]
            </span>
            <span>
              Y: [{graphBounds.yMin.toFixed(1)}, {graphBounds.yMax.toFixed(1)}]
            </span>
            <span>
              Scroll to zoom • Drag to pan
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
