import { useNotes } from '@/hooks/useNotes'
import { NoteCard } from './NoteCard'
import { Loader2, FileText } from 'lucide-react'
import type { NoteType } from '@/types'

interface NoteListProps {
  viewMode: 'all' | NoteType
}

export function NoteList({ viewMode }: NoteListProps) {
  const { notes, loading, error, getNotesByType } = useNotes()

  let displayNotes = notes

  if (viewMode !== 'all') {
    displayNotes = getNotesByType(viewMode)
  }

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
        <p>Failed to load notes</p>
        <p className="text-sm text-warm-gray mt-2">{error.message}</p>
      </div>
    )
  }

  if (displayNotes.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-warm-gray/50 mb-4" />
        <h3 className="text-lg font-medium text-parchment mb-2">
          {viewMode === 'all' ? 'No notes yet' : `No ${viewMode} notes`}
        </h3>
        <p className="text-warm-gray">
          {viewMode === 'all'
            ? 'Create your first atomic note by distilling a capture'
            : 'Keep building your knowledge base'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {displayNotes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  )
}
