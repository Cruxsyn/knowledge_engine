import { useState, useEffect, useMemo } from 'react'
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
import { format, getDay, subDays } from 'date-fns'
import { useJapanese } from '@/hooks/useJapanese'

// -- Types --

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

interface LoadedStats {
  totalWordsKnown: number
  totalKanjiKnown: number
  totalGrammarPatterns: number
  currentStreak: number
  longestStreak: number
  totalStudyHours: number
  averageAccuracy: number
}

// -- Sub-Components --

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

// -- JLPT Section --

function JlptProgressSection({ jlptData }: { jlptData: JlptLevelProgress[] }) {
  return (
    <div className="bg-charcoal-slate/50 border border-ash-stone/30 rounded-lg p-6">
      <h3 className="font-serif text-lg text-parchment mb-4 flex items-center gap-2">
        <Languages className="h-5 w-5 text-icon-gold" />
        JLPT Level Progress
      </h3>

      <div className="space-y-5">
        {jlptData.map((level) => (
          <div key={level.level}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-parchment w-8">{level.level}</span>
              <span className="text-xs text-warm-gray">
                {Math.round(
                  ((level.kanji.known + level.vocabulary.known + level.grammar.known) /
                    Math.max(1, level.kanji.total + level.vocabulary.total + level.grammar.total)) *
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

// -- Heat Map --

function getHeatColor(minutes: number): string {
  if (minutes === 0) return 'fill-ash-stone/20'
  if (minutes <= 15) return 'fill-icon-gold/25'
  if (minutes <= 30) return 'fill-icon-gold/45'
  if (minutes <= 60) return 'fill-icon-gold/70'
  return 'fill-icon-gold'
}

function StudyCalendar({ heatData, streak }: { heatData: HeatMapDay[]; streak: number }) {
  // Group days into weeks (columns). Each column = 1 week.
  const weeks = useMemo(() => {
    if (heatData.length === 0) return []
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
          <span className="text-sm text-parchment font-medium">{streak} day streak</span>
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

// -- Radar Chart --

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

// -- Main Component --

export function ProgressPanel() {
  const jp = useJapanese()
  const [jlptData, setJlptData] = useState<JlptLevelProgress[]>([])
  const [dimensions, setDimensions] = useState<DimensionScore[]>([
    { label: 'Vocabulary', value: 0 },
    { label: 'Kanji', value: 0 },
    { label: 'Grammar', value: 0 },
    { label: 'Reading', value: 0 },
    { label: 'Listening', value: 0 },
  ])
  const [stats, setStats] = useState<LoadedStats>({
    totalWordsKnown: 0,
    totalKanjiKnown: 0,
    totalGrammarPatterns: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalStudyHours: 0,
    averageAccuracy: 0,
  })
  const [heatData, setHeatData] = useState<HeatMapDay[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        // Load progress dimensions
        const progress = await jp.getProgress()
        if (progress && progress.length > 0) {
          const dimMap: Record<string, number> = {}
          for (const p of progress) {
            dimMap[p.dimension] = p.current_level
          }
          setDimensions([
            { label: 'Vocabulary', value: dimMap['vocabulary'] ?? 0 },
            { label: 'Kanji', value: dimMap['kanji'] ?? 0 },
            { label: 'Grammar', value: dimMap['grammar'] ?? 0 },
            { label: 'Reading', value: dimMap['reading'] ?? 0 },
            { label: 'Listening', value: dimMap['listening'] ?? 0 },
          ])
        }

        // Load dashboard stats
        const dashStats = await jp.getDashboardStats()
        if (dashStats) {
          // Calculate per-dimension known counts for stats
          let vocabKnown = 0
          let kanjiKnown = 0
          let grammarKnown = 0
          let totalHours = 0

          for (const p of dashStats.progress) {
            if (p.dimension === 'vocabulary') vocabKnown = p.items_known + p.items_mastered
            if (p.dimension === 'kanji') kanjiKnown = p.items_known + p.items_mastered
            if (p.dimension === 'grammar') grammarKnown = p.items_known + p.items_mastered
          }

          // Load study sessions to compute total hours
          const sessions = await jp.getStudySessions(365)
          if (sessions) {
            totalHours = Math.round(
              sessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60
            )
          }

          setStats({
            totalWordsKnown: vocabKnown,
            totalKanjiKnown: kanjiKnown,
            totalGrammarPatterns: grammarKnown,
            currentStreak: dashStats.currentStreak,
            longestStreak: dashStats.currentStreak, // Use current as fallback
            totalStudyHours: totalHours,
            averageAccuracy: Math.round(dashStats.todayAccuracy * 100),
          })

          // Build JLPT progress data from progress info
          // N5 items are subset of the total; approximate using ratios
          const totalKnown = dashStats.progress.reduce(
            (s, p) => s + p.items_known + p.items_mastered, 0
          )
          const totalItems = dashStats.progress.reduce(
            (s, p) => s + p.items_total, 0
          )
          const ratio = totalItems > 0 ? totalKnown / totalItems : 0

          // Approximate JLPT level breakdowns based on typical item counts
          const jlptTotals: Record<string, { kanji: number; vocab: number; grammar: number }> = {
            N5: { kanji: 80, vocab: 670, grammar: 128 },
            N4: { kanji: 170, vocab: 1050, grammar: 196 },
            N3: { kanji: 370, vocab: 1850, grammar: 312 },
            N2: { kanji: 380, vocab: 3800, grammar: 256 },
            N1: { kanji: 1000, vocab: 6000, grammar: 230 },
          }

          const jlptProgress: JlptLevelProgress[] = ['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => {
            const totals = jlptTotals[level]
            // Estimate known items per level based on overall mastery ratio (decreasing for higher levels)
            const levelMultiplier = level === 'N5' ? 1.0 : level === 'N4' ? 0.7 : level === 'N3' ? 0.4 : level === 'N2' ? 0.15 : 0.03
            return {
              level,
              kanji: {
                known: Math.min(totals.kanji, Math.round(kanjiKnown * levelMultiplier)),
                total: totals.kanji,
              },
              vocabulary: {
                known: Math.min(totals.vocab, Math.round(vocabKnown * levelMultiplier)),
                total: totals.vocab,
              },
              grammar: {
                known: Math.min(totals.grammar, Math.round(grammarKnown * levelMultiplier)),
                total: totals.grammar,
              },
            }
          })
          setJlptData(jlptProgress)
        }

        // Load heat map data from study sessions
        const heatSessions = await jp.getStudySessions(112)
        if (heatSessions) {
          // Build a map of date -> total minutes
          const dateMinutes = new Map<string, number>()
          for (const s of heatSessions) {
            const existing = dateMinutes.get(s.session_date) ?? 0
            dateMinutes.set(s.session_date, existing + s.duration_minutes)
          }

          // Create array for last 112 days
          const today = new Date()
          const heatMapData: HeatMapDay[] = []
          for (let i = 111; i >= 0; i--) {
            const d = new Date(today)
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().split('T')[0]
            heatMapData.push({
              date: d,
              minutes: dateMinutes.get(dateStr) ?? 0,
            })
          }
          setHeatData(heatMapData)
        }
      } catch (err) {
        console.error('[ProgressPanel] Error loading data:', err)
      }
    }

    loadData()
  }, [jp])

  // Estimate level
  const estimatedLevel = useMemo(() => {
    const totalKnown = stats.totalWordsKnown + stats.totalKanjiKnown + stats.totalGrammarPatterns
    if (totalKnown >= 2000) return { level: 'N3', desc: 'Intermediate' }
    if (totalKnown >= 800) return { level: 'N4', desc: 'Upper Elementary' }
    if (totalKnown >= 200) return { level: 'N5', desc: 'Elementary' }
    return { level: '--', desc: 'Beginner' }
  }, [stats])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-5 w-5 text-icon-gold" />
        <h2 className="font-serif text-xl text-parchment">Progress Tracking</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={BookOpen} label="Words Known" value={stats.totalWordsKnown.toLocaleString()} />
        <StatCard icon={Languages} label="Kanji Known" value={stats.totalKanjiKnown} />
        <StatCard icon={Brain} label="Grammar" value={stats.totalGrammarPatterns} />
        <StatCard icon={Flame} label="Current Streak" value={`${stats.currentStreak} days`} />
        <StatCard icon={Trophy} label="Longest Streak" value={`${stats.longestStreak} days`} />
        <StatCard icon={Clock} label="Total Study" value={`${stats.totalStudyHours}h`} />
        <StatCard icon={Target} label="Avg. Accuracy" value={`${stats.averageAccuracy}%`} />
        <StatCard
          icon={BookOpen}
          label="Est. Level"
          value={estimatedLevel.level}
          sub={estimatedLevel.desc}
        />
      </div>

      {/* Study Calendar */}
      <StudyCalendar heatData={heatData} streak={stats.currentStreak} />

      {/* JLPT Progress + Radar side by side on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <JlptProgressSection jlptData={jlptData} />
        <RadarChart dimensions={dimensions} />
      </div>
    </div>
  )
}
