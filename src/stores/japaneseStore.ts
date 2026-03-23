import { create } from 'zustand'
import type { JpItemType, JpReviewSession, JpSrsCard } from '@/types'

interface JapaneseState {
  // Current view/navigation
  activeTab: 'dashboard' | 'review' | 'explore' | 'kanji' | 'vocabulary' | 'grammar' | 'reading' | 'settings'
  setActiveTab: (tab: JapaneseState['activeTab']) => void

  // Review session state
  reviewSession: JpReviewSession | null
  setReviewSession: (session: JpReviewSession | null) => void

  // Card being reviewed - answer state
  showAnswer: boolean
  setShowAnswer: (show: boolean) => void
  answerStartTime: number | null
  setAnswerStartTime: (time: number | null) => void

  // Association web explorer
  selectedNodeId: string | null
  selectedNodeType: JpItemType | null
  setSelectedNode: (id: string | null, type: JpItemType | null) => void
  graphFilter: JpItemType | 'all'
  setGraphFilter: (filter: JpItemType | 'all') => void
  graphDepth: number
  setGraphDepth: (depth: number) => void

  // Kanji browser
  kanjiJlptFilter: number | null
  setKanjiJlptFilter: (level: number | null) => void
  kanjiSearchQuery: string
  setKanjiSearchQuery: (query: string) => void

  // Reading practice
  readingText: string
  setReadingText: (text: string) => void
  showFurigana: boolean
  setShowFurigana: (show: boolean) => void

  // SRS settings (in-memory, synced with db)
  desiredRetention: number
  setDesiredRetention: (r: number) => void
  newCardsPerDay: number
  setNewCardsPerDay: (n: number) => void
}

export const useJapaneseStore = create<JapaneseState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  reviewSession: null,
  setReviewSession: (session) => set({ reviewSession: session }),

  showAnswer: false,
  setShowAnswer: (show) => set({ showAnswer: show }),
  answerStartTime: null,
  setAnswerStartTime: (time) => set({ answerStartTime: time }),

  selectedNodeId: null,
  selectedNodeType: null,
  setSelectedNode: (id, type) => set({ selectedNodeId: id, selectedNodeType: type }),
  graphFilter: 'all',
  setGraphFilter: (filter) => set({ graphFilter: filter }),
  graphDepth: 2,
  setGraphDepth: (depth) => set({ graphDepth: depth }),

  kanjiJlptFilter: 5,
  setKanjiJlptFilter: (level) => set({ kanjiJlptFilter: level }),
  kanjiSearchQuery: '',
  setKanjiSearchQuery: (query) => set({ kanjiSearchQuery: query }),

  readingText: '',
  setReadingText: (text) => set({ readingText: text }),
  showFurigana: true,
  setShowFurigana: (show) => set({ showFurigana: show }),

  desiredRetention: 0.9,
  setDesiredRetention: (r) => set({ desiredRetention: r }),
  newCardsPerDay: 15,
  setNewCardsPerDay: (n) => set({ newCardsPerDay: n }),
}))
