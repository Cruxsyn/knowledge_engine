import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FormattedText } from '@/components/ui/formatted-text'
import { useAppStore } from '@/stores/appStore'
import { formatDate, truncate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { AtomicNote } from '@/types'
import { NOTE_TYPE_CONFIGS, getNoteDisplayText } from '@/types'

interface NoteCardProps {
  note: AtomicNote
}

export function NoteCard({ note }: NoteCardProps) {
  const { selectedNote, setSelectedNote } = useAppStore()
  const isSelected = selectedNote?.id === note.id

  const typeConfig = NOTE_TYPE_CONFIGS.find(t => t.value === note.note_type)
  const displayText = getNoteDisplayText(note)

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:border-ash-stone",
        isSelected && "border-icon-gold/50 bg-ash-stone/30"
      )}
      onClick={() => setSelectedNote(isSelected ? null : note)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs shrink-0 capitalize">
            {typeConfig?.label || note.note_type}
          </Badge>
        </div>
        <CardTitle className="text-base line-clamp-2">{note.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayText.secondary && (
          <div className="text-xs text-warm-gray/70 italic">
            <FormattedText inline>{truncate(displayText.secondary, 60)}</FormattedText>
          </div>
        )}
        
        <div className="text-sm text-warm-gray line-clamp-3">
          <FormattedText inline>{truncate(displayText.primary, 150)}</FormattedText>
        </div>

        <div className="text-xs text-warm-gray">
          {formatDate(note.created_at)}
        </div>

        {note.concepts && note.concepts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.concepts.slice(0, 3).map((concept) => (
              <span 
                key={concept.id}
                className="text-xs px-2 py-0.5 bg-deep-azure/20 text-deep-azure rounded-full"
              >
                {concept.name}
              </span>
            ))}
            {note.concepts.length > 3 && (
              <span className="text-xs text-warm-gray">
                +{note.concepts.length - 3} more
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
