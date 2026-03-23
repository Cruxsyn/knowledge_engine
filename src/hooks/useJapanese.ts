import { useCallback } from 'react'
import { useAppStore } from '@/stores/appStore'

export function useJapanese() {
  const { isDbReady, refreshTrigger } = useAppStore()

  // ---- Radicals ----

  const getAllRadicals = useCallback(async () => {
    if (!isDbReady) return []
    try {
      const { getAllRadicals: fn } = await import('@/db/queries/japanese')
      return fn()
    } catch (err) {
      console.error('[useJapanese] getAllRadicals error:', err)
      return []
    }
  }, [isDbReady, refreshTrigger])

  const getRadicalById = useCallback(async (id: string) => {
    if (!isDbReady) return null
    try {
      const { getRadicalById: fn } = await import('@/db/queries/japanese')
      return fn(id)
    } catch (err) {
      console.error('[useJapanese] getRadicalById error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  const createRadical = useCallback(async (data: Parameters<Awaited<typeof import('@/db/queries/japanese')>['createRadical']>[0]) => {
    if (!isDbReady) return null
    try {
      const { createRadical: fn } = await import('@/db/queries/japanese')
      return fn(data)
    } catch (err) {
      console.error('[useJapanese] createRadical error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  // ---- Kanji ----

  const getAllKanji = useCallback(async (jlptLevel?: number) => {
    if (!isDbReady) return []
    try {
      const { getAllKanji: fn } = await import('@/db/queries/japanese')
      return fn(jlptLevel)
    } catch (err) {
      console.error('[useJapanese] getAllKanji error:', err)
      return []
    }
  }, [isDbReady, refreshTrigger])

  const getKanjiById = useCallback(async (id: string) => {
    if (!isDbReady) return null
    try {
      const { getKanjiById: fn } = await import('@/db/queries/japanese')
      return fn(id)
    } catch (err) {
      console.error('[useJapanese] getKanjiById error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  const getKanjiByCharacter = useCallback(async (character: string) => {
    if (!isDbReady) return null
    try {
      const { getKanjiByCharacter: fn } = await import('@/db/queries/japanese')
      return fn(character)
    } catch (err) {
      console.error('[useJapanese] getKanjiByCharacter error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  const getKanjiComponents = useCallback(async (kanjiId: string) => {
    if (!isDbReady) return []
    try {
      const { getKanjiComponents: fn } = await import('@/db/queries/japanese')
      return fn(kanjiId)
    } catch (err) {
      console.error('[useJapanese] getKanjiComponents error:', err)
      return []
    }
  }, [isDbReady, refreshTrigger])

  const createKanji = useCallback(async (data: Parameters<Awaited<typeof import('@/db/queries/japanese')>['createKanji']>[0]) => {
    if (!isDbReady) return null
    try {
      const { createKanji: fn } = await import('@/db/queries/japanese')
      return fn(data)
    } catch (err) {
      console.error('[useJapanese] createKanji error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  // ---- Vocabulary ----

  const getAllVocabulary = useCallback(async (jlptLevel?: number) => {
    if (!isDbReady) return []
    try {
      const { getAllVocabulary: fn } = await import('@/db/queries/japanese')
      return fn(jlptLevel)
    } catch (err) {
      console.error('[useJapanese] getAllVocabulary error:', err)
      return []
    }
  }, [isDbReady, refreshTrigger])

  const getVocabById = useCallback(async (id: string) => {
    if (!isDbReady) return null
    try {
      const { getVocabById: fn } = await import('@/db/queries/japanese')
      return fn(id)
    } catch (err) {
      console.error('[useJapanese] getVocabById error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  const getVocabForKanji = useCallback(async (kanjiId: string) => {
    if (!isDbReady) return []
    try {
      const { getVocabForKanji: fn } = await import('@/db/queries/japanese')
      return fn(kanjiId)
    } catch (err) {
      console.error('[useJapanese] getVocabForKanji error:', err)
      return []
    }
  }, [isDbReady, refreshTrigger])

  const createVocabulary = useCallback(async (data: Parameters<Awaited<typeof import('@/db/queries/japanese')>['createVocabulary']>[0]) => {
    if (!isDbReady) return null
    try {
      const { createVocabulary: fn } = await import('@/db/queries/japanese')
      return fn(data)
    } catch (err) {
      console.error('[useJapanese] createVocabulary error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  // ---- Grammar ----

  const getAllGrammar = useCallback(async (jlptLevel?: number) => {
    if (!isDbReady) return []
    try {
      const { getAllGrammar: fn } = await import('@/db/queries/japanese')
      return fn(jlptLevel)
    } catch (err) {
      console.error('[useJapanese] getAllGrammar error:', err)
      return []
    }
  }, [isDbReady, refreshTrigger])

  const getGrammarById = useCallback(async (id: string) => {
    if (!isDbReady) return null
    try {
      const { getGrammarById: fn } = await import('@/db/queries/japanese')
      return fn(id)
    } catch (err) {
      console.error('[useJapanese] getGrammarById error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  const createGrammar = useCallback(async (data: Parameters<Awaited<typeof import('@/db/queries/japanese')>['createGrammar']>[0]) => {
    if (!isDbReady) return null
    try {
      const { createGrammar: fn } = await import('@/db/queries/japanese')
      return fn(data)
    } catch (err) {
      console.error('[useJapanese] createGrammar error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  // ---- Sentences ----

  const getSentencesForVocab = useCallback(async (vocabId: string) => {
    if (!isDbReady) return []
    try {
      const { getSentencesForVocab: fn } = await import('@/db/queries/japanese')
      return fn(vocabId)
    } catch (err) {
      console.error('[useJapanese] getSentencesForVocab error:', err)
      return []
    }
  }, [isDbReady, refreshTrigger])

  const createSentence = useCallback(async (data: Parameters<Awaited<typeof import('@/db/queries/japanese')>['createSentence']>[0]) => {
    if (!isDbReady) return null
    try {
      const { createSentence: fn } = await import('@/db/queries/japanese')
      return fn(data)
    } catch (err) {
      console.error('[useJapanese] createSentence error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  // ---- Associations / Graph ----

  const getAssociationsForNode = useCallback(async (nodeId: string, nodeType: import('@/types').JpItemType | 'sentence') => {
    if (!isDbReady) return []
    try {
      const { getAssociationsForNode: fn } = await import('@/db/queries/japanese')
      return fn(nodeId, nodeType)
    } catch (err) {
      console.error('[useJapanese] getAssociationsForNode error:', err)
      return []
    }
  }, [isDbReady, refreshTrigger])

  const createAssociation = useCallback(async (data: Parameters<Awaited<typeof import('@/db/queries/japanese')>['createAssociation']>[0]) => {
    if (!isDbReady) return null
    try {
      const { createAssociation: fn } = await import('@/db/queries/japanese')
      return fn(data)
    } catch (err) {
      console.error('[useJapanese] createAssociation error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  const getGraphData = useCallback(async (rootId: string, rootType: import('@/types').JpItemType, depth?: number) => {
    if (!isDbReady) return { nodes: [], edges: [] }
    try {
      const { getGraphData: fn } = await import('@/db/queries/japanese')
      return fn(rootId, rootType, depth ?? 2)
    } catch (err) {
      console.error('[useJapanese] getGraphData error:', err)
      return { nodes: [], edges: [] }
    }
  }, [isDbReady, refreshTrigger])

  // ---- SRS ----

  const getDueCards = useCallback(async (limit?: number) => {
    if (!isDbReady) return []
    try {
      const { getDueCards: fn } = await import('@/db/queries/japanese')
      return fn(limit)
    } catch (err) {
      console.error('[useJapanese] getDueCards error:', err)
      return []
    }
  }, [isDbReady, refreshTrigger])

  const getNewCards = useCallback(async (limit?: number) => {
    if (!isDbReady) return []
    try {
      const { getNewCards: fn } = await import('@/db/queries/japanese')
      return fn(limit)
    } catch (err) {
      console.error('[useJapanese] getNewCards error:', err)
      return []
    }
  }, [isDbReady, refreshTrigger])

  const createSrsCard = useCallback(async (data: Parameters<Awaited<typeof import('@/db/queries/japanese')>['createSrsCard']>[0]) => {
    if (!isDbReady) return null
    try {
      const { createSrsCard: fn } = await import('@/db/queries/japanese')
      return fn(data)
    } catch (err) {
      console.error('[useJapanese] createSrsCard error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  const updateSrsCard = useCallback(async (id: string, updates: Parameters<Awaited<typeof import('@/db/queries/japanese')>['updateSrsCard']>[1]) => {
    if (!isDbReady) return null
    try {
      const { updateSrsCard: fn } = await import('@/db/queries/japanese')
      return fn(id, updates)
    } catch (err) {
      console.error('[useJapanese] updateSrsCard error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  const getCardWithItemData = useCallback(async (cardId: string) => {
    if (!isDbReady) return null
    try {
      const { getCardWithItemData: fn } = await import('@/db/queries/japanese')
      return fn(cardId)
    } catch (err) {
      console.error('[useJapanese] getCardWithItemData error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  // ---- Review Logs ----

  const addReviewLog = useCallback(async (data: Parameters<Awaited<typeof import('@/db/queries/japanese')>['addReviewLog']>[0]) => {
    if (!isDbReady) return null
    try {
      const { addReviewLog: fn } = await import('@/db/queries/japanese')
      return fn(data)
    } catch (err) {
      console.error('[useJapanese] addReviewLog error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  const getTodayReviewCount = useCallback(async () => {
    if (!isDbReady) return 0
    try {
      const { getTodayReviewCount: fn } = await import('@/db/queries/japanese')
      return fn()
    } catch (err) {
      console.error('[useJapanese] getTodayReviewCount error:', err)
      return 0
    }
  }, [isDbReady, refreshTrigger])

  const getTodayAccuracy = useCallback(async () => {
    if (!isDbReady) return 0
    try {
      const { getTodayAccuracy: fn } = await import('@/db/queries/japanese')
      return fn()
    } catch (err) {
      console.error('[useJapanese] getTodayAccuracy error:', err)
      return 0
    }
  }, [isDbReady, refreshTrigger])

  // ---- Known Words ----

  const getKnownWord = useCallback(async (lemma: string) => {
    if (!isDbReady) return null
    try {
      const { getKnownWord: fn } = await import('@/db/queries/japanese')
      return fn(lemma)
    } catch (err) {
      console.error('[useJapanese] getKnownWord error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  const updateKnownWord = useCallback(async (data: Parameters<Awaited<typeof import('@/db/queries/japanese')>['updateKnownWord']>[0]) => {
    if (!isDbReady) return null
    try {
      const { updateKnownWord: fn } = await import('@/db/queries/japanese')
      return fn(data)
    } catch (err) {
      console.error('[useJapanese] updateKnownWord error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  const getKnownWordCount = useCallback(async () => {
    if (!isDbReady) return 0
    try {
      const { getKnownWordCount: fn } = await import('@/db/queries/japanese')
      return fn()
    } catch (err) {
      console.error('[useJapanese] getKnownWordCount error:', err)
      return 0
    }
  }, [isDbReady, refreshTrigger])

  const getAllKnownLemmas = useCallback(async () => {
    if (!isDbReady) return []
    try {
      const { getAllKnownLemmas: fn } = await import('@/db/queries/japanese')
      return fn()
    } catch (err) {
      console.error('[useJapanese] getAllKnownLemmas error:', err)
      return []
    }
  }, [isDbReady, refreshTrigger])

  // ---- Ghosts ----

  const getGhostsDue = useCallback(async () => {
    if (!isDbReady) return []
    try {
      const { getGhostsDue: fn } = await import('@/db/queries/japanese')
      return fn()
    } catch (err) {
      console.error('[useJapanese] getGhostsDue error:', err)
      return []
    }
  }, [isDbReady, refreshTrigger])

  const createOrUpdateGhost = useCallback(async (data: Parameters<Awaited<typeof import('@/db/queries/japanese')>['createOrUpdateGhost']>[0]) => {
    if (!isDbReady) return null
    try {
      const { createOrUpdateGhost: fn } = await import('@/db/queries/japanese')
      return fn(data)
    } catch (err) {
      console.error('[useJapanese] createOrUpdateGhost error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  const removeGhost = useCallback(async (id: string) => {
    if (!isDbReady) return false
    try {
      const { removeGhost: fn } = await import('@/db/queries/japanese')
      return fn(id)
    } catch (err) {
      console.error('[useJapanese] removeGhost error:', err)
      return false
    }
  }, [isDbReady, refreshTrigger])

  // ---- Progress ----

  const getProgress = useCallback(async (dimension?: string) => {
    if (!isDbReady) return dimension ? null : []
    try {
      const { getProgress: fn } = await import('@/db/queries/japanese')
      return fn(dimension)
    } catch (err) {
      console.error('[useJapanese] getProgress error:', err)
      return dimension ? null : []
    }
  }, [isDbReady, refreshTrigger])

  const updateProgress = useCallback(async (data: Parameters<Awaited<typeof import('@/db/queries/japanese')>['updateProgress']>[0]) => {
    if (!isDbReady) return null
    try {
      const { updateProgress: fn } = await import('@/db/queries/japanese')
      return fn(data)
    } catch (err) {
      console.error('[useJapanese] updateProgress error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  const recalculateProgress = useCallback(async () => {
    if (!isDbReady) return
    try {
      const { recalculateProgress: fn } = await import('@/db/queries/japanese')
      return fn()
    } catch (err) {
      console.error('[useJapanese] recalculateProgress error:', err)
    }
  }, [isDbReady, refreshTrigger])

  // ---- Study Sessions ----

  const logStudySession = useCallback(async (data: Parameters<Awaited<typeof import('@/db/queries/japanese')>['logStudySession']>[0]) => {
    if (!isDbReady) return null
    try {
      const { logStudySession: fn } = await import('@/db/queries/japanese')
      return fn(data)
    } catch (err) {
      console.error('[useJapanese] logStudySession error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  const getStudySessions = useCallback(async (limit?: number) => {
    if (!isDbReady) return []
    try {
      const { getStudySessions: fn } = await import('@/db/queries/japanese')
      return fn(limit)
    } catch (err) {
      console.error('[useJapanese] getStudySessions error:', err)
      return []
    }
  }, [isDbReady, refreshTrigger])

  const getCurrentStreak = useCallback(async () => {
    if (!isDbReady) return 0
    try {
      const { getCurrentStreak: fn } = await import('@/db/queries/japanese')
      return fn()
    } catch (err) {
      console.error('[useJapanese] getCurrentStreak error:', err)
      return 0
    }
  }, [isDbReady, refreshTrigger])

  // ---- Settings ----

  const getSetting = useCallback(async (key: string) => {
    if (!isDbReady) return null
    try {
      const { getSetting: fn } = await import('@/db/queries/japanese')
      return fn(key)
    } catch (err) {
      console.error('[useJapanese] getSetting error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  const setSetting = useCallback(async (key: string, value: string) => {
    if (!isDbReady) return
    try {
      const { setSetting: fn } = await import('@/db/queries/japanese')
      return fn(key, value)
    } catch (err) {
      console.error('[useJapanese] setSetting error:', err)
    }
  }, [isDbReady, refreshTrigger])

  const getAllSettings = useCallback(async () => {
    if (!isDbReady) return {}
    try {
      const { getAllSettings: fn } = await import('@/db/queries/japanese')
      return fn()
    } catch (err) {
      console.error('[useJapanese] getAllSettings error:', err)
      return {}
    }
  }, [isDbReady, refreshTrigger])

  // ---- Dashboard ----

  const getDashboardStats = useCallback(async () => {
    if (!isDbReady) return null
    try {
      const { getDashboardStats: fn } = await import('@/db/queries/japanese')
      return fn()
    } catch (err) {
      console.error('[useJapanese] getDashboardStats error:', err)
      return null
    }
  }, [isDbReady, refreshTrigger])

  return {
    // Radicals
    getAllRadicals,
    getRadicalById,
    createRadical,
    // Kanji
    getAllKanji,
    getKanjiById,
    getKanjiByCharacter,
    getKanjiComponents,
    createKanji,
    // Vocabulary
    getAllVocabulary,
    getVocabById,
    getVocabForKanji,
    createVocabulary,
    // Grammar
    getAllGrammar,
    getGrammarById,
    createGrammar,
    // Sentences
    getSentencesForVocab,
    createSentence,
    // Associations / Graph
    getAssociationsForNode,
    createAssociation,
    getGraphData,
    // SRS
    getDueCards,
    getNewCards,
    createSrsCard,
    updateSrsCard,
    getCardWithItemData,
    // Review Logs
    addReviewLog,
    getTodayReviewCount,
    getTodayAccuracy,
    // Known Words
    getKnownWord,
    updateKnownWord,
    getKnownWordCount,
    getAllKnownLemmas,
    // Ghosts
    getGhostsDue,
    createOrUpdateGhost,
    removeGhost,
    // Progress
    getProgress,
    updateProgress,
    recalculateProgress,
    // Study Sessions
    logStudySession,
    getStudySessions,
    getCurrentStreak,
    // Settings
    getSetting,
    setSetting,
    getAllSettings,
    // Dashboard
    getDashboardStats,
  }
}
