import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, Lightbulb, Inbox, X, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useSearch, type SearchResult } from '@/hooks/useSearch'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'

const typeIcons = {
  capture: Inbox,
  note: FileText,
  concept: Lightbulb,
}

const typeColors = {
  capture: 'text-deep-azure',
  note: 'text-verdigris',
  concept: 'text-icon-gold',
}

export function GlobalSearch() {
  const navigate = useNavigate()
  const { query, results, loading, isOpen, search, close } = useSearch()
  const { setSelectedCapture, setSelectedNote, setSelectedConcept } = useAppStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen])

  const handleSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'capture':
        setSelectedCapture(result.item as any)
        navigate('/')
        break
      case 'note':
        setSelectedNote(result.item as any)
        navigate('/notes')
        break
      case 'concept':
        setSelectedConcept(result.item as any)
        navigate('/concepts')
        break
    }
    close()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">Search</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-warm-gray" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search captures, notes, concepts..."
            className="pl-12 pr-10 py-6 text-lg border-0 border-b border-ash-stone/50 rounded-none focus-visible:ring-0"
          />
          {query && (
            <button
              onClick={() => search('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray hover:text-parchment"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-icon-gold" />
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="text-center p-8 text-warm-gray">
              No results found for "{query}"
            </div>
          )}

          {!loading && !query && (
            <div className="text-center p-8 text-warm-gray">
              Start typing to search...
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-1">
              {results.map((result) => {
                const Icon = typeIcons[result.type]
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left",
                      "hover:bg-ash-stone/50 transition-colors"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0", typeColors[result.type])} />
                    <div className="flex-1 min-w-0">
                      <p className="text-parchment truncate">{result.title}</p>
                      <p className="text-xs text-warm-gray truncate">{result.subtitle}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-ash-stone/50 text-xs text-warm-gray">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-ash-stone rounded text-[10px]">↵</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-ash-stone rounded text-[10px]">esc</kbd>
              <span>to close</span>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
