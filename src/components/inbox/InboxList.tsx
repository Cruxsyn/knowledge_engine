import { useCaptures } from '@/hooks/useCaptures'
import { CaptureCard } from './CaptureCard'
import { Loader2, Inbox } from 'lucide-react'

export function InboxList() {
  const { captures, loading, error } = useCaptures()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-icon-gold" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-oxide-red">
        <p>Failed to load captures</p>
        <p className="text-sm text-warm-gray mt-2">{error.message}</p>
      </div>
    )
  }

  if (captures.length === 0) {
    return (
      <div className="text-center py-12">
        <Inbox className="h-12 w-12 mx-auto text-warm-gray/50 mb-4" />
        <h3 className="text-lg font-medium text-parchment mb-2">No captures yet</h3>
        <p className="text-warm-gray">
          Press <kbd className="px-1.5 py-0.5 bg-ash-stone rounded text-xs">N</kbd> or click "Quick Capture" to add your first idea
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {captures.map((capture) => (
        <CaptureCard key={capture.id} capture={capture} />
      ))}
    </div>
  )
}
