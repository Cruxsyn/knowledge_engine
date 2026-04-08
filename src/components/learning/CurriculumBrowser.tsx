import { useState, useEffect } from 'react'
import { useLearning } from '@/hooks/useLearning'
import { BookOpen, CheckCircle, Clock, Brain, Calculator, BarChart3, Network, Layers } from 'lucide-react'

interface CurriculumInfo {
  pathId: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  prerequisites: string[]
  tags: string[]
}

const CURRICULUM_METADATA: CurriculumInfo[] = [
  {
    pathId: 'path-linear-algebra',
    title: 'Linear Algebra Foundations',
    description: 'Vectors, matrices, eigendecomposition, and SVD — the language of neural networks.',
    icon: Layers,
    color: '#8b5cf6',
    prerequisites: [],
    tags: ['vectors', 'matrices', 'eigenvalues', 'PCA'],
  },
  {
    pathId: 'path-calculus-ml',
    title: 'Calculus for Machine Learning',
    description: 'Gradients, optimization, and gradient descent — how neural networks learn.',
    icon: Calculator,
    color: '#e8b714',
    prerequisites: ['path-linear-algebra'],
    tags: ['gradients', 'optimization', 'backprop'],
  },
  {
    pathId: 'path-probability',
    title: 'Probability & Statistics',
    description: 'Distributions, Bayes theorem, MLE, and information theory — the foundation of ML.',
    icon: BarChart3,
    color: '#22c55e',
    prerequisites: [],
    tags: ['distributions', 'Bayes', 'entropy', 'MLE'],
  },
  {
    pathId: 'path-neural-networks',
    title: 'Neural Networks from Scratch',
    description: 'Build understanding from perceptrons to backpropagation — derive everything.',
    icon: Network,
    color: '#f97316',
    prerequisites: ['path-linear-algebra', 'path-calculus-ml'],
    tags: ['perceptron', 'backprop', 'loss functions', 'training'],
  },
  {
    pathId: 'path-deep-learning',
    title: 'Deep Learning Mathematics',
    description: 'Adam optimizer, CNNs, attention mechanisms, and transformers — cutting edge math.',
    icon: Brain,
    color: '#ec4899',
    prerequisites: ['path-neural-networks', 'path-probability'],
    tags: ['Adam', 'CNNs', 'attention', 'transformers'],
  },
]

export function CurriculumBrowser({ onSelectPath }: { onSelectPath: (pathId: string) => void }) {
  const { paths, getPathProgress } = useLearning()
  const [progress, setProgress] = useState<Record<string, { total: number; completed: number; percentage: number }>>({})

  useEffect(() => {
    async function loadProgress() {
      const p: Record<string, { total: number; completed: number; percentage: number }> = {}
      for (const path of paths) {
        p[path.id] = await getPathProgress(path.id)
      }
      setProgress(p)
    }
    if (paths.length > 0) loadProgress()
  }, [paths, getPathProgress])

  // Match DB paths to metadata
  const enrichedPaths = CURRICULUM_METADATA.map(meta => {
    const dbPath = paths.find(p => p.id === meta.pathId)
    const prog = progress[meta.pathId]
    return { ...meta, dbPath, progress: prog }
  })

  // Also show any paths not in metadata (e.g., user-imported)
  const otherPaths = paths.filter(p => !CURRICULUM_METADATA.find(m => m.pathId === p.id))

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-serif text-parchment mb-1">Math Curricula</h2>
        <p className="text-sm text-warm-gray">Master the mathematics behind neural networks — from fundamentals to transformers.</p>
      </div>

      {/* Curriculum grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enrichedPaths.map(curr => {
          const isAvailable = !!curr.dbPath
          const prog = curr.progress
          const prereqsMet = curr.prerequisites.every(pid => {
            const p = progress[pid]
            return p && p.percentage >= 50
          })

          return (
            <button
              key={curr.pathId}
              onClick={() => isAvailable && onSelectPath(curr.pathId)}
              disabled={!isAvailable}
              className={`text-left p-5 rounded-xl border transition-all ${
                isAvailable
                  ? 'border-ash-stone/40 hover:border-ash-stone/70 hover:bg-charcoal-slate/30 cursor-pointer'
                  : 'border-ash-stone/20 opacity-50 cursor-not-allowed'
              }`}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: curr.color + '20' }}
                >
                  <curr.icon className="h-5 w-5" style={{ color: curr.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-parchment text-sm">{curr.title}</h3>
                  {prog && prog.total > 0 && (
                    <span className="text-[10px] text-warm-gray/50">
                      {prog.completed}/{prog.total} lessons
                    </span>
                  )}
                </div>
                {prog && prog.percentage === 100 && (
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-warm-gray/70 mb-3 line-clamp-2">{curr.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {curr.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-ash-stone/20 text-warm-gray/60">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Progress bar */}
              {prog && prog.total > 0 && (
                <div className="h-1 bg-ash-stone/20 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${prog.percentage}%`,
                      backgroundColor: curr.color,
                    }}
                  />
                </div>
              )}

              {/* Prerequisites */}
              {curr.prerequisites.length > 0 && !prereqsMet && (
                <div className="mt-2 text-[10px] text-warm-gray/40 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Requires: {curr.prerequisites.map(pid => {
                    const meta = CURRICULUM_METADATA.find(m => m.pathId === pid)
                    return meta?.title.split(' ')[0] || pid
                  }).join(', ')}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* User-imported paths */}
      {otherPaths.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-warm-gray/50 uppercase tracking-wider mb-3">Other Paths</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherPaths.map(path => (
              <button
                key={path.id}
                onClick={() => onSelectPath(path.id)}
                className="text-left p-5 rounded-xl border border-ash-stone/40 hover:border-ash-stone/70 hover:bg-charcoal-slate/30 transition-all"
              >
                <div className="flex items-start gap-3 mb-2">
                  <BookOpen className="h-5 w-5 text-warm-gray/50" />
                  <h3 className="font-medium text-parchment text-sm">{path.title}</h3>
                </div>
                <p className="text-xs text-warm-gray/70 line-clamp-2">{path.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
