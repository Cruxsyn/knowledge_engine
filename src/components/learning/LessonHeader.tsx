import { Clock } from 'lucide-react'
import type { Lesson, LearningModule } from '@/types'

interface LessonHeaderProps {
  lesson: Lesson
  module?: LearningModule
}

export function LessonHeader({ lesson, module }: LessonHeaderProps) {
  return (
    <div className="mb-10">
      {module && (
        <p className="text-xs uppercase tracking-widest text-warm-gray/50 font-medium mb-3">
          {module.title}
        </p>
      )}
      <h1 className="text-3xl font-serif font-bold text-parchment leading-tight mb-2">
        {lesson.title}
      </h1>
      {lesson.subtitle && (
        <p className="text-lg text-warm-gray font-serif leading-relaxed">
          {lesson.subtitle}
        </p>
      )}
      {lesson.estimated_minutes && (
        <div className="flex items-center gap-1.5 mt-3 text-warm-gray/50 text-xs">
          <Clock className="h-3 w-3" />
          <span>{lesson.estimated_minutes} min read</span>
        </div>
      )}
      <hr className="mt-6 border-ash-stone/30" />
    </div>
  )
}
