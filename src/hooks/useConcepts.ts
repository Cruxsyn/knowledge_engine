import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/stores/appStore'
import * as conceptQueries from '@/db/queries/concepts'
import * as linkQueries from '@/db/queries/links'
import type { Concept, MasteryLevel, CreateConcept, CreateLink, Link } from '@/types'

export function useConcepts() {
  const { isDbReady, refreshTrigger, masteryFilter } = useAppStore()
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchConcepts = useCallback(async () => {
    if (!isDbReady) return

    try {
      setLoading(true)
      let data: Concept[]

      if (masteryFilter === 'all') {
        data = await conceptQueries.getAllConcepts()
      } else {
        data = await conceptQueries.getConceptsByMastery(masteryFilter)
      }

      setConcepts(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching concepts:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [isDbReady, masteryFilter])

  useEffect(() => {
    fetchConcepts()
  }, [fetchConcepts, refreshTrigger])

  const getConceptById = useCallback(async (id: string): Promise<Concept | null> => {
    if (!isDbReady) return null
    try {
      return await conceptQueries.getConceptById(id)
    } catch (err) {
      console.error('Error getting concept:', err)
      return null
    }
  }, [isDbReady])

  const createConcept = useCallback(async (data: CreateConcept): Promise<Concept | null> => {
    try {
      const concept = await conceptQueries.createConcept(data)
      fetchConcepts()
      return concept
    } catch (err) {
      console.error('Error creating concept:', err)
      setError(err as Error)
      return null
    }
  }, [fetchConcepts])

  const updateConcept = useCallback(async (id: string, updates: Partial<Concept>): Promise<Concept | null> => {
    try {
      const concept = await conceptQueries.updateConcept(id, updates)
      fetchConcepts()
      return concept
    } catch (err) {
      console.error('Error updating concept:', err)
      setError(err as Error)
      return null
    }
  }, [fetchConcepts])

  const updateMastery = useCallback(async (id: string, mastery: MasteryLevel): Promise<Concept | null> => {
    try {
      const concept = await conceptQueries.updateMastery(id, mastery)
      fetchConcepts()
      return concept
    } catch (err) {
      console.error('Error updating mastery:', err)
      setError(err as Error)
      return null
    }
  }, [fetchConcepts])

  const deleteConcept = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await conceptQueries.deleteConcept(id)
      if (success) fetchConcepts()
      return success
    } catch (err) {
      console.error('Error deleting concept:', err)
      setError(err as Error)
      return false
    }
  }, [fetchConcepts])

  const createLink = useCallback(async (data: CreateLink): Promise<Link | null> => {
    try {
      const link = await linkQueries.createLink(data)
      fetchConcepts()
      return link
    } catch (err) {
      console.error('Error creating link:', err)
      setError(err as Error)
      return null
    }
  }, [fetchConcepts])

  const deleteLink = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await linkQueries.deleteLink(id)
      if (success) fetchConcepts()
      return success
    } catch (err) {
      console.error('Error deleting link:', err)
      setError(err as Error)
      return false
    }
  }, [fetchConcepts])

  const getConceptLinks = useCallback(async (conceptId: string): Promise<Link[]> => {
    if (!isDbReady) return []
    try {
      return await conceptQueries.getConceptLinks(conceptId)
    } catch (err) {
      console.error('Error getting concept links:', err)
      return []
    }
  }, [isDbReady])

  const searchConcepts = useCallback(async (query: string): Promise<Concept[]> => {
    if (!isDbReady || !query.trim()) return []
    try {
      return await conceptQueries.searchConcepts(query)
    } catch (err) {
      console.error('Error searching concepts:', err)
      return []
    }
  }, [isDbReady])

  const getCounts = useCallback(async () => {
    if (!isDbReady) return null
    try {
      return await conceptQueries.getConceptCounts()
    } catch (err) {
      console.error('Error getting concept counts:', err)
      return null
    }
  }, [isDbReady])

  const getConceptsWithoutPrerequisites = useCallback(async (): Promise<Concept[]> => {
    if (!isDbReady) return []
    try {
      return await conceptQueries.getConceptsWithoutPrerequisites()
    } catch (err) {
      console.error('Error getting concepts without prerequisites:', err)
      return []
    }
  }, [isDbReady])

  const getConceptsWithoutExamples = useCallback(async (): Promise<Concept[]> => {
    if (!isDbReady) return []
    try {
      return await conceptQueries.getConceptsWithoutExamples()
    } catch (err) {
      console.error('Error getting concepts without examples:', err)
      return []
    }
  }, [isDbReady])

  const getGraphData = useCallback(async () => {
    if (!isDbReady) return { nodes: [], edges: [] }
    try {
      return await linkQueries.getGraphData()
    } catch (err) {
      console.error('Error getting graph data:', err)
      return { nodes: [], edges: [] }
    }
  }, [isDbReady])

  return {
    concepts,
    loading,
    error,
    getConceptById,
    createConcept,
    updateConcept,
    updateMastery,
    deleteConcept,
    createLink,
    deleteLink,
    getConceptLinks,
    searchConcepts,
    getCounts,
    getConceptsWithoutPrerequisites,
    getConceptsWithoutExamples,
    getGraphData,
    refresh: fetchConcepts,
  }
}
