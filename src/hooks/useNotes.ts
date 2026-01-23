import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/stores/appStore'
import * as noteQueries from '@/db/queries/notes'
import type { AtomicNote, CreateAtomicNote } from '@/types'

export function useNotes() {
  const { isDbReady, refreshTrigger } = useAppStore()
  const [notes, setNotes] = useState<AtomicNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchNotes = useCallback(() => {
    if (!isDbReady) return

    try {
      setLoading(true)
      const data = noteQueries.getAllNotes()
      setNotes(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching notes:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [isDbReady])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes, refreshTrigger])

  const getNoteById = useCallback((id: string): AtomicNote | null => {
    if (!isDbReady) return null
    try {
      return noteQueries.getNoteById(id)
    } catch (err) {
      console.error('Error getting note:', err)
      return null
    }
  }, [isDbReady])

  const createNote = useCallback((data: CreateAtomicNote): AtomicNote | null => {
    try {
      const note = noteQueries.createNote(data)
      fetchNotes()
      return note
    } catch (err) {
      console.error('Error creating note:', err)
      setError(err as Error)
      return null
    }
  }, [fetchNotes])

  const updateNote = useCallback((id: string, updates: Partial<AtomicNote>): AtomicNote | null => {
    try {
      const note = noteQueries.updateNote(id, updates)
      fetchNotes()
      return note
    } catch (err) {
      console.error('Error updating note:', err)
      setError(err as Error)
      return null
    }
  }, [fetchNotes])

  const markReviewed = useCallback((id: string): AtomicNote | null => {
    try {
      const note = noteQueries.markNoteReviewed(id)
      fetchNotes()
      return note
    } catch (err) {
      console.error('Error marking note reviewed:', err)
      setError(err as Error)
      return null
    }
  }, [fetchNotes])

  const deleteNote = useCallback((id: string): boolean => {
    try {
      const success = noteQueries.deleteNote(id)
      if (success) fetchNotes()
      return success
    } catch (err) {
      console.error('Error deleting note:', err)
      setError(err as Error)
      return false
    }
  }, [fetchNotes])

  const linkToConcept = useCallback((noteId: string, conceptId: string): void => {
    try {
      noteQueries.linkNoteToConcept(noteId, conceptId)
      fetchNotes()
    } catch (err) {
      console.error('Error linking note to concept:', err)
      setError(err as Error)
    }
  }, [fetchNotes])

  const unlinkFromConcept = useCallback((noteId: string, conceptId: string): void => {
    try {
      noteQueries.unlinkNoteFromConcept(noteId, conceptId)
      fetchNotes()
    } catch (err) {
      console.error('Error unlinking note from concept:', err)
      setError(err as Error)
    }
  }, [fetchNotes])

  const searchNotes = useCallback((query: string): AtomicNote[] => {
    if (!isDbReady || !query.trim()) return []
    try {
      return noteQueries.searchNotes(query)
    } catch (err) {
      console.error('Error searching notes:', err)
      return []
    }
  }, [isDbReady])

  const getRecentNotes = useCallback((limit: number = 10): AtomicNote[] => {
    if (!isDbReady) return []
    try {
      return noteQueries.getRecentNotes(limit)
    } catch (err) {
      console.error('Error getting recent notes:', err)
      return []
    }
  }, [isDbReady])

  const getLowConfidenceNotes = useCallback((): AtomicNote[] => {
    if (!isDbReady) return []
    try {
      return noteQueries.getNotesByConfidence(1, 2)
    } catch (err) {
      console.error('Error getting low confidence notes:', err)
      return []
    }
  }, [isDbReady])

  const getNotesNeedingReview = useCallback((): AtomicNote[] => {
    if (!isDbReady) return []
    try {
      return noteQueries.getNotesNeedingReview()
    } catch (err) {
      console.error('Error getting notes needing review:', err)
      return []
    }
  }, [isDbReady])

  const getCounts = useCallback(() => {
    if (!isDbReady) return null
    try {
      return noteQueries.getNoteCounts()
    } catch (err) {
      console.error('Error getting note counts:', err)
      return null
    }
  }, [isDbReady])

  return {
    notes,
    loading,
    error,
    getNoteById,
    createNote,
    updateNote,
    markReviewed,
    deleteNote,
    linkToConcept,
    unlinkFromConcept,
    searchNotes,
    getRecentNotes,
    getLowConfidenceNotes,
    getNotesNeedingReview,
    getCounts,
    refresh: fetchNotes,
  }
}
