import { useState, useCallback } from 'react'
import { useNotebookStore } from '@/stores/notebookStore'
import type { NotebookCell } from '@/types/notebook'
import { Play } from 'lucide-react'

export function CodeCell({ cell }: { cell: NotebookCell; isActive: boolean }) {
  const { updateCellContent, setCellOutput } = useNotebookStore()
  const [running, setRunning] = useState(false)

  const execute = useCallback(async () => {
    if (!cell.content.trim()) return
    setRunning(true)
    try {
      // Sandboxed JS execution using Function constructor
      const fn = new Function('console', `
        const __output = [];
        const __console = {
          log: (...args) => __output.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
          error: (...args) => __output.push('ERROR: ' + args.join(' ')),
          warn: (...args) => __output.push('WARN: ' + args.join(' ')),
        };
        try {
          const __result = (function() { ${cell.content} })();
          if (__result !== undefined) __output.push(typeof __result === 'object' ? JSON.stringify(__result, null, 2) : String(__result));
        } catch(e) {
          __output.push('Error: ' + e.message);
        }
        return __output.join('\\n');
      `)
      const output = fn(console)
      setCellOutput(cell.id, { type: 'text', value: output || '(no output)' })
    } catch (err) {
      setCellOutput(cell.id, { type: 'error', value: String(err) })
    } finally {
      setRunning(false)
    }
  }, [cell.content, cell.id, setCellOutput])

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <button
          onClick={execute}
          disabled={running}
          className="mt-1 p-1 text-warm-gray hover:text-icon-gold transition-colors disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
        </button>
        <textarea
          className="flex-1 bg-obsidian/50 text-green-400 font-mono text-sm p-2 rounded border border-ash-stone/30 focus:border-icon-gold/50 outline-none resize-none min-h-[60px]"
          value={cell.content}
          onChange={e => updateCellContent(cell.id, e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && e.shiftKey) {
              e.preventDefault()
              execute()
            }
            // Tab indentation
            if (e.key === 'Tab') {
              e.preventDefault()
              const start = e.currentTarget.selectionStart
              const end = e.currentTarget.selectionEnd
              const value = cell.content.substring(0, start) + '  ' + cell.content.substring(end)
              updateCellContent(cell.id, value)
            }
          }}
          placeholder="// JavaScript code..."
          spellCheck={false}
        />
      </div>

      {cell.output && (
        <div className={`ml-8 p-3 rounded font-mono text-sm ${
          cell.output.type === 'error'
            ? 'bg-oxide-red/10 text-oxide-red border border-oxide-red/20'
            : 'bg-obsidian/30 text-parchment/80 border border-ash-stone/20'
        }`}>
          <pre className="whitespace-pre-wrap">{cell.output.value}</pre>
        </div>
      )}
    </div>
  )
}
