import { useEffect, useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { SharedConceptCard } from '@/components/share/SharedConceptCard'
import { SharedNoteCard } from '@/components/share/SharedNoteCard'
import { Badge } from '@/components/ui/badge'
import { decodeShareData, getEncodedFromHash } from '@/lib/share/decoder'
import type { SharePackage } from '@/types/share'
import { Loader2, AlertCircle, Lightbulb, FileText, Link2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function SharedViewPage() {
  const location = useLocation()
  const [shareData, setShareData] = useState<SharePackage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const encoded = getEncodedFromHash()

    if (!encoded) {
      setError('No share data found in URL')
      setLoading(false)
      return
    }

    const result = decodeShareData(encoded)

    if (result.success) {
      setShareData(result.package)
      setError(null)
    } else {
      setError(result.error)
      setShareData(null)
    }

    setLoading(false)
  }, [location.hash])

  // Build a map of concept names for displaying in notes
  const conceptNameMap = useMemo(() => {
    if (!shareData) return new Map<string, string>()
    return new Map(shareData.concepts.map(c => [c.id, c.name]))
  }, [shareData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-icon-gold mx-auto mb-4" />
          <p className="text-warm-gray">Loading shared content...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-oxide-red mx-auto mb-4" />
          <h2 className="text-xl font-serif text-parchment mb-2">
            Unable to Load Share
          </h2>
          <p className="text-warm-gray mb-4">{error}</p>
          <p className="text-sm text-warm-gray/70">
            The share link may be invalid, corrupted, or expired.
          </p>
        </div>
      </div>
    )
  }

  if (!shareData) {
    return null
  }

  const { concepts, notes, links, metadata, created_at } = shareData

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center border-b border-ash-stone/30 pb-6">
        {metadata.title && (
          <h1 className="text-2xl font-serif text-parchment mb-2">
            {metadata.title}
          </h1>
        )}
        {metadata.description && (
          <p className="text-warm-gray mb-4">{metadata.description}</p>
        )}
        <div className="flex items-center justify-center gap-4 text-sm text-warm-gray">
          <span className="flex items-center gap-1">
            <Lightbulb className="h-4 w-4" />
            {concepts.length} concept{concepts.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </span>
          {links.length > 0 && (
            <span className="flex items-center gap-1">
              <Link2 className="h-4 w-4" />
              {links.length} link{links.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-xs text-warm-gray/60 mt-2">
          Shared on {formatDate(created_at)}
        </p>
      </div>

      {/* Concepts Section */}
      {concepts.length > 0 && (
        <section>
          <h2 className="text-lg font-serif text-parchment mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-icon-gold" />
            Concepts
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {concepts.map((concept) => (
              <SharedConceptCard key={concept.id} concept={concept} />
            ))}
          </div>
        </section>
      )}

      {/* Relationships Section */}
      {links.length > 0 && (
        <section>
          <h2 className="text-lg font-serif text-parchment mb-4 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-deep-azure" />
            Relationships
          </h2>
          <div className="space-y-2">
            {links.map((link, idx) => {
              const sourceName = conceptNameMap.get(link.source_id) || link.source_id
              const targetName = conceptNameMap.get(link.target_id) || link.target_id

              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg bg-charcoal-slate/50 border border-ash-stone/30"
                >
                  <span className="text-sm text-parchment font-medium">
                    {sourceName}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {link.relationship.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-sm text-parchment font-medium">
                    {targetName}
                  </span>
                  {link.reason && (
                    <span className="text-xs text-warm-gray ml-auto">
                      — {link.reason}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Notes Section */}
      {notes.length > 0 && (
        <section>
          <h2 className="text-lg font-serif text-parchment mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-verdigris" />
            Notes
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {notes.map((note) => (
              <div key={note.id}>
                <SharedNoteCard note={note} />
                {note.concept_ids.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {note.concept_ids.map((conceptId) => (
                      <span
                        key={conceptId}
                        className="text-xs px-2 py-0.5 bg-deep-azure/20 text-deep-azure rounded-full"
                      >
                        {conceptNameMap.get(conceptId) || conceptId}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
