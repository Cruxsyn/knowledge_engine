import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BookOpen, Sparkles, Globe, Flame } from 'lucide-react'
import type { DashboardStats } from '@/stores/japaneseStore'

// --- Sub-components ---

interface RadarChartProps {
  data: {
    vocabulary: number
    kanji: number
    grammar: number
    reading: number
    listening: number
  }
}

function RadarChart({ data }: RadarChartProps) {
  const dimensions = [
    { key: 'vocabulary' as const, label: 'Vocab' },
    { key: 'kanji' as const, label: 'Kanji' },
    { key: 'grammar' as const, label: 'Grammar' },
    { key: 'reading' as const, label: 'Reading' },
    { key: 'listening' as const, label: 'Listening' },
  ]

  const cx = 100
  const cy = 100
  const maxRadius = 75
  const levels = 5

  // Calculate polygon points for each level ring
  function getPoint(index: number, radius: number): [number, number] {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
  }

  function getLevelPolygon(level: number): string {
    const radius = (level / levels) * maxRadius
    return dimensions.map((_, i) => getPoint(i, radius).join(',')).join(' ')
  }

  // Data polygon
  const dataPoints = dimensions.map((dim, i) => {
    const value = data[dim.key]
    const radius = (value / levels) * maxRadius
    return getPoint(i, radius)
  })
  const dataPolygon = dataPoints.map((p) => p.join(',')).join(' ')

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full max-w-[220px] mx-auto">
      {/* Level rings */}
      {Array.from({ length: levels }, (_, i) => (
        <polygon
          key={i}
          points={getLevelPolygon(i + 1)}
          fill="none"
          stroke="currentColor"
          className="text-ash-stone/40"
          strokeWidth="0.5"
        />
      ))}

      {/* Axis lines */}
      {dimensions.map((_, i) => {
        const [x, y] = getPoint(i, maxRadius)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="currentColor"
            className="text-ash-stone/30"
            strokeWidth="0.5"
          />
        )
      })}

      {/* Data polygon */}
      <polygon
        points={dataPolygon}
        fill="currentColor"
        className="text-icon-gold/20"
        stroke="currentColor"
        strokeWidth="1.5"
        style={{ color: 'var(--color-icon-gold)' }}
      />
      <polygon
        points={dataPolygon}
        fill="none"
        stroke="var(--color-icon-gold)"
        strokeWidth="1.5"
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r="3"
          fill="var(--color-icon-gold)"
        />
      ))}

      {/* Labels */}
      {dimensions.map((dim, i) => {
        const labelRadius = maxRadius + 18
        const [x, y] = getPoint(i, labelRadius)
        return (
          <text
            key={dim.key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-warm-gray text-[9px]"
          >
            {dim.label}
          </text>
        )
      })}
    </svg>
  )
}

interface HeatMapProps {
  data: { date: string; intensity: number }[]
}

function HeatMap({ data }: HeatMapProps) {
  const cellSize = 11
  const gap = 2
  const totalSize = cellSize + gap

  // Organize into weeks (columns) with days as rows (0=Sun..6=Sat)
  // We show 13 weeks (91 days) of data
  const weeks: { date: string; intensity: number }[][] = []
  let currentWeek: { date: string; intensity: number }[] = []

  // Pad the start so the first entry aligns to its day-of-week
  if (data.length > 0) {
    const firstDate = new Date(data[0].date)
    const firstDay = firstDate.getDay()
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: '', intensity: -1 })
    }
  }

  for (const entry of data) {
    currentWeek.push(entry)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  function getColor(intensity: number): string {
    if (intensity < 0) return 'transparent'
    if (intensity === 0) return 'var(--color-ash-stone)'
    if (intensity === 1) return 'rgba(200,162,74,0.25)'
    if (intensity === 2) return 'rgba(200,162,74,0.45)'
    if (intensity === 3) return 'rgba(200,162,74,0.7)'
    return 'var(--color-icon-gold)'
  }

  const dayLabels = ['', 'M', '', 'W', '', 'F', '']

  return (
    <div className="flex gap-1 items-start">
      {/* Day labels */}
      <div className="flex flex-col mr-1" style={{ gap: `${gap}px` }}>
        {dayLabels.map((label, i) => (
          <div
            key={i}
            className="text-[9px] text-warm-gray/50 leading-none flex items-center"
            style={{ height: `${cellSize}px` }}
          >
            {label}
          </div>
        ))}
      </div>
      {/* Grid */}
      <div className="flex" style={{ gap: `${gap}px` }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col" style={{ gap: `${gap}px` }}>
            {week.map((day, di) => (
              <div
                key={di}
                className="rounded-[2px]"
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  backgroundColor: getColor(day.intensity),
                }}
                title={day.date ? `${day.date}: ${day.intensity} sessions` : ''}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

interface JLPTProgressProps {
  progress: Record<string, number>
}

function JLPTProgress({ progress }: JLPTProgressProps) {
  const levels = ['N5', 'N4', 'N3', 'N2', 'N1']

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      {levels.map((level) => {
        const pct = progress[level] ?? 0
        return (
          <div key={level} className="flex items-center gap-3">
            <span className="text-sm font-medium text-warm-gray w-7 shrink-0">{level}</span>
            <div className="flex-1 h-2.5 bg-ash-stone/60 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  pct > 0 ? 'bg-icon-gold' : 'bg-transparent'
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-warm-gray/70 w-9 text-right">{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

// --- Main Dashboard ---

interface DashboardProps {
  stats: DashboardStats
}

export function Dashboard({ stats }: DashboardProps) {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* Top row: Today's Study + Current Streak */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Study */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-parchment">Today's Study</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-warm-gray">Reviews due</span>
              <span className="text-lg font-semibold text-icon-gold">{stats.reviewsDue}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-warm-gray">New available</span>
              <span className="text-lg font-semibold text-parchment">{stats.newAvailable}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-warm-gray">Ghosts</span>
              <span className="text-lg font-semibold text-oxide-red">{stats.ghosts}</span>
            </div>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-parchment">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <Flame className="h-8 w-8 text-icon-gold" />
              <span className="text-3xl font-bold text-parchment">{stats.streakDays} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-warm-gray">Total known items</span>
              <span className="text-lg font-semibold text-verdigris">{stats.totalKnown}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle row: Radar Chart + Heat Map */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Progress Radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-parchment">Progress Radar</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-2">
            <RadarChart data={stats.progress} />
          </CardContent>
        </Card>

        {/* Study Heat Map */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-parchment">Study Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center overflow-x-auto py-2">
            <HeatMap data={stats.heatMap} />
          </CardContent>
        </Card>
      </div>

      {/* JLPT Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-parchment">JLPT Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <JLPTProgress progress={stats.jlptProgress} />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-parchment">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="gold"
              size="lg"
              className="gap-2"
              onClick={() => navigate('/japanese/review')}
            >
              <BookOpen className="h-4 w-4" />
              Start Review
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => navigate('/japanese/explore')}
            >
              <Sparkles className="h-4 w-4" />
              Learn New
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => navigate('/japanese/kanji')}
            >
              <Globe className="h-4 w-4" />
              Explore Kanji
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
