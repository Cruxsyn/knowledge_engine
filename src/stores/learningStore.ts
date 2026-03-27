import { create } from 'zustand'

interface LearningState {
  // Current navigation
  currentPathId: string | null
  setCurrentPathId: (id: string | null) => void

  currentLessonId: string | null
  setCurrentLessonId: (id: string | null) => void

  // Map panel state
  mapOpen: boolean
  toggleMap: () => void

  // Reading progress for current lesson (scroll %)
  scrollProgress: number
  setScrollProgress: (progress: number) => void
}

export const useLearningStore = create<LearningState>((set) => ({
  currentPathId: null,
  setCurrentPathId: (id) => set({ currentPathId: id }),

  currentLessonId: null,
  setCurrentLessonId: (id) => set({ currentLessonId: id }),

  mapOpen: true,
  toggleMap: () => set((state) => ({ mapOpen: !state.mapOpen })),

  scrollProgress: 0,
  setScrollProgress: (progress) => set({ scrollProgress: progress }),
}))
