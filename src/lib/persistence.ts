import { get, set } from 'idb-keyval'

const DB_KEY = 'knowledge-engine-db'
const DB_FILENAME = 'knowledge.db'

/**
 * Check if OPFS (Origin Private File System) is available
 */
export function isOPFSAvailable(): boolean {
  return 'storage' in navigator && 'getDirectory' in navigator.storage
}

/**
 * Save database to OPFS with IndexedDB fallback
 */
export async function saveToStorage(data: Uint8Array): Promise<void> {
  if (isOPFSAvailable()) {
    try {
      const root = await navigator.storage.getDirectory()
      const fileHandle = await root.getFileHandle(DB_FILENAME, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(new Blob([data as BlobPart]))
      await writable.close()
      console.log('[Persistence] Saved to OPFS')
      return
    } catch (err) {
      console.warn('[Persistence] OPFS save failed, falling back to IndexedDB:', err)
    }
  }

  // Fallback to IndexedDB
  await set(DB_KEY, data)
  console.log('[Persistence] Saved to IndexedDB')
}

/**
 * Load database from OPFS with IndexedDB fallback
 */
export async function loadFromStorage(): Promise<Uint8Array | null> {
  if (isOPFSAvailable()) {
    try {
      const root = await navigator.storage.getDirectory()
      const fileHandle = await root.getFileHandle(DB_FILENAME)
      const file = await fileHandle.getFile()
      const buffer = await file.arrayBuffer()
      console.log('[Persistence] Loaded from OPFS')
      return new Uint8Array(buffer)
    } catch (err) {
      // File doesn't exist yet, that's OK
      if ((err as Error).name !== 'NotFoundError') {
        console.warn('[Persistence] OPFS load failed:', err)
      }
    }
  }

  // Fallback to IndexedDB
  const data = await get<Uint8Array>(DB_KEY)
  if (data) {
    console.log('[Persistence] Loaded from IndexedDB')
    return data
  }

  return null
}

/**
 * Export database as downloadable file
 */
export function downloadDatabase(data: Uint8Array, filename: string = 'knowledge-backup.db'): void {
  const blob = new Blob([data as BlobPart], { type: 'application/x-sqlite3' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Import database from file
 */
export async function importDatabase(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer()
  return new Uint8Array(buffer)
}
