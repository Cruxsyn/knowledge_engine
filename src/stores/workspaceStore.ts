import { create } from 'zustand'

export interface Pane {
  id: string
  path: string
  title: string
}

interface WorkspaceState {
  panes: Pane[]
  activePaneId: string | null
  splitDirection: 'horizontal' | 'vertical'
  splitRatio: number

  addPane: (path: string, title: string) => void
  removePane: (id: string) => void
  setActivePane: (id: string) => void
  setSplitDirection: (dir: 'horizontal' | 'vertical') => void
  setSplitRatio: (ratio: number) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  panes: [],
  activePaneId: null,
  splitDirection: 'horizontal',
  splitRatio: 0.5,

  addPane: (path, title) => {
    const id = crypto.randomUUID()
    set(state => ({
      panes: [...state.panes, { id, path, title }],
      activePaneId: id,
    }))
  },

  removePane: (id) => {
    const { panes, activePaneId } = get()
    const newPanes = panes.filter(p => p.id !== id)
    set({
      panes: newPanes,
      activePaneId: activePaneId === id ? newPanes[0]?.id ?? null : activePaneId,
    })
  },

  setActivePane: (id) => set({ activePaneId: id }),
  setSplitDirection: (dir) => set({ splitDirection: dir }),
  setSplitRatio: (ratio) => set({ splitRatio: Math.max(0.2, Math.min(0.8, ratio)) }),
}))
