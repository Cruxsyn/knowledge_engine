import { create } from 'zustand'
import type { JpItemType, JpAssociationCategory, JpSrsCard } from '@/types'
import {
  getDashboardStats,
  getStudySessions,
  getCurrentStreak,
  getDueCards,
  getNewCards,
  getCardWithItemData,
  updateSrsCard,
  addReviewLog,
  createOrUpdateGhost,
  removeGhost,
  getAssociationsForNode,
} from '@/db/queries/japanese'
import {
  createFSRS,
  getSchedulingInfo,
  reviewCard as fsrsReviewCard,
} from '@/lib/japanese/fsrs-engine'
import { applySpreadingActivation } from '@/lib/japanese/srs-integration'

// ── Exported types ──────────────────────────────────────────────

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

export interface ReviewResult {
  cardId: string
  rating: ReviewRating
  durationMs: number
}

export interface ReviewCard {
  id: string
  itemId: string
  itemType: string
  front: string
  frontLabel?: string
  type: string
  jlptLevel: string
  back: {
    reading?: string
    meaning: string
    mnemonic?: string
    components?: string
    example?: string
  }
  intervals: Record<ReviewRating, string>
}

export interface DashboardStats {
  reviewsDue: number
  newAvailable: number
  ghosts: number
  streakDays: number
  totalKnown: number
  progress: {
    vocabulary: number
    kanji: number
    grammar: number
    reading: number
    listening: number
  }
  heatMap: { date: string; intensity: number }[]
  jlptProgress: Record<string, number>
}

// ── Helpers ─────────────────────────────────────────────────────

const RATING_TO_NUMBER: Record<ReviewRating, 1 | 2 | 3 | 4> = {
  again: 1,
  hard: 2,
  good: 3,
  easy: 4,
}

function formatInterval(scheduledDays: number): string {
  if (scheduledDays < 1 / 1440) return '< 1m'
  if (scheduledDays < 1 / 24) {
    const mins = Math.round(scheduledDays * 1440)
    return `${mins}m`
  }
  if (scheduledDays < 1) {
    const hours = Math.round(scheduledDays * 24)
    return `${hours}h`
  }
  if (scheduledDays < 30) {
    const days = Math.round(scheduledDays)
    return `${days}d`
  }
  if (scheduledDays < 365) {
    const months = Math.round(scheduledDays / 30)
    return `${months}mo`
  }
  const years = (scheduledDays / 365).toFixed(1)
  return `${years}y`
}

function buildReviewCard(
  card: JpSrsCard,
  item: Record<string, unknown>,
  itemType: string,
  cardType: string,
  engine: ReturnType<typeof createFSRS>
): ReviewCard {
  let front = ''
  let frontLabel: string | undefined
  let back: ReviewCard['back'] = { meaning: '' }
  let jlptLevel = 'N5'
  const type =
    itemType === 'kanji' && cardType === 'meaning'
      ? 'kanji_meaning'
      : itemType === 'kanji' && cardType === 'reading'
        ? 'kanji_reading'
        : itemType === 'word'
          ? 'vocab_meaning'
          : 'grammar'

  if (itemType === 'kanji') {
    const k = item as {
      character: string
      meanings: string[]
      on_readings?: string[]
      kun_readings?: string[]
      jlpt_level?: number
      mnemonic_meaning?: string
      mnemonic_reading?: string
    }
    jlptLevel = `N${k.jlpt_level ?? 5}`
    front = k.character

    if (cardType === 'reading') {
      frontLabel = k.meanings[0]
      const readings: string[] = []
      if (k.on_readings?.length) readings.push(`ON: ${k.on_readings.join(', ')}`)
      if (k.kun_readings?.length) readings.push(`KUN: ${k.kun_readings.join(', ')}`)
      back = {
        reading: readings.join(' | '),
        meaning: k.meanings.join(', '),
        mnemonic: k.mnemonic_reading,
      }
    } else {
      back = {
        meaning: k.meanings.join(', '),
        mnemonic: k.mnemonic_meaning,
      }
      if (k.on_readings?.length || k.kun_readings?.length) {
        const readings: string[] = []
        if (k.on_readings?.length) readings.push(k.on_readings.join(', '))
        if (k.kun_readings?.length) readings.push(k.kun_readings.join(', '))
        back.reading = readings.join(' / ')
      }
    }
  } else if (itemType === 'word') {
    const v = item as {
      word: string
      reading: string
      meanings: string[]
      jlpt_level?: number
      notes?: string
    }
    jlptLevel = `N${v.jlpt_level ?? 5}`
    front = v.word
    back = {
      reading: v.reading,
      meaning: v.meanings.join('; '),
    }
    if (v.notes) {
      back.example = v.notes
    }
  } else if (itemType === 'grammar') {
    const g = item as {
      pattern: string
      meaning: string
      jlpt_level?: number
      formation?: string
      examples?: { jp: string; en: string }[]
    }
    jlptLevel = `N${g.jlpt_level ?? 5}`
    front = g.pattern
    back = {
      meaning: g.meaning,
    }
    if (g.formation) {
      back.components = g.formation
    }
    if (g.examples?.length) {
      back.example = g.examples
        .slice(0, 2)
        .map((ex) => `${ex.jp} — ${ex.en}`)
        .join('\n')
    }
  } else if (itemType === 'radical') {
    const r = item as {
      character: string
      meaning: string
      mnemonic?: string
    }
    front = r.character
    back = {
      meaning: r.meaning,
      mnemonic: r.mnemonic,
    }
  }

  // Compute interval previews
  const scheduling = getSchedulingInfo(engine, card)
  const intervals: Record<ReviewRating, string> = {
    again: formatInterval(scheduling.again.interval),
    hard: formatInterval(scheduling.hard.interval),
    good: formatInterval(scheduling.good.interval),
    easy: formatInterval(scheduling.easy.interval),
  }

  return {
    id: card.id,
    itemId: card.item_id,
    itemType: card.item_type,
    front,
    frontLabel,
    type,
    jlptLevel,
    back,
    intervals,
  }
}

// ── Default values ──────────────────────────────────────────────

const DEFAULT_STATS: DashboardStats = {
  reviewsDue: 0,
  newAvailable: 0,
  ghosts: 0,
  streakDays: 0,
  totalKnown: 0,
  progress: { vocabulary: 0, kanji: 0, grammar: 0, reading: 0, listening: 0 },
  heatMap: [],
  jlptProgress: { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 },
}

const DEFAULT_SESSION = {
  cards: [] as ReviewCard[],
  currentIndex: 0,
  revealed: false,
  results: [] as ReviewResult[],
  startTime: null as number | null,
  completed: false,
}

// ── Store interface ─────────────────────────────────────────────

export interface JapaneseState {
  // Current view/navigation
  activeTab:
    | 'explore'
    | 'forge'
    | 'discover'
    | 'read'
    | 'dashboard'
    | 'review'
    | 'settings'
  setActiveTab: (tab: JapaneseState['activeTab']) => void

  // Dashboard stats
  stats: DashboardStats
  loadStats: () => Promise<void>

  // Review session
  session: typeof DEFAULT_SESSION
  startReviewSession: () => Promise<void>
  revealCard: () => void
  rateCard: (rating: ReviewRating) => Promise<void>
  resetSession: () => void

  // Forge state
  forgedKanji: string[]
  addForgedKanji: (character: string) => void

  // Discovery state
  discoveredPatterns: string[]
  addDiscoveredPattern: (patternId: string) => void

  // Kanji browser view
  kanjiBrowserView: 'grid' | 'list' | 'components'
  setKanjiBrowserView: (view: 'grid' | 'list' | 'components') => void

  // Reading practice
  highlightUnknown: boolean
  setHighlightUnknown: (highlight: boolean) => void

  // Association web explorer
  selectedNodeId: string | null
  selectedNodeType: JpItemType | null
  setSelectedNode: (id: string | null, type: JpItemType | null) => void
  graphFilter: {
    nodeTypes: JpItemType[]
    edgeCategories: JpAssociationCategory[]
  }
  setGraphFilter: (filter: Partial<{ nodeTypes: JpItemType[]; edgeCategories: JpAssociationCategory[] }>) => void
  graphDepth: number
  setGraphDepth: (depth: number) => void

  // Kanji browser filters
  kanjiJlptFilter: number | null
  setKanjiJlptFilter: (level: number | null) => void
  kanjiSearchQuery: string
  setKanjiSearchQuery: (query: string) => void

  // Reading practice text
  readingText: string
  setReadingText: (text: string) => void
  showFurigana: boolean
  setShowFurigana: (show: boolean) => void

  // SRS settings (in-memory, synced with db)
  desiredRetention: number
  setDesiredRetention: (r: number) => void
  newCardsPerDay: number
  setNewCardsPerDay: (n: number) => void

  // Settings panel (aggregated settings object)
  settings: {
    desiredRetention: number
    newCardsPerDay: number
    newRadicalsPerDay: number
    newKanjiPerDay: number
    newVocabPerDay: number
    maxReviewsPerDay: number
    reviewOrder: 'due_date' | 'random' | 'difficulty'
    showPitchAccent: boolean
    showFurigana: boolean
    interleaveReviews: boolean
  }
  updateSettings: (updates: Partial<JapaneseState['settings']>) => void
}

// ── Store ───────────────────────────────────────────────────────

export const useJapaneseStore = create<JapaneseState>((set, get) => ({
  // Navigation
  activeTab: 'explore',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Dashboard stats
  stats: DEFAULT_STATS,

  loadStats: async () => {
    try {
      const dbStats = getDashboardStats()
      const sessions = getStudySessions(91)
      const streak = getCurrentStreak()

      // Build progress map from JpProgress[] -> 0-5 scale
      const progressMap: DashboardStats['progress'] = {
        vocabulary: 0,
        kanji: 0,
        grammar: 0,
        reading: 0,
        listening: 0,
      }
      for (const p of dbStats.progress) {
        if (p.dimension in progressMap) {
          progressMap[p.dimension as keyof typeof progressMap] = p.current_level
        }
      }

      // Build heat map from study sessions
      const sessionsByDate = new Map<string, number>()
      for (const s of sessions) {
        const existing = sessionsByDate.get(s.session_date) ?? 0
        sessionsByDate.set(s.session_date, existing + s.duration_minutes)
      }

      const heatMap: DashboardStats['heatMap'] = []
      const today = new Date()
      for (let i = 90; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const minutes = sessionsByDate.get(dateStr) ?? 0
        let intensity = 0
        if (minutes > 0 && minutes <= 15) intensity = 1
        else if (minutes > 15 && minutes <= 30) intensity = 2
        else if (minutes > 30 && minutes <= 60) intensity = 3
        else if (minutes > 60) intensity = 4
        heatMap.push({ date: dateStr, intensity })
      }

      // JLPT progress: estimate from known items by level
      const jlptProgress: Record<string, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 }
      // Use progress data to estimate JLPT levels
      const totalKnown = dbStats.progress.reduce(
        (sum, p) => sum + p.items_known + p.items_mastered,
        0
      )
      const totalItems = dbStats.progress.reduce((sum, p) => sum + p.items_total, 0)
      if (totalItems > 0) {
        // Distribute progress across JLPT levels based on total mastery
        const overallRatio = totalKnown / totalItems
        jlptProgress['N5'] = Math.min(100, Math.round(overallRatio * 500))
        jlptProgress['N4'] = Math.min(100, Math.round(Math.max(0, overallRatio - 0.2) * 500))
        jlptProgress['N3'] = Math.min(100, Math.round(Math.max(0, overallRatio - 0.4) * 500))
        jlptProgress['N2'] = Math.min(100, Math.round(Math.max(0, overallRatio - 0.6) * 500))
        jlptProgress['N1'] = Math.min(100, Math.round(Math.max(0, overallRatio - 0.8) * 500))
      }

      set({
        stats: {
          reviewsDue: dbStats.dueCards,
          newAvailable: dbStats.newCardsAvailable,
          ghosts: dbStats.ghostCount,
          streakDays: streak,
          totalKnown: dbStats.totalKnownWords,
          progress: progressMap,
          heatMap,
          jlptProgress,
        },
      })
    } catch (err) {
      console.error('[japaneseStore] loadStats error:', err)
    }
  },

  // Review session
  session: { ...DEFAULT_SESSION },

  startReviewSession: async () => {
    try {
      const { desiredRetention, newCardsPerDay } = get()
      const engine = createFSRS(desiredRetention)

      // Get due cards + new cards
      const dueCards = getDueCards(50)
      const newCardLimit = Math.max(0, newCardsPerDay)
      const newSrsCards = getNewCards(undefined, newCardLimit)
      const allCards = [...dueCards, ...newSrsCards]

      if (allCards.length === 0) {
        set({
          session: {
            cards: [],
            currentIndex: 0,
            revealed: false,
            results: [],
            startTime: Date.now(),
            completed: true,
          },
        })
        return
      }

      // Build ReviewCard objects for each
      const reviewCards: ReviewCard[] = []
      for (const card of allCards) {
        try {
          const withItem = getCardWithItemData(card.id)
          if (!withItem) continue

          const reviewCard = buildReviewCard(
            card,
            withItem.item as unknown as Record<string, unknown>,
            card.item_type,
            card.card_type,
            engine
          )
          reviewCards.push(reviewCard)
        } catch (err) {
          console.error('[japaneseStore] Error building card:', card.id, err)
        }
      }

      set({
        session: {
          cards: reviewCards,
          currentIndex: 0,
          revealed: false,
          results: [],
          startTime: Date.now(),
          completed: false,
        },
      })
    } catch (err) {
      console.error('[japaneseStore] startReviewSession error:', err)
    }
  },

  revealCard: () => {
    set((state) => ({
      session: { ...state.session, revealed: true },
    }))
  },

  rateCard: async (rating: ReviewRating) => {
    try {
      const { session, desiredRetention } = get()
      const currentCard = session.cards[session.currentIndex]
      if (!currentCard) return

      const ratingNum = RATING_TO_NUMBER[rating]
      const engine = createFSRS(desiredRetention)

      // Get the raw SRS card from DB to pass to FSRS
      const cardWithItem = getCardWithItemData(currentCard.id)
      if (!cardWithItem) return

      const srsCard: JpSrsCard = {
        id: cardWithItem.id,
        item_id: cardWithItem.item_id,
        item_type: cardWithItem.item_type,
        card_type: cardWithItem.card_type,
        stability: cardWithItem.stability,
        difficulty: cardWithItem.difficulty,
        elapsed_days: cardWithItem.elapsed_days,
        scheduled_days: cardWithItem.scheduled_days,
        reps: cardWithItem.reps,
        lapses: cardWithItem.lapses,
        state: cardWithItem.state,
        due: cardWithItem.due,
        last_review: cardWithItem.last_review,
        implicit_boost: cardWithItem.implicit_boost,
        created_at: cardWithItem.created_at,
      }

      // Run FSRS review
      const { updatedCard, reviewLog } = fsrsReviewCard(engine, srsCard, ratingNum)

      // Persist updated card state
      updateSrsCard(currentCard.id, updatedCard)

      // Log the review
      const durationMs = session.startTime
        ? Math.round((Date.now() - session.startTime) / Math.max(1, session.results.length + 1))
        : 0
      addReviewLog({
        card_id: currentCard.id,
        rating: ratingNum,
        state: reviewLog.state as 0 | 1 | 2 | 3,
        elapsed_days: reviewLog.elapsed_days,
        scheduled_days: reviewLog.scheduled_days,
        duration_ms: durationMs,
      })

      // Ghost management
      if (rating === 'again') {
        createOrUpdateGhost(currentCard.id)
      } else if (rating === 'good' || rating === 'easy') {
        removeGhost(currentCard.id)
      }

      // Apply spreading activation
      try {
        const ratingScale = ratingNum / 4
        await applySpreadingActivation(
          currentCard.itemId,
          currentCard.itemType as JpItemType,
          ratingScale
        )
      } catch (err) {
        console.error('[japaneseStore] spreading activation error:', err)
      }

      // Record result and advance
      const newResults: ReviewResult[] = [
        ...session.results,
        { cardId: currentCard.id, rating, durationMs },
      ]
      const nextIndex = session.currentIndex + 1
      const completed = nextIndex >= session.cards.length

      set({
        session: {
          ...session,
          currentIndex: nextIndex,
          revealed: false,
          results: newResults,
          completed,
        },
      })
    } catch (err) {
      console.error('[japaneseStore] rateCard error:', err)
    }
  },

  resetSession: () => {
    set({
      session: { ...DEFAULT_SESSION },
    })
  },

  // Forge state
  forgedKanji: [],
  addForgedKanji: (character) =>
    set((state) => ({
      forgedKanji: state.forgedKanji.includes(character)
        ? state.forgedKanji
        : [...state.forgedKanji, character],
    })),

  // Discovery state
  discoveredPatterns: [],
  addDiscoveredPattern: (patternId) =>
    set((state) => ({
      discoveredPatterns: state.discoveredPatterns.includes(patternId)
        ? state.discoveredPatterns
        : [...state.discoveredPatterns, patternId],
    })),

  // Kanji browser
  kanjiBrowserView: 'grid',
  setKanjiBrowserView: (view) => set({ kanjiBrowserView: view }),

  // Reading highlight
  highlightUnknown: false,
  setHighlightUnknown: (highlight) => set({ highlightUnknown: highlight }),

  // Association web explorer
  selectedNodeId: null,
  selectedNodeType: null,
  setSelectedNode: (id, type) =>
    set({ selectedNodeId: id, selectedNodeType: type }),
  graphFilter: {
    nodeTypes: ['radical', 'kanji', 'word', 'grammar'] as JpItemType[],
    edgeCategories: ['semantic', 'phonological', 'orthographic', 'collocational', 'grammatical', 'mnemonic'] as JpAssociationCategory[],
  },
  setGraphFilter: (filter) =>
    set((state) => ({
      graphFilter: { ...state.graphFilter, ...filter },
    })),
  graphDepth: 2,
  setGraphDepth: (depth) => set({ graphDepth: depth }),

  // Kanji browser filters
  kanjiJlptFilter: 5,
  setKanjiJlptFilter: (level) => set({ kanjiJlptFilter: level }),
  kanjiSearchQuery: '',
  setKanjiSearchQuery: (query) => set({ kanjiSearchQuery: query }),

  // Reading practice
  readingText: '',
  setReadingText: (text) => set({ readingText: text }),
  showFurigana: true,
  setShowFurigana: (show) => set({ showFurigana: show }),

  // SRS settings
  desiredRetention: 0.9,
  setDesiredRetention: (r) => set({ desiredRetention: r }),
  newCardsPerDay: 15,
  setNewCardsPerDay: (n) => set({ newCardsPerDay: n }),

  // Settings panel (aggregated)
  settings: {
    desiredRetention: 0.9,
    newCardsPerDay: 15,
    newRadicalsPerDay: 5,
    newKanjiPerDay: 5,
    newVocabPerDay: 10,
    maxReviewsPerDay: 9999,
    reviewOrder: 'due_date' as const,
    showPitchAccent: true,
    showFurigana: true,
    interleaveReviews: true,
  },
  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
      // Also sync top-level fields if present
      ...(updates.desiredRetention !== undefined
        ? { desiredRetention: updates.desiredRetention }
        : {}),
      ...(updates.newCardsPerDay !== undefined
        ? { newCardsPerDay: updates.newCardsPerDay }
        : {}),
      ...(updates.showFurigana !== undefined
        ? { showFurigana: updates.showFurigana }
        : {}),
    }))
  },
}))
