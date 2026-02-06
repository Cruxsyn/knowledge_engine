import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid3X3,
  Axis3D,
  Move,
} from 'lucide-react'

interface VisualizationToolbarProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  showGrid: boolean
  onToggleGrid: () => void
  showAxes: boolean
  onToggleAxes: () => void
  mouseCoords: { x: number; y: number } | null
  className?: string
}

export function VisualizationToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  showGrid,
  onToggleGrid,
  showAxes,
  onToggleAxes,
  mouseCoords,
  className,
}: VisualizationToolbarProps) {
  return (
    <TooltipProvider>
      <div className={cn(
        "flex items-center gap-2 p-2 bg-charcoal-slate/80 backdrop-blur-sm rounded-lg border border-ash-stone/50",
        className
      )}>
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onZoomIn} className="h-8 w-8">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>

          <span className="text-xs text-warm-gray w-12 text-center font-mono">
            {Math.round(zoom * 100)}%
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onZoomOut} className="h-8 w-8">
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-6 bg-ash-stone/50" />

        {/* Reset */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onReset} className="h-8 w-8">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset View</TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-ash-stone/50" />

        {/* Display toggles */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleGrid}
              className={cn("h-8 w-8", showGrid && "bg-ash-stone/50")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{showGrid ? 'Hide Grid' : 'Show Grid'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleAxes}
              className={cn("h-8 w-8", showAxes && "bg-ash-stone/50")}
            >
              <Axis3D className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{showAxes ? 'Hide Axes' : 'Show Axes'}</TooltipContent>
        </Tooltip>

        {/* Coordinate display */}
        {mouseCoords && (
          <>
            <div className="w-px h-6 bg-ash-stone/50" />
            <div className="flex items-center gap-1 text-xs font-mono text-warm-gray">
              <Move className="h-3 w-3" />
              <span>x: {mouseCoords.x.toFixed(2)}</span>
              <span>y: {mouseCoords.y.toFixed(2)}</span>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
