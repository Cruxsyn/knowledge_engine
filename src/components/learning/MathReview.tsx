import { useState, useCallback } from 'react'
import { FormattedText } from '@/components/ui/formatted-text'
import { Button } from '@/components/ui/button'
import { Eye, ThumbsUp, ThumbsDown, SkipForward } from 'lucide-react'

interface MathCard {
  id: string
  type: 'theorem' | 'proof_step' | 'computation' | 'definition'
  question: string // LaTeX
  answer: string // LaTeX
  conceptName?: string
}

// Sample math cards for demonstration
const SAMPLE_CARDS: MathCard[] = [
  {
    id: '1', type: 'theorem',
    question: 'State the **Chain Rule** for derivatives.',
    answer: '$$\\frac{d}{dx}[f(g(x))] = f\'(g(x)) \\cdot g\'(x)$$\n\nThe derivative of a composition is the outer derivative evaluated at the inner function, times the inner derivative.',
    conceptName: 'Chain Rule',
  },
  {
    id: '2', type: 'computation',
    question: 'Compute: $$\\frac{d}{dx}[\\sin(x^2)]$$',
    answer: 'Using the chain rule with $f(u) = \\sin(u)$ and $g(x) = x^2$:\n\n$$\\cos(x^2) \\cdot 2x = 2x\\cos(x^2)$$',
    conceptName: 'Chain Rule',
  },
  {
    id: '3', type: 'definition',
    question: 'What is the **gradient** $\\nabla f$ of a function $f: \\mathbb{R}^n \\to \\mathbb{R}$?',
    answer: '$$\\nabla f = \\left(\\frac{\\partial f}{\\partial x_1}, \\frac{\\partial f}{\\partial x_2}, \\ldots, \\frac{\\partial f}{\\partial x_n}\\right)$$\n\nThe vector of all partial derivatives. Points in the direction of steepest ascent.',
    conceptName: 'Gradient',
  },
  {
    id: '4', type: 'theorem',
    question: 'State the **Universal Approximation Theorem** (informal).',
    answer: 'A feedforward neural network with a single hidden layer containing a finite number of neurons can approximate any continuous function on a compact subset of $\\mathbb{R}^n$, given a non-constant, bounded, and continuous activation function.',
    conceptName: 'Neural Networks',
  },
]

export function MathReview() {
  const [cards] = useState<MathCard[]>(SAMPLE_CARDS)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  const currentCard = cards[currentIdx]

  const rate = useCallback((_correct: boolean) => {
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

  if (completed.size === cards.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className="text-2xl font-serif text-parchment mb-2">Review Complete</h2>
        <p className="text-warm-gray mb-4">You reviewed {cards.length} math cards.</p>
        <Button variant="gold" onClick={() => { setCompleted(new Set()); setCurrentIdx(0) }}>
          Review Again
        </Button>
      </div>
    )
  }

  const TYPE_LABELS = { theorem: 'Theorem Recall', proof_step: 'Proof Step', computation: 'Compute', definition: 'Definition' }

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
      <div className="border border-ash-stone/50 rounded-xl overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-4 py-2 bg-charcoal-slate/50 border-b border-ash-stone/30">
          <span className="text-xs uppercase tracking-wider text-warm-gray/50">{TYPE_LABELS[currentCard.type]}</span>
          {currentCard.conceptName && (
            <span className="text-xs text-icon-gold/70">{currentCard.conceptName}</span>
          )}
        </div>

        {/* Question */}
        <div className="p-6">
          <FormattedText>{currentCard.question}</FormattedText>
        </div>

        {/* Answer */}
        {showAnswer && (
          <div className="p-6 border-t border-ash-stone/30 bg-obsidian/30">
            <FormattedText>{currentCard.answer}</FormattedText>
          </div>
        )}
      </div>

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
