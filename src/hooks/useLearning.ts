import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/stores/appStore'
import * as learningQueries from '@/db/queries/learning'
import type { LearningPath, LearningModule, Lesson, LessonTerm, LessonProgress } from '@/types'
import type { LearningGraphNode, LearningGraphEdge } from '@/db/queries/learning'

export function useLearning() {
  const { isDbReady, refreshTrigger } = useAppStore()
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPaths = useCallback(() => {
    if (!isDbReady) return
    try {
      setLoading(true)
      setPaths(learningQueries.getAllPaths())
    } catch (err) {
      console.error('Error fetching learning paths:', err)
    } finally {
      setLoading(false)
    }
  }, [isDbReady])

  useEffect(() => {
    fetchPaths()
  }, [fetchPaths, refreshTrigger])

  const getPathById = useCallback((id: string): LearningPath | null => {
    if (!isDbReady) return null
    try {
      return learningQueries.getPathById(id)
    } catch (err) {
      console.error('Error getting path:', err)
      return null
    }
  }, [isDbReady])

  const getModulesByPath = useCallback((pathId: string): LearningModule[] => {
    if (!isDbReady) return []
    try {
      return learningQueries.getModulesByPath(pathId)
    } catch (err) {
      console.error('Error getting modules:', err)
      return []
    }
  }, [isDbReady])

  const getLessonsByModule = useCallback((moduleId: string): Lesson[] => {
    if (!isDbReady) return []
    try {
      return learningQueries.getLessonsByModule(moduleId)
    } catch (err) {
      console.error('Error getting lessons:', err)
      return []
    }
  }, [isDbReady])

  const getAllLessonsByPath = useCallback((pathId: string): Lesson[] => {
    if (!isDbReady) return []
    try {
      return learningQueries.getAllLessonsByPath(pathId)
    } catch (err) {
      console.error('Error getting all lessons:', err)
      return []
    }
  }, [isDbReady])

  const getLessonById = useCallback((id: string): Lesson | null => {
    if (!isDbReady) return null
    try {
      return learningQueries.getLessonById(id)
    } catch (err) {
      console.error('Error getting lesson:', err)
      return null
    }
  }, [isDbReady])

  const getTermsByLesson = useCallback((lessonId: string): LessonTerm[] => {
    if (!isDbReady) return []
    try {
      return learningQueries.getTermsByLesson(lessonId)
    } catch (err) {
      console.error('Error getting terms:', err)
      return []
    }
  }, [isDbReady])

  // Progress
  const getProgress = useCallback((lessonId: string): LessonProgress | null => {
    if (!isDbReady) return null
    try {
      return learningQueries.getProgress(lessonId)
    } catch (err) {
      console.error('Error getting progress:', err)
      return null
    }
  }, [isDbReady])

  const markLessonComplete = useCallback((lessonId: string): void => {
    try {
      learningQueries.updateProgress(lessonId, { completed: true })
    } catch (err) {
      console.error('Error marking lesson complete:', err)
    }
  }, [])

  const saveScrollPosition = useCallback((lessonId: string, position: number): void => {
    try {
      learningQueries.updateProgress(lessonId, { scroll_position: position })
    } catch (err) {
      console.error('Error saving scroll position:', err)
    }
  }, [])

  const getPathProgress = useCallback((pathId: string) => {
    if (!isDbReady) return { total: 0, completed: 0, percentage: 0 }
    try {
      return learningQueries.getPathProgress(pathId)
    } catch (err) {
      console.error('Error getting path progress:', err)
      return { total: 0, completed: 0, percentage: 0 }
    }
  }, [isDbReady])

  const getGraphData = useCallback((pathId: string): { nodes: LearningGraphNode[]; edges: LearningGraphEdge[] } => {
    if (!isDbReady) return { nodes: [], edges: [] }
    try {
      return learningQueries.getLearningGraphData(pathId)
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
