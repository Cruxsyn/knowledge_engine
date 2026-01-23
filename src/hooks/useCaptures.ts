import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/stores/appStore'
import * as captureQueries from '@/db/queries/captures'
import type { Capture, CaptureStatus, CreateCapture } from '@/types'

export function useCaptures() {
  const { isDbReady, refreshTrigger, captureStatusFilter } = useAppStore()
  const [captures, setCaptures] = useState<Capture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCaptures = useCallback(() => {
    if (!isDbReady) return

    try {
      setLoading(true)
      let data: Capture[]
      
      if (captureStatusFilter === 'all') {
        data = captureQueries.getAllCaptures()
      } else {
        data = captureQueries.getCapturesByStatus(captureStatusFilter)
      }
      
      setCaptures(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching captures:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [isDbReady, captureStatusFilter])

  useEffect(() => {
    fetchCaptures()
  }, [fetchCaptures, refreshTrigger])

  const createCapture = useCallback((data: CreateCapture): Capture | null => {
    try {
      const capture = captureQueries.createCapture(data)
      fetchCaptures()
      return capture
    } catch (err) {
      console.error('Error creating capture:', err)
      setError(err as Error)
      return null
    }
  }, [fetchCaptures])

  const updateCapture = useCallback((id: string, updates: Partial<Capture>): Capture | null => {
    try {
      const capture = captureQueries.updateCapture(id, updates)
      fetchCaptures()
      return capture
    } catch (err) {
      console.error('Error updating capture:', err)
      setError(err as Error)
      return null
    }
  }, [fetchCaptures])

  const updateStatus = useCallback((id: string, status: CaptureStatus): Capture | null => {
    try {
      const capture = captureQueries.updateCaptureStatus(id, status)
      fetchCaptures()
      return capture
    } catch (err) {
      console.error('Error updating capture status:', err)
      setError(err as Error)
      return null
    }
  }, [fetchCaptures])

  const deleteCapture = useCallback((id: string): boolean => {
    try {
      const success = captureQueries.deleteCapture(id)
      if (success) fetchCaptures()
      return success
    } catch (err) {
      console.error('Error deleting capture:', err)
      setError(err as Error)
      return false
    }
  }, [fetchCaptures])

  const searchCaptures = useCallback((query: string): Capture[] => {
    if (!isDbReady || !query.trim()) return []
    try {
      return captureQueries.searchCaptures(query)
    } catch (err) {
      console.error('Error searching captures:', err)
      return []
    }
  }, [isDbReady])

  const getCounts = useCallback(() => {
    if (!isDbReady) return null
    try {
      return captureQueries.getCaptureCounts()
    } catch (err) {
      console.error('Error getting capture counts:', err)
      return null
    }
  }, [isDbReady])

  return {
    captures,
    loading,
    error,
    createCapture,
    updateCapture,
    updateStatus,
    deleteCapture,
    searchCaptures,
    getCounts,
    refresh: fetchCaptures,
  }
}
