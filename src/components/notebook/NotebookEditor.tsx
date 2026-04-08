import { useCallback, useEffect, useRef } from 'react'
import { useNotebookStore } from '@/stores/notebookStore'
import { MarkdownCell } from './MarkdownCell'
import { MathCell } from './MathCell'
import { CodeCell } from './CodeCell'
import { Button } from '@/components/ui/button'
import { Plus, Type, Calculator, Code, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import type { NotebookCell } from '@/types/notebook'

function CellWrapper({ cell, isActive }: { cell: NotebookCell; isActive: boolean }) {
  const { setActiveCell, removeCell, moveCellUp, moveCellDown } = useNotebookStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isActive])

  return (
    <div
      ref={ref}
      className={`group relative border rounded-lg transition-colors ${
        isActive
          ? 'border-icon-gold/50 bg-charcoal-slate/50'
          : 'border-ash-stone/30 hover:border-ash-stone/60'
      }`}
      onClick={() => setActiveCell(cell.id)}
    >
      {/* Cell toolbar */}
      <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
        <button onClick={(e) => { e.stopPropagation(); moveCellUp(cell.id) }} className="p-1 text-warm-gray hover:text-parchment">
          <ChevronUp className="h-3 w-3" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); moveCellDown(cell.id) }} className="p-1 text-warm-gray hover:text-parchment">
          <ChevronDown className="h-3 w-3" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); removeCell(cell.id) }} className="p-1 text-warm-gray hover:text-oxide-red">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Execution order badge */}
      {cell.executionOrder !== undefined && (
        <div className="absolute -left-6 top-2 text-[10px] text-warm-gray/50 font-mono">
          [{cell.executionOrder}]
        </div>
      )}

      {/* Cell type badge */}
      <div className="absolute top-2 right-2 text-[10px] uppercase tracking-wider text-warm-gray/40 font-medium">
        {cell.type}
      </div>

      {/* Cell content */}
      <div className="p-4">
        {cell.type === 'markdown' && <MarkdownCell cell={cell} isActive={isActive} />}
        {cell.type === 'math' && <MathCell cell={cell} isActive={isActive} />}
        {cell.type === 'code' && <CodeCell cell={cell} isActive={isActive} />}
        {cell.type === 'visualization' && <MathCell cell={cell} isActive={isActive} />}
      </div>
    </div>
  )
}

export function NotebookEditor() {
  const { notebook, activeCellId, addCell, selectNextCell, selectPrevCell } = useNotebookStore()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' && e.altKey) {
      e.preventDefault()
      selectNextCell()
    } else if (e.key === 'ArrowUp' && e.altKey) {
      e.preventDefault()
      selectPrevCell()
    } else if (e.key === 'Enter' && e.shiftKey && e.altKey) {
      e.preventDefault()
      addCell('math', activeCellId ?? undefined)
    }
  }, [selectNextCell, selectPrevCell, addCell, activeCellId])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!notebook) return null

  return (
    <div className="max-w-4xl mx-auto space-y-3 pl-12">
      {notebook.cells.map(cell => (
        <CellWrapper
          key={cell.id}
          cell={cell}
          isActive={cell.id === activeCellId}
        />
      ))}

      {/* Add cell buttons */}
      <div className="flex items-center gap-2 py-4 justify-center">
        <Button variant="outline" size="sm" onClick={() => addCell('markdown', activeCellId ?? undefined)}>
          <Type className="h-3 w-3 mr-1" /> Markdown
        </Button>
        <Button variant="outline" size="sm" onClick={() => addCell('math', activeCellId ?? undefined)}>
          <Calculator className="h-3 w-3 mr-1" /> Math
        </Button>
        <Button variant="outline" size="sm" onClick={() => addCell('code', activeCellId ?? undefined)}>
          <Code className="h-3 w-3 mr-1" /> Code
        </Button>
        <Button variant="outline" size="sm" onClick={() => addCell('visualization', activeCellId ?? undefined)}>
          <Plus className="h-3 w-3 mr-1" /> Visualization
        </Button>
      </div>
    </div>
  )
}
