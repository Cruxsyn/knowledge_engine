import { create } from 'zustand'
import type { Concept, AtomicNote, Link } from '@/types'
import type { EncodeResult } from '@/types/share'
import { createShareUrl, estimateEncodedSize } from '@/lib/share/encoder'

interface ShareState {
  // Dialog state
  isOpen: boolean
  setOpen: (open: boolean) => void

  // Selection state
  selectedConceptIds: Set<string>
  selectedNoteIds: Set<string>
  toggleConcept: (id: string) => void
  toggleNote: (id: string) => void
  selectAllConcepts: (ids: string[]) => void
  selectAllNotes: (ids: string[]) => void
  deselectAllConcepts: () => void
  deselectAllNotes: () => void

  // Options
  includeRelationships: boolean
  setIncludeRelationships: (include: boolean) => void

  // Generated share result
  shareResult: EncodeResult | null
  isGenerating: boolean

  // Actions
  generateShare: (
    concepts: Concept[],
    notes: AtomicNote[],
    links: Link[]
  ) => void
  estimateSize: (
    concepts: Concept[],
    notes: AtomicNote[],
    links: Link[]
  ) => number
  reset: () => void
}

export const useShareStore = create<ShareState>((set, get) => ({
  // Dialog state
  isOpen: false,
  setOpen: (open) => {
    if (open) {
      set({ isOpen: true })
    } else {
      // Reset on close
      set({
        isOpen: false,
        selectedConceptIds: new Set(),
        selectedNoteIds: new Set(),
        shareResult: null,
        isGenerating: false
      })
    }
  },

  // Selection state
  selectedConceptIds: new Set(),
  selectedNoteIds: new Set(),

  toggleConcept: (id) => set((state) => {
    const newSet = new Set(state.selectedConceptIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    return { selectedConceptIds: newSet, shareResult: null }
  }),

  toggleNote: (id) => set((state) => {
    const newSet = new Set(state.selectedNoteIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    return { selectedNoteIds: newSet, shareResult: null }
  }),

  selectAllConcepts: (ids) => set({
    selectedConceptIds: new Set(ids),
    shareResult: null
  }),

  selectAllNotes: (ids) => set({
    selectedNoteIds: new Set(ids),
    shareResult: null
  }),

  deselectAllConcepts: () => set({
    selectedConceptIds: new Set(),
    shareResult: null
  }),

  deselectAllNotes: () => set({
    selectedNoteIds: new Set(),
    shareResult: null
  }),

  // Options
  includeRelationships: true,
  setIncludeRelationships: (include) => set({
    includeRelationships: include,
    shareResult: null
  }),

  // Generated share
  shareResult: null,
  isGenerating: false,

  generateShare: (concepts, notes, links) => {
    set({ isGenerating: true })

    const state = get()
    const selectedConcepts = concepts.filter(c =>
      state.selectedConceptIds.has(c.id)
    )
    const selectedNotes = notes.filter(n =>
      state.selectedNoteIds.has(n.id)
    )

    const result = createShareUrl(
      selectedConcepts,
      selectedNotes,
      links,
      state.includeRelationships
    )

    set({
      shareResult: result,
      isGenerating: false
    })
  },

  estimateSize: (concepts, notes, links) => {
    const state = get()
    const selectedConcepts = concepts.filter(c =>
      state.selectedConceptIds.has(c.id)
    )
    const selectedNotes = notes.filter(n =>
      state.selectedNoteIds.has(n.id)
    )

    return estimateEncodedSize(
      selectedConcepts,
      selectedNotes,
      links,
      state.includeRelationships
    )
  },

  reset: () => set({
    selectedConceptIds: new Set(),
    selectedNoteIds: new Set(),
    shareResult: null,
    isGenerating: false,
    includeRelationships: true
  })
}))
