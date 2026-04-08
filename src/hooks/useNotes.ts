import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/stores/appStore'
import * as noteQueries from '@/db/queries/notes'
import type { AtomicNote, CreateAtomicNote, NoteType } from '@/types'

export function useNotes() {
  const { isDbReady, refreshTrigger } = useAppStore()
  const [notes, setNotes] = useState<AtomicNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchNotes = useCallback(async () => {
    if (!isDbReady) return

    try {
      setLoading(true)
      const data = await noteQueries.getAllNotes()
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

  const getNoteById = useCallback(async (id: string): Promise<AtomicNote | null> => {
    if (!isDbReady) return null
    try {
      return await noteQueries.getNoteById(id)
    } catch (err) {
      console.error('Error getting note:', err)
      return null
    }
  }, [isDbReady])

  const createNote = useCallback(async (data: CreateAtomicNote): Promise<AtomicNote | null> => {
    try {
      const note = await noteQueries.createNote(data)
      fetchNotes()
      return note
    } catch (err) {
      console.error('Error creating note:', err)
      setError(err as Error)
      return null
    }
  }, [fetchNotes])

  const updateNote = useCallback(async (id: string, updates: Partial<AtomicNote>): Promise<AtomicNote | null> => {
    try {
      const note = await noteQueries.updateNote(id, updates)
      fetchNotes()
      return note
    } catch (err) {
      console.error('Error updating note:', err)
      setError(err as Error)
      return null
    }
  }, [fetchNotes])

  const markReviewed = useCallback(async (id: string): Promise<AtomicNote | null> => {
    try {
      const note = await noteQueries.markNoteReviewed(id)
      fetchNotes()
      return note
    } catch (err) {
      console.error('Error marking note reviewed:', err)
      setError(err as Error)
      return null
    }
  }, [fetchNotes])

  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await noteQueries.deleteNote(id)
      if (success) fetchNotes()
      return success
    } catch (err) {
      console.error('Error deleting note:', err)
      setError(err as Error)
      return false
    }
  }, [fetchNotes])

  const linkToConcept = useCallback(async (noteId: string, conceptId: string): Promise<void> => {
    try {
      await noteQueries.linkNoteToConcept(noteId, conceptId)
      fetchNotes()
    } catch (err) {
      console.error('Error linking note to concept:', err)
      setError(err as Error)
    }
  }, [fetchNotes])

  const unlinkFromConcept = useCallback(async (noteId: string, conceptId: string): Promise<void> => {
    try {
      await noteQueries.unlinkNoteFromConcept(noteId, conceptId)
      fetchNotes()
    } catch (err) {
      console.error('Error unlinking note from concept:', err)
      setError(err as Error)
    }
  }, [fetchNotes])

  const searchNotes = useCallback(async (query: string): Promise<AtomicNote[]> => {
    if (!isDbReady || !query.trim()) return []
    try {
      return await noteQueries.searchNotes(query)
    } catch (err) {
      console.error('Error searching notes:', err)
      return []
    }
  }, [isDbReady])

  const getRecentNotes = useCallback(async (limit: number = 10): Promise<AtomicNote[]> => {
    if (!isDbReady) return []
    try {
      return await noteQueries.getRecentNotes(limit)
    } catch (err) {
      console.error('Error getting recent notes:', err)
      return []
    }
  }, [isDbReady])

  const getNotesByType = useCallback(async (noteType: NoteType): Promise<AtomicNote[]> => {
    if (!isDbReady) return []
    try {
      return await noteQueries.getNotesByType(noteType)
    } catch (err) {
      console.error('Error getting notes by type:', err)
      return []
    }
  }, [isDbReady])

  const getCounts = useCallback(async () => {
    if (!isDbReady) return null
    try {
      return await noteQueries.getNoteCounts()
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
    getNotesByType,
    getCounts,
    refresh: fetchNotes,
  }
}
