import { useMemo } from 'react'
import {
  BarChart3,
  Flame,
  BookOpen,
  Languages,
  Brain,
  Clock,
  Target,
  Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { subDays, format, getDay } from 'date-fns'

// ── Types ────────────────────────────────────────────────────────────────

interface JlptLevelProgress {
  level: string
  kanji: { known: number; total: number }
  vocabulary: { known: number; total: number }
  grammar: { known: number; total: number }
}

interface DimensionScore {
  label: string
  value: number // 0-5
}

interface HeatMapDay {
  date: Date
  minutes: number
}

// ── Mock Data ────────────────────────────────────────────────────────────

const JLPT_PROGRESS: JlptLevelProgress[] = [
  { level: 'N5', kanji: { known: 72, total: 80 }, vocabulary: { known: 580, total: 670 }, grammar: { known: 110, total: 128 } },
  { level: 'N4', kanji: { known: 105, total: 170 }, vocabulary: { known: 420, total: 1050 }, grammar: { known: 68, total: 196 } },
  { level: 'N3', kanji: { known: 85, total: 370 }, vocabulary: { known: 280, total: 1850 }, grammar: { known: 35, total: 312 } },
  { level: 'N2', kanji: { known: 20, total: 380 }, vocabulary: { known: 65, total: 3800 }, grammar: { known: 8, total: 256 } },
  { level: 'N1', kanji: { known: 3, total: 1000 }, vocabulary: { known: 10, total: 6000 }, grammar: { known: 0, total: 230 } },
]

const DIMENSION_SCORES: DimensionScore[] = [
  { label: 'Vocabulary', value: 3.2 },
  { label: 'Kanji', value: 2.8 },
  { label: 'Grammar', value: 2.1 },
  { label: 'Reading', value: 3.5 },
  { label: 'Listening', value: 1.4 },
]

const STATS = {
  totalWordsKnown: 1355,
  totalKanjiKnown: 285,
  totalGrammarPatterns: 221,
  currentStreak: 14,
  longestStreak: 42,
  totalStudyHours: 186,
  averageAccuracy: 87,
}

// ── Heat Map Generation ──────────────────────────────────────────────────

function generateHeatMapData(days: number): HeatMapDay[] {
  // Use a seeded-like approach for consistent mock data across renders
  const data: HeatMapDay[] = []
  for (let i = 0; i < days; i++) {
    const date = subDays(new Date(), days - 1 - i)
    const dayOfWeek = getDay(date)
    // Simulate varying study patterns: weekends more active
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const baseChance = isWeekend ? 0.85 : 0.65
    const seed = (date.getDate() * 7 + date.getMonth() * 31) % 100
    const studied = seed / 100 < baseChance
    const minutes = studied ? Math.max(5, (seed * 7) % 75) : 0
    data.push({ date, minutes })
  }
  // Ensure recent days show a streak matching STATS.currentStreak
  for (let i = 0; i < STATS.currentStreak && i < data.length; i++) {
    const idx = data.length - 1 - i
    if (data[idx].minutes === 0) {
      data[idx] = { ...data[idx], minutes: 15 + ((i * 13) % 50) }
    }
  }
  return data
}

// ── Sub-Components ───────────────────────────────────────────────────────

function ProgressBar({ value, total, className }: { value: number; total: number; className?: string }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 h-2 bg-ash-stone/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-icon-gold rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-warm-gray tabular-nums w-16 text-right">
        {value}/{total}
      </span>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="bg-charcoal-slate/50 border border-ash-stone/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-icon-gold/70" />
        <span className="text-xs text-warm-gray">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-parchment tabular-nums">{value}</div>
      {sub && <div className="text-xs text-warm-gray/60 mt-0.5">{sub}</div>}
    </div>
  )
}

// ── JLPT Section ─────────────────────────────────────────────────────────

function JlptProgressSection() {
  return (
    <div className="bg-charcoal-slate/50 border border-ash-stone/30 rounded-lg p-6">
      <h3 className="font-serif text-lg text-parchment mb-4 flex items-center gap-2">
        <Languages className="h-5 w-5 text-icon-gold" />
        JLPT Level Progress
      </h3>

      <div className="space-y-5">
        {JLPT_PROGRESS.map((level) => (
          <div key={level.level}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-parchment w-8">{level.level}</span>
              <span className="text-xs text-warm-gray">
                {Math.round(
                  ((level.kanji.known + level.vocabulary.known + level.grammar.known) /
                    (level.kanji.total + level.vocabulary.total + level.grammar.total)) *
                    100
                )}% overall
              </span>
            </div>
            <div className="pl-10 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-warm-gray/70 w-14">Kanji</span>
                <ProgressBar value={level.kanji.known} total={level.kanji.total} className="flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-warm-gray/70 w-14">Vocab</span>
                <ProgressBar value={level.vocabulary.known} total={level.vocabulary.total} className="flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-warm-gray/70 w-14">Grammar</span>
                <ProgressBar value={level.grammar.known} total={level.grammar.total} className="flex-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Heat Map ─────────────────────────────────────────────────────────────

function getHeatColor(minutes: number): string {
  if (minutes === 0) return 'fill-ash-stone/20'
  if (minutes <= 15) return 'fill-icon-gold/25'
  if (minutes <= 30) return 'fill-icon-gold/45'
  if (minutes <= 60) return 'fill-icon-gold/70'
  return 'fill-icon-gold'
}

function StudyCalendar() {
  const heatData = useMemo(() => generateHeatMapData(112), []) // 16 weeks

  // Group days into weeks (columns). Each column = 1 week.
  const weeks = useMemo(() => {
    const result: HeatMapDay[][] = []
    let currentWeek: HeatMapDay[] = []

    // Pad first week so columns align by day-of-week
    const firstDow = getDay(heatData[0].date)
    for (let i = 0; i < firstDow; i++) {
      currentWeek.push({ date: subDays(heatData[0].date, firstDow - i), minutes: -1 }) // -1 = empty
    }

    for (const day of heatData) {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        result.push(currentWeek)
        currentWeek = []
      }
    }
    if (currentWeek.length > 0) {
      result.push(currentWeek)
    }
    return result
  }, [heatData])

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: { text: string; col: number }[] = []
    let lastMonth = -1
    weeks.forEach((week, colIdx) => {
      const firstValidDay = week.find((d) => d.minutes >= 0)
      if (firstValidDay) {
        const month = firstValidDay.date.getMonth()
        if (month !== lastMonth) {
          labels.push({ text: format(firstValidDay.date, 'MMM'), col: colIdx })
          lastMonth = month
        }
      }
    })
    return labels
  }, [weeks])

  const cellSize = 12
  const cellGap = 2
  const dayLabelWidth = 28
  const monthLabelHeight = 16
  const svgWidth = dayLabelWidth + weeks.length * (cellSize + cellGap)
  const svgHeight = monthLabelHeight + 7 * (cellSize + cellGap)

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']

  return (
    <div className="bg-charcoal-slate/50 border border-ash-stone/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg text-parchment flex items-center gap-2">
          <Flame className="h-5 w-5 text-icon-gold" />
          Study Calendar
        </h3>
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-icon-gold" />
          <span className="text-sm text-parchment font-medium">{STATS.currentStreak} day streak</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} className="select-none">
          {/* Month labels */}
          {monthLabels.map((label, i) => (
            <text
              key={i}
              x={dayLabelWidth + label.col * (cellSize + cellGap)}
              y={12}
              className="fill-warm-gray/60 text-[10px]"
            >
              {label.text}
            </text>
          ))}

          {/* Day-of-week labels */}
          {dayLabels.map((label, row) => (
            label ? (
              <text
                key={row}
                x={0}
                y={monthLabelHeight + row * (cellSize + cellGap) + cellSize - 2}
                className="fill-warm-gray/50 text-[9px]"
              >
                {label}
              </text>
            ) : null
          ))}

          {/* Cells */}
          {weeks.map((week, colIdx) =>
            week.map((day, rowIdx) => {
              if (day.minutes < 0) return null
              return (
                <rect
                  key={`${colIdx}-${rowIdx}`}
                  x={dayLabelWidth + colIdx * (cellSize + cellGap)}
                  y={monthLabelHeight + rowIdx * (cellSize + cellGap)}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  className={cn(getHeatColor(day.minutes), 'transition-colors')}
                >
                  <title>
                    {format(day.date, 'MMM d, yyyy')}: {day.minutes} min
                  </title>
                </rect>
              )
            })
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-warm-gray/50">
        <span>Less</span>
        <div className="flex gap-0.5">
          {[0, 10, 20, 40, 70].map((min) => (
            <svg key={min} width={cellSize} height={cellSize}>
              <rect width={cellSize} height={cellSize} rx={2} className={getHeatColor(min)} />
            </svg>
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  )
}

// ── Radar Chart ──────────────────────────────────────────────────────────

function RadarChart({ dimensions }: { dimensions: DimensionScore[] }) {
  const size = 240
  const center = size / 2
  const maxRadius = 90
  const levels = 5

  // Calculate vertex positions for a regular pentagon
  const getPoint = (index: number, radius: number) => {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }
  }

  // Grid polygons
  const gridPolygons = Array.from({ length: levels }, (_, level) => {
    const radius = (maxRadius * (level + 1)) / levels
    const points = dimensions.map((_, i) => getPoint(i, radius))
    return points.map((p) => `${p.x},${p.y}`).join(' ')
  })

  // Data polygon
  const dataPoints = dimensions.map((dim, i) => {
    const radius = (maxRadius * dim.value) / levels
    return getPoint(i, radius)
  })
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')

  // Axis lines
  const axisEndpoints = dimensions.map((_, i) => getPoint(i, maxRadius))

  // Label positions (slightly beyond the chart)
  const labelPoints = dimensions.map((_, i) => getPoint(i, maxRadius + 24))

  return (
    <div className="bg-charcoal-slate/50 border border-ash-stone/30 rounded-lg p-6">
      <h3 className="font-serif text-lg text-parchment mb-4 flex items-center gap-2">
        <Brain className="h-5 w-5 text-icon-gold" />
        Skill Dimensions
      </h3>

      <div className="flex justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="select-none">
          {/* Grid polygons */}
          {gridPolygons.map((points, i) => (
            <polygon
              key={i}
              points={points}
              className="fill-none stroke-ash-stone/30"
              strokeWidth={1}
            />
          ))}

          {/* Axis lines */}
          {axisEndpoints.map((point, i) => (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              className="stroke-ash-stone/20"
              strokeWidth={1}
            />
          ))}

          {/* Data polygon */}
          <polygon
            points={dataPolygon}
            className="fill-icon-gold/15 stroke-icon-gold"
            strokeWidth={2}
          />

          {/* Data points */}
          {dataPoints.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r={3}
              className="fill-icon-gold stroke-obsidian"
              strokeWidth={1.5}
            />
          ))}

          {/* Labels */}
          {dimensions.map((dim, i) => {
            const labelPos = labelPoints[i]
            return (
              <text
                key={i}
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-warm-gray text-[11px]"
              >
                {dim.label}
                <tspan x={labelPos.x} dy="14" className="fill-icon-gold text-[10px] font-medium">
                  {dim.value.toFixed(1)}
                </tspan>
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────

export function ProgressPanel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-5 w-5 text-icon-gold" />
        <h2 className="font-serif text-xl text-parchment">Progress Tracking</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={BookOpen} label="Words Known" value={STATS.totalWordsKnown.toLocaleString()} />
        <StatCard icon={Languages} label="Kanji Known" value={STATS.totalKanjiKnown} />
        <StatCard icon={Brain} label="Grammar" value={STATS.totalGrammarPatterns} />
        <StatCard icon={Flame} label="Current Streak" value={`${STATS.currentStreak} days`} />
        <StatCard icon={Trophy} label="Longest Streak" value={`${STATS.longestStreak} days`} />
        <StatCard icon={Clock} label="Total Study" value={`${STATS.totalStudyHours}h`} />
        <StatCard icon={Target} label="Avg. Accuracy" value={`${STATS.averageAccuracy}%`} />
        <StatCard
          icon={BookOpen}
          label="Est. Level"
          value="N4"
          sub="Upper Elementary"
        />
      </div>

      {/* Study Calendar */}
      <StudyCalendar />

      {/* JLPT Progress + Radar side by side on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <JlptProgressSection />
        <RadarChart dimensions={DIMENSION_SCORES} />
      </div>
    </div>
  )
}
