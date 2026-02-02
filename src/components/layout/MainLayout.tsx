import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { useDatabase } from '@/hooks/useDatabase'
import { useAppStore } from '@/stores/appStore'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { QuickCapture } from '@/components/inbox/QuickCapture'
import { ShareDialog } from '@/components/share/ShareDialog'
import { Loader2 } from 'lucide-react'

export function MainLayout() {
  const { isReady, error } = useDatabase()
  const { setQuickCaptureOpen, setSearchOpen } = useAppStore()

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+K or Cmd+K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      
      // Ctrl+Shift+N or Cmd+Shift+N for quick capture
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault()
        setQuickCaptureOpen(true)
      }
      
      // N for new note (when not in an input)
      if (e.key === 'n' && !isInputElement(e.target)) {
        e.preventDefault()
        setQuickCaptureOpen(true)
      }
    }

    function isInputElement(target: EventTarget | null): boolean {
      if (!target) return false
      const tagName = (target as HTMLElement).tagName
      return tagName === 'INPUT' || tagName === 'TEXTAREA' || (target as HTMLElement).isContentEditable
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setQuickCaptureOpen, setSearchOpen])

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-obsidian">
        <div className="text-center p-8">
          <h1 className="text-2xl font-serif text-oxide-red mb-4">Database Error</h1>
          <p className="text-warm-gray mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-icon-gold text-obsidian rounded-md font-medium"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-obsidian">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-icon-gold mx-auto mb-4" />
          <p className="text-warm-gray">Initializing Knowledge Engine...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-obsidian">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>

      {/* Global modals */}
      <GlobalSearch />
      <QuickCapture />
      <ShareDialog />
    </div>
  )
}
