import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, CheckCircle, Circle } from 'lucide-react'
import type { Lesson } from '@/types'

interface LessonFooterProps {
  lesson: Lesson
  isCompleted: boolean
  previousLesson?: Lesson | null
  nextLesson?: Lesson | null
  onPrevious?: () => void
  onNext?: () => void
  onToggleComplete: () => void
}

export function LessonFooter({
  isCompleted,
  previousLesson,
  nextLesson,
  onPrevious,
  onNext,
  onToggleComplete,
}: LessonFooterProps) {
  return (
    <div className="mt-16 pt-6 border-t border-ash-stone/30">
      {/* Mark complete */}
      <div className="flex justify-center mb-8">
        <Button
          variant={isCompleted ? 'outline' : 'default'}
          onClick={onToggleComplete}
          className="gap-2"
        >
          {isCompleted ? (
            <>
              <CheckCircle className="h-4 w-4 text-verdigris" />
              <span>Completed</span>
            </>
          ) : (
            <>
              <Circle className="h-4 w-4" />
              <span>Mark as Complete</span>
            </>
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {previousLesson ? (
          <button
            onClick={onPrevious}
            className="flex items-center gap-2 text-sm text-warm-gray hover:text-parchment transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-wider text-warm-gray/50">Previous</div>
              <div>{previousLesson.title}</div>
            </div>
          </button>
        ) : (
          <div />
        )}

        {nextLesson ? (
          <button
            onClick={onNext}
            className="flex items-center gap-2 text-sm text-warm-gray hover:text-parchment transition-colors"
          >
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-warm-gray/50">Next</div>
              <div>{nextLesson.title}</div>
            </div>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  )
}
