import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Notebook, NotebookCell, CellOutput } from '@/types/notebook'

interface NotebookState {
  // Current notebook
  notebook: Notebook | null
  activeCellId: string | null
  executionCounter: number

  // Actions
  createNotebook: (title: string) => Notebook
  loadNotebook: (notebook: Notebook) => void
  setActiveCell: (id: string | null) => void

  // Cell operations
  addCell: (type: NotebookCell['type'], afterId?: string) => string
  removeCell: (id: string) => void
  updateCellContent: (id: string, content: string) => void
  setCellOutput: (id: string, output: CellOutput) => void
  moveCellUp: (id: string) => void
  moveCellDown: (id: string) => void
  clearOutputs: () => void

  // Navigation
  selectNextCell: () => void
  selectPrevCell: () => void
}

export const useNotebookStore = create<NotebookState>((set, get) => ({
  notebook: null,
  activeCellId: null,
  executionCounter: 0,

  createNotebook: (title: string) => {
    const notebook: Notebook = {
      id: nanoid(),
      title,
      cells: [
        { id: nanoid(), type: 'markdown', content: `# ${title}\n\n` },
        { id: nanoid(), type: 'math', content: '' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    set({ notebook, activeCellId: notebook.cells[0].id })
    return notebook
  },

  loadNotebook: (notebook) => {
    set({ notebook, activeCellId: notebook.cells[0]?.id ?? null, executionCounter: 0 })
  },

  setActiveCell: (id) => set({ activeCellId: id }),

  addCell: (type, afterId) => {
    const { notebook } = get()
    if (!notebook) return ''

    const newCell: NotebookCell = { id: nanoid(), type, content: '' }
    const cells = [...notebook.cells]

    if (afterId) {
      const idx = cells.findIndex(c => c.id === afterId)
      cells.splice(idx + 1, 0, newCell)
    } else {
      cells.push(newCell)
    }

    set({
      notebook: { ...notebook, cells, updated_at: new Date().toISOString() },
      activeCellId: newCell.id,
    })
    return newCell.id
  },

  removeCell: (id) => {
    const { notebook, activeCellId } = get()
    if (!notebook || notebook.cells.length <= 1) return

    const idx = notebook.cells.findIndex(c => c.id === id)
    const cells = notebook.cells.filter(c => c.id !== id)
    const newActive = activeCellId === id
      ? cells[Math.min(idx, cells.length - 1)]?.id ?? null
      : activeCellId

    set({
      notebook: { ...notebook, cells, updated_at: new Date().toISOString() },
      activeCellId: newActive,
    })
  },

  updateCellContent: (id, content) => {
    const { notebook } = get()
    if (!notebook) return

    set({
      notebook: {
        ...notebook,
        cells: notebook.cells.map(c => c.id === id ? { ...c, content } : c),
        updated_at: new Date().toISOString(),
      },
    })
  },

  setCellOutput: (id, output) => {
    const { notebook, executionCounter } = get()
    if (!notebook) return

    set({
      notebook: {
        ...notebook,
        cells: notebook.cells.map(c =>
          c.id === id ? { ...c, output, executionOrder: executionCounter + 1 } : c
        ),
      },
      executionCounter: executionCounter + 1,
    })
  },

  moveCellUp: (id) => {
    const { notebook } = get()
    if (!notebook) return
    const idx = notebook.cells.findIndex(c => c.id === id)
    if (idx <= 0) return
    const cells = [...notebook.cells]
    ;[cells[idx - 1], cells[idx]] = [cells[idx], cells[idx - 1]]
    set({ notebook: { ...notebook, cells } })
  },

  moveCellDown: (id) => {
    const { notebook } = get()
    if (!notebook) return
    const idx = notebook.cells.findIndex(c => c.id === id)
    if (idx < 0 || idx >= notebook.cells.length - 1) return
    const cells = [...notebook.cells]
    ;[cells[idx], cells[idx + 1]] = [cells[idx + 1], cells[idx]]
    set({ notebook: { ...notebook, cells } })
  },

  clearOutputs: () => {
    const { notebook } = get()
    if (!notebook) return
    set({
      notebook: {
        ...notebook,
        cells: notebook.cells.map(c => ({ ...c, output: undefined, executionOrder: undefined })),
      },
      executionCounter: 0,
    })
  },

  selectNextCell: () => {
    const { notebook, activeCellId } = get()
    if (!notebook) return
    const idx = notebook.cells.findIndex(c => c.id === activeCellId)
    if (idx < notebook.cells.length - 1) {
      set({ activeCellId: notebook.cells[idx + 1].id })
    }
  },

  selectPrevCell: () => {
    const { notebook, activeCellId } = get()
    if (!notebook) return
    const idx = notebook.cells.findIndex(c => c.id === activeCellId)
    if (idx > 0) {
      set({ activeCellId: notebook.cells[idx - 1].id })
    }
  },
}))
