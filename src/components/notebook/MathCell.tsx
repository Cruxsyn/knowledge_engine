import { useState, useCallback } from 'react'
import { useNotebookStore } from '@/stores/notebookStore'
import { FormattedText } from '@/components/ui/formatted-text'
import { isTauri } from '@/db/adapter'
import type { NotebookCell } from '@/types/notebook'
import { Play } from 'lucide-react'

async function evaluateMath(expr: string): Promise<{ result: string; latex: string; steps?: Array<{ rule: string; before_latex: string; after_latex: string }> }> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const result = await invoke<{ value: string; latex?: string; steps?: Array<{ rule: string; before_latex: string; after_latex: string }> }>('math_eval', { expr })
      return { result: result.value, latex: result.latex || result.value, steps: result.steps }
    } catch (err) {
      return { result: String(err), latex: `\\text{Error: ${err}}` }
    }
  }

  // Browser fallback: use mathjs
  try {
    const { evaluate } = await import('mathjs')
    const result = evaluate(expr)
    const str = typeof result === 'object' && result.toString ? result.toString() : String(result)
    return { result: str, latex: `${str}` }
  } catch (err) {
    return { result: String(err), latex: `\\text{Error}` }
  }
}

export function MathCell({ cell }: { cell: NotebookCell; isActive: boolean }) {
  const { updateCellContent, setCellOutput } = useNotebookStore()
  const [running, setRunning] = useState(false)

  const execute = useCallback(async () => {
    if (!cell.content.trim()) return
    setRunning(true)
    try {
      const result = await evaluateMath(cell.content)
      setCellOutput(cell.id, {
        type: result.steps ? 'steps' : 'latex',
        value: result.latex,
        steps: result.steps,
      })
    } catch (err) {
      setCellOutput(cell.id, { type: 'error', value: String(err) })
    } finally {
      setRunning(false)
    }
  }, [cell.content, cell.id, setCellOutput])

  return (
    <div className="space-y-2">
      {/* Input */}
      <div className="flex items-start gap-2">
        <button
          onClick={execute}
          disabled={running}
          className="mt-1 p-1 text-warm-gray hover:text-icon-gold transition-colors disabled:opacity-50"
          title="Execute (Shift+Enter)"
        >
          <Play className="h-4 w-4" />
        </button>
        <textarea
          className="flex-1 bg-obsidian/50 text-parchment font-mono text-sm p-2 rounded border border-ash-stone/30 focus:border-icon-gold/50 outline-none resize-none min-h-[40px]"
          value={cell.content}
          onChange={e => updateCellContent(cell.id, e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && e.shiftKey) {
              e.preventDefault()
              execute()
            }
          }}
          placeholder="Enter expression... (e.g., diff(x^3, x) or [[1,2],[3,4]] * [5,6])"
          spellCheck={false}
        />
      </div>

      {/* Output */}
      {cell.output && (
        <div className={`ml-8 p-3 rounded text-sm ${
          cell.output.type === 'error'
            ? 'bg-oxide-red/10 text-oxide-red border border-oxide-red/20'
            : 'bg-obsidian/30 border border-ash-stone/20'
        }`}>
          {cell.output.type === 'steps' && cell.output.steps ? (
            <div className="space-y-2">
              {cell.output.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-warm-gray/60 text-xs font-mono shrink-0 mt-1">{step.rule}</span>
                  <FormattedText>{`$$${step.after_latex}$$`}</FormattedText>
                </div>
              ))}
            </div>
          ) : cell.output.type === 'latex' ? (
            <FormattedText>{`$$${cell.output.value}$$`}</FormattedText>
          ) : (
            <pre className="font-mono whitespace-pre-wrap">{cell.output.value}</pre>
          )}
        </div>
      )}
    </div>
  )
}
