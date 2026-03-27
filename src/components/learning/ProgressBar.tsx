import { cn } from '@/lib/utils'

interface ProgressBarProps {
  completed: number
  total: number
  className?: string
}

export function ProgressBar({ completed, total, className }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-[10px] text-warm-gray/60">
        <span>{completed}/{total} lessons</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-1 bg-ash-stone/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-verdigris rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
