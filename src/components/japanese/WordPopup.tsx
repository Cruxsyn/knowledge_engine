import type { JpTokenizedWord, JpMasteryLevel } from '@/types'
import { cn } from '@/lib/utils'
import { SpeakButton } from './SpeakButton'

interface WordPopupProps {
  word: JpTokenizedWord
  position: { x: number; y: number }
  onMarkKnown: (lemma: string) => void
  onAddToSrs: (lemma: string) => void
  onClose: () => void
}

const MASTERY_LABELS: Record<JpMasteryLevel, string> = {
  unknown: 'Unknown',
  seen: 'Seen',
  learning: 'Learning',
  known: 'Known',
  mastered: 'Mastered',
}

const MASTERY_COLORS: Record<JpMasteryLevel, string> = {
  unknown: 'text-warm-gray',
  seen: 'text-blue-400',
  learning: 'text-yellow-400',
  known: 'text-emerald-400',
  mastered: 'text-icon-gold',
}

export function WordPopup({ word, position, onMarkKnown, onAddToSrs, onClose }: WordPopupProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popup */}
      <div
        className="fixed z-50 bg-charcoal-slate border border-ash-stone/70 rounded-lg shadow-xl p-4 min-w-[240px] max-w-[320px]"
        style={{
          left: Math.min(position.x, window.innerWidth - 340),
          top: position.y + 8,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl font-serif text-parchment">{word.surface}</span>
          {word.reading && word.reading !== word.surface && (
            <span className="text-sm text-warm-gray">{word.reading}</span>
          )}
          <SpeakButton text={word.reading || word.surface} size="sm" />
        </div>

        {/* Lemma (if different from surface) */}
        {word.lemma !== word.surface && (
          <div className="text-xs text-warm-gray/60 mb-2">
            Dictionary form: <span className="text-warm-gray">{word.lemma}</span>
          </div>
        )}

        {/* Meaning */}
        {word.meaning && (
          <div className="text-sm text-parchment/80 mb-2">{word.meaning}</div>
        )}

        {/* Part of speech */}
        {word.pos && (
          <div className="text-xs text-warm-gray/50 mb-2">{word.pos}</div>
        )}

        {/* Mastery badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-warm-gray/50">Mastery:</span>
          <span className={cn('text-xs font-medium', MASTERY_COLORS[word.mastery])}>
            {MASTERY_LABELS[word.mastery]}
          </span>
          {word.jlpt && (
            <span className="text-xs bg-deep-azure/20 text-deep-azure px-1.5 py-0.5 rounded">
              {word.jlpt}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-ash-stone/50">
          <button
            className="flex-1 text-xs px-3 py-1.5 rounded bg-verdigris/20 text-verdigris hover:bg-verdigris/30 transition-colors"
            onClick={() => onMarkKnown(word.lemma)}
          >
            Mark Known
          </button>
          <button
            className="flex-1 text-xs px-3 py-1.5 rounded bg-deep-azure/20 text-deep-azure hover:bg-deep-azure/30 transition-colors"
            onClick={() => onAddToSrs(word.lemma)}
          >
            Add to SRS
          </button>
        </div>
      </div>
    </>
  )
}
