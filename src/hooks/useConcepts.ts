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

  const fetchConcepts = useCallback(() => {
    if (!isDbReady) return

    try {
      setLoading(true)
      let data: Concept[]
      
      if (masteryFilter === 'all') {
        data = conceptQueries.getAllConcepts()
      } else {
        data = conceptQueries.getConceptsByMastery(masteryFilter)
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

  const getConceptById = useCallback((id: string): Concept | null => {
    if (!isDbReady) return null
    try {
      return conceptQueries.getConceptById(id)
    } catch (err) {
      console.error('Error getting concept:', err)
      return null
    }
  }, [isDbReady])

  const createConcept = useCallback((data: CreateConcept): Concept | null => {
    try {
      const concept = conceptQueries.createConcept(data)
      fetchConcepts()
      return concept
    } catch (err) {
      console.error('Error creating concept:', err)
      setError(err as Error)
      return null
    }
  }, [fetchConcepts])

  const updateConcept = useCallback((id: string, updates: Partial<Concept>): Concept | null => {
    try {
      const concept = conceptQueries.updateConcept(id, updates)
      fetchConcepts()
      return concept
    } catch (err) {
      console.error('Error updating concept:', err)
      setError(err as Error)
      return null
    }
  }, [fetchConcepts])

  const updateMastery = useCallback((id: string, mastery: MasteryLevel): Concept | null => {
    try {
      const concept = conceptQueries.updateMastery(id, mastery)
      fetchConcepts()
      return concept
    } catch (err) {
      console.error('Error updating mastery:', err)
      setError(err as Error)
      return null
    }
  }, [fetchConcepts])

  const deleteConcept = useCallback((id: string): boolean => {
    try {
      const success = conceptQueries.deleteConcept(id)
      if (success) fetchConcepts()
      return success
    } catch (err) {
      console.error('Error deleting concept:', err)
      setError(err as Error)
      return false
    }
  }, [fetchConcepts])

  const createLink = useCallback((data: CreateLink): Link | null => {
    try {
      const link = linkQueries.createLink(data)
      fetchConcepts()
      return link
    } catch (err) {
      console.error('Error creating link:', err)
      setError(err as Error)
      return null
    }
  }, [fetchConcepts])

  const deleteLink = useCallback((id: string): boolean => {
    try {
      const success = linkQueries.deleteLink(id)
      if (success) fetchConcepts()
      return success
    } catch (err) {
      console.error('Error deleting link:', err)
      setError(err as Error)
      return false
    }
  }, [fetchConcepts])

  const getConceptLinks = useCallback((conceptId: string): Link[] => {
    if (!isDbReady) return []
    try {
      return conceptQueries.getConceptLinks(conceptId)
    } catch (err) {
      console.error('Error getting concept links:', err)
      return []
    }
  }, [isDbReady])

  const searchConcepts = useCallback((query: string): Concept[] => {
    if (!isDbReady || !query.trim()) return []
    try {
      return conceptQueries.searchConcepts(query)
    } catch (err) {
      console.error('Error searching concepts:', err)
      return []
    }
  }, [isDbReady])

  const getCounts = useCallback(() => {
    if (!isDbReady) return null
    try {
      return conceptQueries.getConceptCounts()
    } catch (err) {
      console.error('Error getting concept counts:', err)
      return null
    }
  }, [isDbReady])

  const getConceptsWithoutPrerequisites = useCallback((): Concept[] => {
    if (!isDbReady) return []
    try {
      return conceptQueries.getConceptsWithoutPrerequisites()
    } catch (err) {
      console.error('Error getting concepts without prerequisites:', err)
      return []
    }
  }, [isDbReady])

  const getConceptsWithoutExamples = useCallback((): Concept[] => {
    if (!isDbReady) return []
    try {
      return conceptQueries.getConceptsWithoutExamples()
    } catch (err) {
      console.error('Error getting concepts without examples:', err)
      return []
    }
  }, [isDbReady])

  const getGraphData = useCallback(() => {
    if (!isDbReady) return { nodes: [], edges: [] }
    try {
      return linkQueries.getGraphData()
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
