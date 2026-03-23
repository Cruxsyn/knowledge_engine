import { X, BookOpen, Plus, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { JpTokenizedWord, JpMasteryLevel } from '@/types'

interface WordPopupProps {
  word: JpTokenizedWord
  position: { x: number; y: number }
  onClose: () => void
  onMarkKnown: (lemma: string) => void
  onAddToSrs: (lemma: string) => void
  onViewInWeb: (lemma: string) => void
}

const MASTERY_LABELS: Record<JpMasteryLevel, string> = {
  unknown: 'Unknown',
  seen: 'Seen',
  learning: 'Learning',
  known: 'Known',
  mastered: 'Mastered',
}

const MASTERY_COLORS: Record<JpMasteryLevel, string> = {
  unknown: 'text-oxide-red',
  seen: 'text-warm-gray',
  learning: 'text-icon-gold',
  known: 'text-parchment',
  mastered: 'text-verdigris',
}

export function WordPopup({
  word,
  position,
  onClose,
  onMarkKnown,
  onAddToSrs,
  onViewInWeb,
}: WordPopupProps) {
  return (
    <div
      className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        left: Math.min(position.x, window.innerWidth - 320),
        top: position.y + 8,
      }}
    >
      <div className="w-[300px] bg-charcoal-slate border border-ash-stone/50 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl text-parchment font-medium">
                {word.surface}
              </span>
              {word.reading && word.reading !== word.surface && (
                <span className="text-sm text-warm-gray">
                  ({word.reading})
                </span>
              )}
            </div>
            {word.lemma !== word.surface && (
              <div className="text-xs text-warm-gray/60 mt-0.5">
                dict: {word.lemma}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Meaning */}
        {word.meaning && (
          <div className="px-4 pb-2">
            <p className="text-sm text-parchment/90">{word.meaning}</p>
          </div>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
          {word.jlpt && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-icon-gold/40 text-icon-gold">
              {word.jlpt}
            </Badge>
          )}
          {word.pos && (
            <span className="text-xs text-warm-gray/70">{word.pos}</span>
          )}
          <span className="text-xs text-warm-gray/40 mx-1">|</span>
          <span className={cn('text-xs font-medium', MASTERY_COLORS[word.mastery])}>
            {MASTERY_LABELS[word.mastery]}
          </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-ash-stone/30" />

        {/* Actions */}
        <div className="flex items-center gap-1 p-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs text-warm-gray hover:text-parchment"
            onClick={() => onMarkKnown(word.lemma)}
          >
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Mark Known
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs text-warm-gray hover:text-parchment"
            onClick={() => onAddToSrs(word.lemma)}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add to SRS
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs text-warm-gray hover:text-parchment"
            onClick={() => onViewInWeb(word.lemma)}
          >
            <Globe className="h-3.5 w-3.5 mr-1.5" />
            Web
          </Button>
        </div>
      </div>
    </div>
  )
}
