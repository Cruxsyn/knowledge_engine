import { useState, useEffect } from 'react'
import { useLearning } from '@/hooks/useLearning'
import { PanelLeftClose, PanelLeftOpen, Check, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProgressBar } from './ProgressBar'
import { cn } from '@/lib/utils'
import type { LearningModule, Lesson, LessonProgress } from '@/types'

interface LearningGraphProps {
  pathId: string
  activeLessonId?: string
  onLessonSelect: (lessonId: string) => void
  className?: string
}

interface ModuleWithLessons {
  module: LearningModule
  lessons: { lesson: Lesson; progress: LessonProgress | null }[]
}

export function LearningGraph({ pathId, activeLessonId, onLessonSelect, className }: LearningGraphProps) {
  const { getModulesByPath, getLessonsByModule, getProgress, getPathProgress } = useLearning()
  const [collapsed, setCollapsed] = useState(false)
  const [progress, setProgress] = useState<{ total: number; completed: number; percentage: number }>({ total: 0, completed: 0, percentage: 0 })
  const [modulesWithLessons, setModulesWithLessons] = useState<ModuleWithLessons[]>([])

  useEffect(() => {
    getPathProgress(pathId).then(setProgress)
  }, [pathId, getPathProgress])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const mods = await getModulesByPath(pathId)
      const result: ModuleWithLessons[] = []
      for (const mod of mods) {
        const lessons = await getLessonsByModule(mod.id)
        const lessonsWithProgress: { lesson: Lesson; progress: LessonProgress | null }[] = []
        for (const lesson of lessons) {
          const prog = await getProgress(lesson.id)
          lessonsWithProgress.push({ lesson, progress: prog })
        }
        result.push({ module: mod, lessons: lessonsWithProgress })
      }
      if (!cancelled) setModulesWithLessons(result)
    }
    load()
    return () => { cancelled = true }
  }, [pathId, getModulesByPath, getLessonsByModule, getProgress])

  return (
    <div className={cn(
      'flex flex-col border-r border-ash-stone/20 transition-all duration-300 h-full',
      collapsed ? 'w-12' : 'w-72',
      className
    )}
    style={{ backgroundColor: '#0a0a0a' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-ash-stone/20 shrink-0">
        {!collapsed && (
          <span className="text-[10px] uppercase tracking-widest text-[#8a8a8f] font-light">
            Learning Map
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto h-7 w-7"
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Lesson list */}
      {!collapsed && (
        <>
          <nav className="flex-1 overflow-y-auto py-2">
            {modulesWithLessons.map(({ module: mod, lessons }) => {
              return (
                <div key={mod.id} className="mb-1">
                  {/* Module heading */}
                  <div className="px-4 py-2">
                    <span className="text-[10px] uppercase tracking-wider text-[#8a8a8f] font-medium">
                      {mod.title}
                    </span>
                  </div>

                  {/* Lessons */}
                  {lessons.map(({ lesson, progress: lessonProgress }) => {
                    const isActive = lesson.id === activeLessonId
                    const isCompleted = lessonProgress?.completed || false

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => onLessonSelect(lesson.id)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors',
                          isActive
                            ? 'bg-ash-stone/20 text-parchment'
                            : 'text-warm-gray hover:bg-ash-stone/10 hover:text-parchment',
                        )}
                      >
                        {/* Status indicator */}
                        <span className={cn(
                          'shrink-0 w-4 h-4 rounded-full flex items-center justify-center',
                          isCompleted
                            ? 'bg-verdigris/20'
                            : isActive
                              ? 'border border-icon-gold/50'
                              : 'border border-ash-stone/40',
                        )}>
                          {isCompleted && <Check className="w-2.5 h-2.5 text-verdigris" />}
                          {isActive && !isCompleted && <span className="w-1.5 h-1.5 rounded-full bg-icon-gold" />}
                        </span>

                        <span className="truncate flex-1">{lesson.title}</span>

                        {isActive && (
                          <ChevronRight className="w-3 h-3 text-warm-gray/40 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </nav>

          {/* Progress */}
          <div className="p-3 border-t border-ash-stone/20 shrink-0">
            <ProgressBar completed={progress.completed} total={progress.total} />
          </div>
        </>
      )}
    </div>
  )
}
