import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/stores/appStore'
import * as learningQueries from '@/db/queries/learning'
import type { LearningPath, LearningModule, Lesson, LessonTerm, LessonProgress } from '@/types'
import type { LearningGraphNode, LearningGraphEdge } from '@/db/queries/learning'

export function useLearning() {
  const { isDbReady, refreshTrigger } = useAppStore()
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPaths = useCallback(async () => {
    if (!isDbReady) return
    try {
      setLoading(true)
      setPaths(await learningQueries.getAllPaths())
    } catch (err) {
      console.error('Error fetching learning paths:', err)
    } finally {
      setLoading(false)
    }
  }, [isDbReady])

  useEffect(() => {
    fetchPaths()
  }, [fetchPaths, refreshTrigger])

  const getPathById = useCallback(async (id: string): Promise<LearningPath | null> => {
    if (!isDbReady) return null
    try {
      return await learningQueries.getPathById(id)
    } catch (err) {
      console.error('Error getting path:', err)
      return null
    }
  }, [isDbReady])

  const getModulesByPath = useCallback(async (pathId: string): Promise<LearningModule[]> => {
    if (!isDbReady) return []
    try {
      return await learningQueries.getModulesByPath(pathId)
    } catch (err) {
      console.error('Error getting modules:', err)
      return []
    }
  }, [isDbReady])

  const getLessonsByModule = useCallback(async (moduleId: string): Promise<Lesson[]> => {
    if (!isDbReady) return []
    try {
      return await learningQueries.getLessonsByModule(moduleId)
    } catch (err) {
      console.error('Error getting lessons:', err)
      return []
    }
  }, [isDbReady])

  const getAllLessonsByPath = useCallback(async (pathId: string): Promise<Lesson[]> => {
    if (!isDbReady) return []
    try {
      return await learningQueries.getAllLessonsByPath(pathId)
    } catch (err) {
      console.error('Error getting all lessons:', err)
      return []
    }
  }, [isDbReady])

  const getLessonById = useCallback(async (id: string): Promise<Lesson | null> => {
    if (!isDbReady) return null
    try {
      return await learningQueries.getLessonById(id)
    } catch (err) {
      console.error('Error getting lesson:', err)
      return null
    }
  }, [isDbReady])

  const getTermsByLesson = useCallback(async (lessonId: string): Promise<LessonTerm[]> => {
    if (!isDbReady) return []
    try {
      return await learningQueries.getTermsByLesson(lessonId)
    } catch (err) {
      console.error('Error getting terms:', err)
      return []
    }
  }, [isDbReady])

  // Progress
  const getProgress = useCallback(async (lessonId: string): Promise<LessonProgress | null> => {
    if (!isDbReady) return null
    try {
      return await learningQueries.getProgress(lessonId)
    } catch (err) {
      console.error('Error getting progress:', err)
      return null
    }
  }, [isDbReady])

  const markLessonComplete = useCallback(async (lessonId: string): Promise<void> => {
    try {
      await learningQueries.updateProgress(lessonId, { completed: true })
    } catch (err) {
      console.error('Error marking lesson complete:', err)
    }
  }, [])

  const saveScrollPosition = useCallback(async (lessonId: string, position: number): Promise<void> => {
    try {
      await learningQueries.updateProgress(lessonId, { scroll_position: position })
    } catch (err) {
      console.error('Error saving scroll position:', err)
    }
  }, [])

  const getPathProgress = useCallback(async (pathId: string) => {
    if (!isDbReady) return { total: 0, completed: 0, percentage: 0 }
    try {
      return await learningQueries.getPathProgress(pathId)
    } catch (err) {
      console.error('Error getting path progress:', err)
      return { total: 0, completed: 0, percentage: 0 }
    }
  }, [isDbReady])

  const getGraphData = useCallback(async (pathId: string): Promise<{ nodes: LearningGraphNode[]; edges: LearningGraphEdge[] }> => {
    if (!isDbReady) return { nodes: [], edges: [] }
    try {
      return await learningQueries.getLearningGraphData(pathId)
    } catch (err) {
      console.error('Error getting graph data:', err)
      return { nodes: [], edges: [] }
    }
  }, [isDbReady])

  return {
    paths,
    loading,
    getPathById,
    getModulesByPath,
    getLessonsByModule,
    getAllLessonsByPath,
    getLessonById,
    getTermsByLesson,
    getProgress,
    markLessonComplete,
    saveScrollPosition,
    getPathProgress,
    getGraphData,
    refresh: fetchPaths,
  }
}
