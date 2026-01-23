import { useState, useCallback } from 'react'
import { useAppStore } from '@/stores/appStore'
import * as captureQueries from '@/db/queries/captures'
import * as noteQueries from '@/db/queries/notes'
import * as conceptQueries from '@/db/queries/concepts'
import type { Capture, AtomicNote, Concept } from '@/types'

export interface SearchResult {
  type: 'capture' | 'note' | 'concept'
  id: string
  title: string
  subtitle?: string
  item: Capture | AtomicNote | Concept
}

export function useSearch() {
  const { isDbReady, searchQuery, setSearchQuery, searchOpen, setSearchOpen } = useAppStore()
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback((query: string) => {
    if (!isDbReady || !query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    
    try {
      const searchResults: SearchResult[] = []
      
      // Search captures
      const captures = captureQueries.searchCaptures(query)
      for (const capture of captures) {
        searchResults.push({
          type: 'capture',
          id: capture.id,
          title: capture.title,
          subtitle: `Capture - ${capture.status}`,
          item: capture,
        })
      }
      
      // Search notes
      const notes = noteQueries.searchNotes(query)
      for (const note of notes) {
        searchResults.push({
          type: 'note',
          id: note.id,
          title: note.title,
          subtitle: `${note.note_type} - Confidence: ${note.confidence}/5`,
          item: note,
        })
      }
      
      // Search concepts
      const concepts = conceptQueries.searchConcepts(query)
      for (const concept of concepts) {
        searchResults.push({
          type: 'concept',
          id: concept.id,
          title: concept.name,
          subtitle: `Concept - ${concept.mastery}`,
          item: concept,
        })
      }
      
      setResults(searchResults)
    } catch (err) {
      console.error('Search error:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [isDbReady])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    search(query)
  }, [search, setSearchQuery])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setResults([])
  }, [setSearchQuery])

  const openSearch = useCallback(() => {
    setSearchOpen(true)
  }, [setSearchOpen])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    clearSearch()
  }, [setSearchOpen, clearSearch])

  return {
    query: searchQuery,
    results,
    loading,
    isOpen: searchOpen,
    search: handleSearch,
    clear: clearSearch,
    open: openSearch,
    close: closeSearch,
  }
}
