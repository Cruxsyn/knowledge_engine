import { useEffect, useState } from 'react'
import { initDatabase, exportDatabase, importDatabaseData } from '@/db/database'
import { downloadDatabase, importDatabase } from '@/lib/persistence'
import { useAppStore } from '@/stores/appStore'

export function useDatabase() {
  const { isDbReady, setDbReady } = useAppStore()
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        await initDatabase()
        if (mounted) {
          setDbReady(true)
        }
      } catch (err) {
        console.error('Failed to initialize database:', err)
        if (mounted) {
          setError(err as Error)
        }
      }
    }

    if (!isDbReady) {
      init()
    }

    return () => {
      mounted = false
    }
  }, [isDbReady, setDbReady])

  const exportDb = async () => {
    const data = await exportDatabase()
    const timestamp = new Date().toISOString().split('T')[0]
    downloadDatabase(data, `knowledge-backup-${timestamp}.db`)
  }

  const importDb = async (file: File) => {
    try {
      const data = await importDatabase(file)
      await importDatabaseData(data)
      // Trigger a refresh after import
      useAppStore.getState().triggerRefresh()
    } catch (err) {
      console.error('Failed to import database:', err)
      throw err
    }
  }

  return {
    isReady: isDbReady,
    error,
    exportDb,
    importDb,
  }
}
