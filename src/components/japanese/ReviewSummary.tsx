import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CheckCircle2, RotateCcw, Home } from 'lucide-react'
import type { ReviewResult } from '@/stores/japaneseStore'

interface ReviewSummaryProps {
  results: ReviewResult[]
  totalTimeMs: number
  onReviewAgain: () => void
}

export function ReviewSummary({ results, totalTimeMs, onReviewAgain }: ReviewSummaryProps) {
  const navigate = useNavigate()

  const totalCards = results.length
  const counts = {
    again: results.filter((r) => r.rating === 'again').length,
    hard: results.filter((r) => r.rating === 'hard').length,
    good: results.filter((r) => r.rating === 'good').length,
    easy: results.filter((r) => r.rating === 'easy').length,
  }
  const accuracy = totalCards > 0
    ? Math.round(((counts.good + counts.easy) / totalCards) * 100)
    : 0

  const totalSeconds = Math.round(totalTimeMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const timeDisplay = minutes > 0
    ? `${minutes}m ${seconds}s`
    : `${seconds}s`

  const avgTimePerCard = totalCards > 0
    ? (totalTimeMs / totalCards / 1000).toFixed(1)
    : '0'

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <CheckCircle2 className="h-12 w-12 text-verdigris mx-auto" />
          <h2 className="text-2xl font-serif font-semibold text-parchment">
            Session Complete
          </h2>
          <p className="text-warm-gray">
            Great work! Here's how you did.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-parchment">{totalCards}</div>
              <div className="text-xs text-warm-gray mt-1">Cards Reviewed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className={cn(
                'text-2xl font-bold',
                accuracy >= 80 ? 'text-verdigris' : accuracy >= 60 ? 'text-icon-gold' : 'text-oxide-red'
              )}>
                {accuracy}%
              </div>
              <div className="text-xs text-warm-gray mt-1">Accuracy</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-parchment">{timeDisplay}</div>
              <div className="text-xs text-warm-gray mt-1">Total Time</div>
            </CardContent>
          </Card>
        </div>

        {/* Rating Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-parchment">Rating Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Again', count: counts.again, color: 'bg-oxide-red', textColor: 'text-oxide-red' },
              { label: 'Hard', count: counts.hard, color: 'bg-icon-gold/60', textColor: 'text-icon-gold' },
              { label: 'Good', count: counts.good, color: 'bg-verdigris', textColor: 'text-verdigris' },
              { label: 'Easy', count: counts.easy, color: 'bg-deep-azure', textColor: 'text-deep-azure' },
            ].map(({ label, count, color, textColor }) => {
              const pct = totalCards > 0 ? (count / totalCards) * 100 : 0
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className={cn('text-sm font-medium w-12', textColor)}>{label}</span>
                  <div className="flex-1 h-2 bg-ash-stone/60 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm text-warm-gray w-6 text-right">{count}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Extra stat */}
        <div className="text-center text-sm text-warm-gray">
          Average {avgTimePerCard}s per card
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="gold"
            size="lg"
            className="gap-2"
            onClick={onReviewAgain}
          >
            <RotateCcw className="h-4 w-4" />
            Review Again
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => navigate('/japanese')}
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
