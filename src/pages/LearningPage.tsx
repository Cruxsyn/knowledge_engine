import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { LearningGraph } from '@/components/learning/LearningGraph'
import { LessonReader } from '@/components/learning/LessonReader'
import { ImportPathDialog } from '@/components/learning/ImportPathDialog'
import { useLearning } from '@/hooks/useLearning'
import { Button } from '@/components/ui/button'
import { GraduationCap, Plus } from 'lucide-react'
import type { Lesson, LearningModule, LessonTerm, LearningPath } from '@/types'

export function LearningPage() {
  const { pathId, lessonId } = useParams<{ pathId?: string; lessonId?: string }>()
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const {
    paths,
    loading,
    getPathById,
    getModulesByPath,
    getAllLessonsByPath,
    getLessonById,
    getTermsByLesson,
    getProgress,
    markLessonComplete,
    saveScrollPosition,
    refresh,
  } = useLearning()

  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [currentModule, setCurrentModule] = useState<LearningModule | null>(null)
  const [lessonTerms, setLessonTerms] = useState<LessonTerm[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const getScrollContainer = useCallback(() => {
    return rootRef.current?.closest('main') as HTMLElement | null
  }, [])

  const [currentPath, setCurrentPath] = useState<LearningPath | null>(null)

  useEffect(() => {
    if (pathId) {
      getPathById(pathId).then(p => setCurrentPath(p))
    } else {
      setCurrentPath(paths[0] || null)
    }
  }, [pathId, paths, getPathById])

  const effectivePathId = currentPath?.id

  const [allLessons, setAllLessons] = useState<Lesson[]>([])
  const [modules, setModules] = useState<LearningModule[]>([])

  useEffect(() => {
    if (!effectivePathId) {
      setAllLessons([])
      setModules([])
      return
    }
    getAllLessonsByPath(effectivePathId).then(setAllLessons)
    getModulesByPath(effectivePathId).then(setModules)
  }, [effectivePathId, getAllLessonsByPath, getModulesByPath])

  useEffect(() => {
    if (lessonId) {
      (async () => {
        const lesson = await getLessonById(lessonId)
        setCurrentLesson(lesson)

        if (lesson) {
          const mod = modules.find(m => m.id === lesson.module_id)
          setCurrentModule(mod || null)
          const terms = await getTermsByLesson(lessonId)
          setLessonTerms(terms)

          const progress = await getProgress(lessonId)
          setIsCompleted(progress?.completed || false)
        }
      })()
    } else if (allLessons.length > 0 && effectivePathId) {
      navigate(`/learn/${effectivePathId}/${allLessons[0].id}`, { replace: true })
    }
  }, [lessonId, effectivePathId, allLessons, modules, getLessonById, getTermsByLesson, getProgress, navigate])

  useEffect(() => {
    if (!pathId && paths.length > 0 && !loading) {
      navigate(`/learn/${paths[0].id}`, { replace: true })
    }
  }, [pathId, paths, loading, navigate])

  useEffect(() => {
    const el = getScrollContainer()
    if (el) el.scrollTop = 0
  }, [lessonId, getScrollContainer])

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const el = getScrollContainer()
    if (!el || !lessonId) return

    const handleScroll = () => {
      const scrollTop = el.scrollTop
      const scrollHeight = el.scrollHeight - el.clientHeight
      if (scrollHeight > 0) {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => {
          saveScrollPosition(lessonId, scrollTop / scrollHeight)
        }, 1000)
      }
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [lessonId, saveScrollPosition, getScrollContainer])

  const currentIndex = allLessons.findIndex(l => l.id === lessonId)
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  const handleNavigate = useCallback((targetLessonId: string) => {
    if (effectivePathId) {
      navigate(`/learn/${effectivePathId}/${targetLessonId}`)
    }
  }, [effectivePathId, navigate])

  const handleToggleComplete = useCallback(() => {
    if (!lessonId) return
    if (!isCompleted) {
      markLessonComplete(lessonId)
      setIsCompleted(true)
    }
  }, [lessonId, isCompleted, markLessonComplete])

  const handleImported = useCallback((newPathId: string) => {
    refresh()
    navigate(`/learn/${newPathId}`)
  }, [refresh, navigate])

  const headerActions = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setImportOpen(true)}
      className="flex items-center gap-1.5"
    >
      <Plus className="h-3.5 w-3.5" />
      <span>Import Path</span>
    </Button>
  )

  if (loading) {
    return (
      <div ref={rootRef}>
        <Header title="Peak Learning" subtitle="Loading..." />
        <div className="flex items-center justify-center text-warm-gray h-[50vh]">
          Loading...
        </div>
      </div>
    )
  }

  if (paths.length === 0) {
    return (
      <div ref={rootRef}>
        <Header title="Peak Learning" subtitle="Structured learning paths" actions={headerActions} />
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <GraduationCap className="h-12 w-12 text-warm-gray/30 mx-auto mb-4" />
            <h2 className="text-lg font-serif text-parchment mb-2">No learning paths yet</h2>
            <p className="text-sm text-warm-gray mb-6">
              Use AI to generate a learning path on any topic.
            </p>
            <Button onClick={() => setImportOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Import Learning Path
            </Button>
          </div>
        </div>
        <ImportPathDialog open={importOpen} onOpenChange={setImportOpen} onImported={handleImported} />
      </div>
    )
  }

  return (
    <div ref={rootRef}>
      <Header
        title="Peak Learning"
        subtitle={currentPath?.title}
        actions={headerActions}
      />
      <div className="flex">
        {effectivePathId && (
          <div className="sticky top-0 self-start shrink-0 h-screen">
            <LearningGraph
              pathId={effectivePathId}
              activeLessonId={lessonId}
              onLessonSelect={handleNavigate}
            />
          </div>
        )}

        {currentLesson ? (
          <LessonReader
            lesson={currentLesson}
            module={currentModule || undefined}
            lessonTerms={lessonTerms}
            isCompleted={isCompleted}
            previousLesson={previousLesson}
            nextLesson={nextLesson}
            onNavigate={handleNavigate}
            onToggleComplete={handleToggleComplete}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <GraduationCap className="h-10 w-10 text-warm-gray/30 mx-auto mb-3" />
              <p className="text-sm text-warm-gray">Select a lesson from the learning map</p>
            </div>
          </div>
        )}
      </div>
      <ImportPathDialog open={importOpen} onOpenChange={setImportOpen} onImported={handleImported} />
    </div>
  )
}
