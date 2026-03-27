import { LessonHeader } from './LessonHeader'
import { LessonFooter } from './LessonFooter'
import { LearningFormattedText } from './LearningFormattedText'
import type { Lesson, LearningModule, LessonTerm } from '@/types'

interface LessonReaderProps {
  lesson: Lesson
  module?: LearningModule
  lessonTerms: LessonTerm[]
  isCompleted: boolean
  previousLesson?: Lesson | null
  nextLesson?: Lesson | null
  onNavigate: (lessonId: string) => void
  onToggleComplete: () => void
}

export function LessonReader({
  lesson,
  module,
  lessonTerms,
  isCompleted,
  previousLesson,
  nextLesson,
  onNavigate,
  onToggleComplete,
}: LessonReaderProps) {
  return (
    <div className="flex-1 min-w-0">
      <div className="py-12 px-8 mx-auto max-w-[65ch]">
        <LessonHeader lesson={lesson} module={module} />

        <LearningFormattedText lessonTerms={lessonTerms}>
          {lesson.content}
        </LearningFormattedText>

        <LessonFooter
          lesson={lesson}
          isCompleted={isCompleted}
          previousLesson={previousLesson}
          nextLesson={nextLesson}
          onPrevious={previousLesson ? () => onNavigate(previousLesson.id) : undefined}
          onNext={nextLesson ? () => onNavigate(nextLesson.id) : undefined}
          onToggleComplete={onToggleComplete}
        />
      </div>
    </div>
  )
}
