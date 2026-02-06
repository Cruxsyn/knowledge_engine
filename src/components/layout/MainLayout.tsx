import { Outlet, useNavigate, useLocation } from 'react-router-dom'
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
  const navigate = useNavigate()
  const location = useLocation()

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+K or Cmd+K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        return
      }

      // Ctrl+Shift+N or Cmd+Shift+N for quick capture
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault()
        setQuickCaptureOpen(true)
        return
      }

      // Alt+key navigation shortcuts (work even in input fields)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'n': e.preventDefault(); navigate('/'); return
          case 'c': e.preventDefault(); navigate('/concepts'); return
          case 't': e.preventDefault(); navigate('/terminal'); return
          case 'm': e.preventDefault(); navigate('/math-viz'); return
        }
      }

      // N for new note (when not in an input)
      if (e.key === 'n' && !e.altKey && !e.ctrlKey && !e.metaKey && !isInputElement(e.target)) {
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
  }, [setQuickCaptureOpen, setSearchOpen, navigate])

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
        <div key={location.pathname} className="animate-page-in h-full flex flex-col">
          <Outlet />
        </div>
      </main>

      {/* Global modals */}
      <GlobalSearch />
      <QuickCapture />
      <ShareDialog />
    </div>
  )
}
