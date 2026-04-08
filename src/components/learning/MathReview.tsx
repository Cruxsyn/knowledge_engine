import { useState, useCallback, useEffect } from 'react'
import { FormattedText } from '@/components/ui/formatted-text'
import { Button } from '@/components/ui/button'
import { Eye, ThumbsUp, ThumbsDown, SkipForward, Loader2 } from 'lucide-react'
import { getDueMathSrsCards, reviewMathSrsCard } from '@/db/queries/learning'
import type { MathSrsCard } from '@/db/queries/learning'

interface MathReviewProps {
  pathId?: string
}

export function MathReview({ pathId }: MathReviewProps) {
  const [cards, setCards] = useState<MathSrsCard[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const dueCards = await getDueMathSrsCards(pathId, 50)
        setCards(dueCards)
      } catch (err) {
        console.error('Failed to load SRS cards:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [pathId])

  const currentCard = cards[currentIdx]

  const rate = useCallback(async (correct: boolean) => {
    if (!currentCard) return

    // Simple SRS scheduling
    const now = new Date()
    let nextDue: Date
    const newReps = currentCard.reps + 1

    if (correct) {
      // Good: schedule further out based on reps
      const days = Math.max(1, Math.pow(2, newReps - 1)) // 1, 1, 2, 4, 8...
      nextDue = new Date(now.getTime() + days * 86400000)
    } else {
      // Again: review soon
      nextDue = new Date(now.getTime() + 600000) // 10 minutes
    }

    await reviewMathSrsCard(currentCard.id, {
      stability: correct ? currentCard.stability + 1 : Math.max(0, currentCard.stability - 0.5),
      difficulty: correct ? Math.max(0, currentCard.difficulty - 0.1) : Math.min(1, currentCard.difficulty + 0.2),
      reps: newReps,
      lapses: correct ? currentCard.lapses : currentCard.lapses + 1,
      state: correct ? 2 : 1,
      due: nextDue.toISOString(),
    })

    setCompleted(prev => new Set([...prev, currentCard.id]))
    setShowAnswer(false)
    if (currentIdx < cards.length - 1) {
      setCurrentIdx(currentIdx + 1)
    }
  }, [currentCard, currentIdx, cards.length])

  const skip = useCallback(() => {
    setShowAnswer(false)
    if (currentIdx < cards.length - 1) {
      setCurrentIdx(currentIdx + 1)
    }
  }, [currentIdx, cards.length])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-warm-gray" />
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <h2 className="text-xl font-serif text-parchment mb-2">No Cards Due</h2>
        <p className="text-warm-gray text-sm">All caught up! Start learning to generate review cards.</p>
      </div>
    )
  }

  if (completed.size >= cards.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <h2 className="text-2xl font-serif text-parchment mb-2">Review Complete</h2>
        <p className="text-warm-gray mb-4">You reviewed {cards.length} math cards.</p>
        <Button variant="gold" onClick={() => { setCompleted(new Set()); setCurrentIdx(0) }}>
          Review Again
        </Button>
      </div>
    )
  }

  const TYPE_LABELS: Record<string, string> = {
    theorem: 'Theorem Recall',
    proof_step: 'Proof Step',
    computation: 'Compute',
    definition: 'Definition',
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-ash-stone/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-icon-gold transition-all duration-300"
            style={{ width: `${(completed.size / cards.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-warm-gray font-mono">{completed.size}/{cards.length}</span>
      </div>

      {/* Card */}
      {currentCard && (
        <div className="border border-ash-stone/50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-charcoal-slate/50 border-b border-ash-stone/30">
            <span className="text-xs uppercase tracking-wider text-warm-gray/50">
              {TYPE_LABELS[currentCard.card_type] || currentCard.card_type}
            </span>
          </div>

          <div className="p-6">
            <FormattedText>{currentCard.question}</FormattedText>
          </div>

          {showAnswer && (
            <div className="p-6 border-t border-ash-stone/30 bg-obsidian/30">
              <FormattedText>{currentCard.answer}</FormattedText>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        {!showAnswer ? (
          <Button variant="gold" onClick={() => setShowAnswer(true)}>
            <Eye className="h-4 w-4 mr-2" /> Show Answer
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => rate(false)} className="text-oxide-red border-oxide-red/30">
              <ThumbsDown className="h-4 w-4 mr-1" /> Again
            </Button>
            <Button variant="outline" onClick={() => rate(true)} className="text-green-500 border-green-500/30">
              <ThumbsUp className="h-4 w-4 mr-1" /> Got It
            </Button>
          </>
        )}
        <Button variant="ghost" size="sm" onClick={skip}>
          <SkipForward className="h-4 w-4 mr-1" /> Skip
        </Button>
      </div>
    </div>
  )
}
