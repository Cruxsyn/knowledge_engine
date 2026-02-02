import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FormattedText } from '@/components/ui/formatted-text'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SharedNote } from '@/types/share'
import { NOTE_TYPE_CONFIGS } from '@/types'

interface SharedNoteCardProps {
  note: SharedNote
}

export function SharedNoteCard({ note }: SharedNoteCardProps) {
  const typeConfig = NOTE_TYPE_CONFIGS.find(t => t.value === note.note_type)

  const renderConfidence = () => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <Star
            key={level}
            className={cn(
              "h-3 w-3",
              level <= note.confidence
                ? "fill-icon-gold text-icon-gold"
                : "text-ash-stone"
            )}
          />
        ))}
      </div>
    )
  }

  // Get content fields based on note type
  const renderContent = () => {
    const content = note.content as Record<string, string>
    const config = typeConfig

    if (!config) {
      return (
        <div className="text-sm text-parchment">
          <FormattedText>{JSON.stringify(content)}</FormattedText>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {config.fields.map((field) => {
          const value = content[field.name]
          if (!value) return null

          return (
            <div key={field.name}>
              <h4 className="text-xs font-medium text-warm-gray uppercase tracking-wide mb-1">
                {field.label}
              </h4>
              <div className="text-sm text-parchment">
                <FormattedText>{value}</FormattedText>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs shrink-0 capitalize">
                {typeConfig?.label || note.note_type}
              </Badge>
            </div>
            <CardTitle className="text-base">{note.title}</CardTitle>
          </div>
          {renderConfidence()}
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  )
}
