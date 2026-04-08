import { useState } from 'react'
import { useNotebookStore } from '@/stores/notebookStore'
import { FormattedText } from '@/components/ui/formatted-text'
import type { NotebookCell } from '@/types/notebook'

export function MarkdownCell({ cell, isActive }: { cell: NotebookCell; isActive: boolean }) {
  const { updateCellContent } = useNotebookStore()
  const [editing, setEditing] = useState(false)

  if (editing && isActive) {
    return (
      <textarea
        autoFocus
        className="w-full bg-transparent text-parchment font-mono text-sm resize-none outline-none min-h-[100px]"
        value={cell.content}
        onChange={e => updateCellContent(cell.id, e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={e => {
          if (e.key === 'Escape') setEditing(false)
        }}
      />
    )
  }

  return (
    <div
      className="cursor-text min-h-[2em]"
      onDoubleClick={() => setEditing(true)}
    >
      {cell.content.trim() ? (
        <FormattedText>{cell.content}</FormattedText>
      ) : (
        <p className="text-warm-gray/50 italic text-sm">Double-click to edit markdown...</p>
      )}
    </div>
  )
}
