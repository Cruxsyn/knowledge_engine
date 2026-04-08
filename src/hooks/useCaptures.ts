import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/stores/appStore'
import * as captureQueries from '@/db/queries/captures'
import type { Capture, CaptureStatus, CreateCapture } from '@/types'

export function useCaptures() {
  const { isDbReady, refreshTrigger, captureStatusFilter } = useAppStore()
  const [captures, setCaptures] = useState<Capture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCaptures = useCallback(async () => {
    if (!isDbReady) return

    try {
      setLoading(true)
      let data: Capture[]

      if (captureStatusFilter === 'all') {
        data = await captureQueries.getAllCaptures()
      } else {
        data = await captureQueries.getCapturesByStatus(captureStatusFilter)
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

  const createCapture = useCallback(async (data: CreateCapture): Promise<Capture | null> => {
    try {
      const capture = await captureQueries.createCapture(data)
      fetchCaptures()
      return capture
    } catch (err) {
      console.error('Error creating capture:', err)
      setError(err as Error)
      return null
    }
  }, [fetchCaptures])

  const updateCapture = useCallback(async (id: string, updates: Partial<Capture>): Promise<Capture | null> => {
    try {
      const capture = await captureQueries.updateCapture(id, updates)
      fetchCaptures()
      return capture
    } catch (err) {
      console.error('Error updating capture:', err)
      setError(err as Error)
      return null
    }
  }, [fetchCaptures])

  const updateStatus = useCallback(async (id: string, status: CaptureStatus): Promise<Capture | null> => {
    try {
      const capture = await captureQueries.updateCaptureStatus(id, status)
      fetchCaptures()
      return capture
    } catch (err) {
      console.error('Error updating capture status:', err)
      setError(err as Error)
      return null
    }
  }, [fetchCaptures])

  const deleteCapture = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await captureQueries.deleteCapture(id)
      if (success) fetchCaptures()
      return success
    } catch (err) {
      console.error('Error deleting capture:', err)
      setError(err as Error)
      return false
    }
  }, [fetchCaptures])

  const searchCaptures = useCallback(async (query: string): Promise<Capture[]> => {
    if (!isDbReady || !query.trim()) return []
    try {
      return await captureQueries.searchCaptures(query)
    } catch (err) {
      console.error('Error searching captures:', err)
      return []
    }
  }, [isDbReady])

  const getCounts = useCallback(async () => {
    if (!isDbReady) return null
    try {
      return await captureQueries.getCaptureCounts()
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
