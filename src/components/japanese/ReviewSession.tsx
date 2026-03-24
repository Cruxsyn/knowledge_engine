import { useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useJapaneseStore } from '@/stores/japaneseStore'
import type { ReviewRating } from '@/stores/japaneseStore'
import { ReviewSummary } from './ReviewSummary'
import { SpeakButton, InlineSpeakButton } from './SpeakButton'

const RATING_CONFIG: {
  rating: ReviewRating
  label: string
  key: string
  color: string
  hoverColor: string
}[] = [
  { rating: 'again', label: 'Again', key: '1', color: 'border-oxide-red/50 text-oxide-red', hoverColor: 'hover:bg-oxide-red/10' },
  { rating: 'hard', label: 'Hard', key: '2', color: 'border-icon-gold/50 text-icon-gold', hoverColor: 'hover:bg-icon-gold/10' },
  { rating: 'good', label: 'Good', key: '3', color: 'border-verdigris/50 text-verdigris', hoverColor: 'hover:bg-verdigris/10' },
  { rating: 'easy', label: 'Easy', key: '4', color: 'border-deep-azure/50 text-deep-azure', hoverColor: 'hover:bg-deep-azure/10' },
]

export function ReviewSession() {
  const { session, startReviewSession, revealCard, rateCard, resetSession } = useJapaneseStore()
  const { cards, currentIndex, revealed, results, startTime, completed } = session

  // Start a new session on mount if there are no cards
  useEffect(() => {
    if (cards.length === 0 && !completed) {
      startReviewSession()
    }
  }, [cards.length, completed, startReviewSession])

  const currentCard = cards[currentIndex]
  const totalCards = cards.length
  const progressPct = totalCards > 0 ? (currentIndex / totalCards) * 100 : 0

  const handleRate = useCallback((rating: ReviewRating) => {
    if (!revealed) return
    rateCard(rating)
  }, [revealed, rateCard])

  const handleReveal = useCallback(() => {
    if (!revealed && currentCard) {
      revealCard()
    }
  }, [revealed, currentCard, revealCard])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't interfere with inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!revealed) {
          handleReveal()
        }
        return
      }

      if (revealed) {
        switch (e.key) {
          case '1': e.preventDefault(); handleRate('again'); return
          case '2': e.preventDefault(); handleRate('hard'); return
          case '3': e.preventDefault(); handleRate('good'); return
          case '4': e.preventDefault(); handleRate('easy'); return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [revealed, handleRate, handleReveal])

  // Summary screen
  if (completed) {
    const totalTimeMs = startTime ? Date.now() - startTime : 0
    return (
      <ReviewSummary
        results={results}
        totalTimeMs={totalTimeMs}
        onReviewAgain={() => {
          resetSession()
          startReviewSession()
        }}
      />
    )
  }

  // Loading / empty state
  if (!currentCard) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-warm-gray">Loading review session...</p>
      </div>
    )
  }

  // Card type label
  function getCardTypeLabel(type: string): string {
    switch (type) {
      case 'kanji_meaning': return 'Kanji \u2192 Meaning'
      case 'kanji_reading': return 'Kanji \u2192 Reading'
      case 'vocab_meaning': return 'Vocabulary \u2192 Meaning'
      case 'grammar': return 'Grammar Pattern'
      default: return 'Review'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar header */}
      <div className="px-6 py-4 border-b border-ash-stone/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-warm-gray">Review Progress</span>
          <span className="text-sm font-medium text-parchment">
            {currentIndex + 1} / {totalCards}
          </span>
        </div>
        <div className="h-2 bg-ash-stone/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-icon-gold rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Card */}
        <div
          className={cn(
            'w-full max-w-md border border-ash-stone/30 rounded-xl bg-charcoal-slate p-8',
            'flex flex-col items-center justify-center min-h-[240px]',
            'cursor-pointer select-none transition-all duration-200',
            !revealed && 'hover:border-icon-gold/30'
          )}
          onClick={handleReveal}
        >
          {/* Front content */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <div className={cn(
                'font-serif',
                currentCard.type === 'grammar' ? 'text-3xl' : 'text-5xl md:text-6xl',
                'text-parchment leading-tight'
              )}>
                {currentCard.front}
              </div>
              <SpeakButton text={currentCard.front} size="lg" />
            </div>

            {currentCard.frontLabel && (
              <div className="text-lg text-warm-gray">
                {currentCard.frontLabel}
              </div>
            )}

            {!revealed && (
              <div className="text-sm text-warm-gray/50 mt-4 pt-4 border-t border-ash-stone/20">
                tap to reveal &middot; space
              </div>
            )}
          </div>
        </div>

        {/* Card type indicator */}
        <div className="mt-3 text-center">
          <span className="text-xs text-warm-gray/60">
            {getCardTypeLabel(currentCard.type)} &middot; {currentCard.jlptLevel}
          </span>
        </div>

        {/* Answer area (revealed) */}
        {revealed && (
          <div className="w-full max-w-md mt-6 space-y-4 animate-page-in">
            {/* Divider */}
            <div className="h-px bg-ash-stone/30" />

            {/* Reading + Meaning */}
            <div className="text-center space-y-1">
              {currentCard.back.reading && (
                <div className="text-2xl text-parchment font-serif inline-flex items-center gap-2 justify-center w-full">
                  {currentCard.back.reading}
                  <InlineSpeakButton text={currentCard.back.reading} />
                </div>
              )}
              <div className="text-lg text-warm-gray">
                {currentCard.back.meaning}
              </div>
            </div>

            {/* Mnemonic */}
            {currentCard.back.mnemonic && (
              <div className="bg-ash-stone/30 rounded-lg p-3">
                <div className="text-xs text-warm-gray/60 mb-1 uppercase tracking-wider">Mnemonic</div>
                <div className="text-sm text-parchment/90">{currentCard.back.mnemonic}</div>
              </div>
            )}

            {/* Components */}
            {currentCard.back.components && (
              <div className="text-center">
                <span className="text-xs text-warm-gray/60 uppercase tracking-wider">Components: </span>
                <span className="text-sm text-warm-gray">{currentCard.back.components}</span>
              </div>
            )}

            {/* Example */}
            {currentCard.back.example && (
              <div className="bg-ash-stone/30 rounded-lg p-3">
                <div className="text-xs text-warm-gray/60 mb-1 uppercase tracking-wider">Example</div>
                <div className="text-sm text-parchment/90">{currentCard.back.example}</div>
              </div>
            )}

            {/* Rating buttons */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {RATING_CONFIG.map(({ rating, label, key, color, hoverColor }) => (
                <Button
                  key={rating}
                  variant="outline"
                  className={cn(
                    'flex flex-col items-center gap-1 h-auto py-3',
                    color,
                    hoverColor
                  )}
                  onClick={() => handleRate(rating)}
                >
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs opacity-60">
                    {currentCard.intervals[rating]}
                  </span>
                  <span className="text-[10px] opacity-40">{key}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
