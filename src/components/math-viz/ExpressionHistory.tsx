import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { getVisualizationLabel, getVisualizationColor } from '@/lib/math/visualizationDetector'
import { X, Eye, EyeOff, Trash2, TrendingUp } from 'lucide-react'
import type { MathExpression } from '@/stores/mathVizStore'

interface ExpressionHistoryProps {
  expressions: MathExpression[]
  activeIds: string[]
  derivativeIds?: string[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onClear: () => void
  onSelect: (expression: string) => void
  onToggleDerivative?: (id: string) => void
  className?: string
}

export function ExpressionHistory({
  expressions,
  activeIds,
  derivativeIds = [],
  onToggle,
  onRemove,
  onClear,
  onSelect,
  onToggleDerivative,
  className,
}: ExpressionHistoryProps) {
  if (expressions.length === 0) {
    return (
      <div className={cn("p-4 text-center text-warm-gray text-sm", className)}>
        <p>No expressions yet</p>
        <p className="text-xs mt-1">Enter an equation above to get started</p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center justify-between p-3 border-b border-ash-stone/50">
        <span className="text-sm font-medium text-parchment">History</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 text-xs text-warm-gray hover:text-oxide-red"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Clear All
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {expressions.map((expr) => {
            const isActive = activeIds.includes(expr.id)
            const vizColor = getVisualizationColor(expr.visualizationType)

            return (
              <div
                key={expr.id}
                className={cn(
                  "group flex items-center gap-2 p-2 rounded-md transition-colors",
                  "hover:bg-ash-stone/30",
                  isActive && "bg-ash-stone/20"
                )}
              >
                {/* Color indicator / toggle */}
                <button
                  onClick={() => onToggle(expr.id)}
                  className="flex-shrink-0"
                >
                  {isActive ? (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: expr.color }}
                    />
                  ) : (
                    <div
                      className="w-3 h-3 rounded-full border-2"
                      style={{ borderColor: expr.color }}
                    />
                  )}
                </button>

                {/* Expression text */}
                <button
                  onClick={() => onSelect(expr.input)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-parchment truncate">
                      {expr.input}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1"
                      style={{
                        borderColor: vizColor,
                        color: vizColor,
                      }}
                    >
                      {getVisualizationLabel(expr.visualizationType)}
                    </Badge>
                    <span className="text-[10px] text-warm-gray">
                      {formatTime(expr.timestamp)}
                    </span>
                  </div>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {expr.visualizationType === 'function-2d' && onToggleDerivative && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleDerivative(expr.id)}
                      className="h-6 w-6"
                      title={derivativeIds.includes(expr.id) ? 'Hide derivative' : 'Show derivative'}
                    >
                      <TrendingUp className={cn(
                        "h-3 w-3",
                        derivativeIds.includes(expr.id) ? "text-verdigris" : "text-warm-gray"
                      )} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggle(expr.id)}
                    className="h-6 w-6"
                    title={isActive ? 'Hide' : 'Show'}
                  >
                    {isActive ? (
                      <Eye className="h-3 w-3 text-icon-gold" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-warm-gray" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(expr.id)}
                    className="h-6 w-6 hover:text-oxide-red"
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  return date.toLocaleDateString()
}
