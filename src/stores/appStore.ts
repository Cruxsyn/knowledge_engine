import { create } from 'zustand'
import type { Capture, AtomicNote, Concept, CaptureStatus, MasteryLevel } from '@/types'

interface AppState {
  // Database status
  isDbReady: boolean
  setDbReady: (ready: boolean) => void
  
  // UI state
  sidebarOpen: boolean
  toggleSidebar: () => void
  
  // Quick capture modal
  quickCaptureOpen: boolean
  setQuickCaptureOpen: (open: boolean) => void
  
  // Global search
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  
  // Current view filters
  captureStatusFilter: CaptureStatus | 'all'
  setCaptureStatusFilter: (status: CaptureStatus | 'all') => void
  
  masteryFilter: MasteryLevel | 'all'
  setMasteryFilter: (mastery: MasteryLevel | 'all') => void
  
  // Selected items for detail views
  selectedCapture: Capture | null
  setSelectedCapture: (capture: Capture | null) => void
  
  selectedNote: AtomicNote | null
  setSelectedNote: (note: AtomicNote | null) => void
  
  selectedConcept: Concept | null
  setSelectedConcept: (concept: Concept | null) => void
  
  // Cross-feature prefill
  prefillContent: string
  setPrefillContent: (content: string) => void
  prefillMathInput: string
  setPrefillMathInput: (input: string) => void

  // Note editor type hint (for keyboard shortcuts)
  noteEditorTypeHint: string | null
  setNoteEditorTypeHint: (type: string | null) => void

  // Refresh triggers
  refreshTrigger: number
  triggerRefresh: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // Database status
  isDbReady: false,
  setDbReady: (ready) => set({ isDbReady: ready }),
  
  // UI state
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  // Quick capture modal
  quickCaptureOpen: false,
  setQuickCaptureOpen: (open) => set({ quickCaptureOpen: open }),
  
  // Global search
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  // Current view filters
  captureStatusFilter: 'all',
  setCaptureStatusFilter: (status) => set({ captureStatusFilter: status }),
  
  masteryFilter: 'all',
  setMasteryFilter: (mastery) => set({ masteryFilter: mastery }),
  
  // Selected items
  selectedCapture: null,
  setSelectedCapture: (capture) => set({ selectedCapture: capture }),
  
  selectedNote: null,
  setSelectedNote: (note) => set({ selectedNote: note }),
  
  selectedConcept: null,
  setSelectedConcept: (concept) => set({ selectedConcept: concept }),
  
  // Cross-feature prefill
  prefillContent: '',
  setPrefillContent: (content) => set({ prefillContent: content }),
  prefillMathInput: '',
  setPrefillMathInput: (input) => set({ prefillMathInput: input }),

  // Note editor type hint
  noteEditorTypeHint: null,
  setNoteEditorTypeHint: (type) => set({ noteEditorTypeHint: type }),

  // Refresh triggers
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}))
