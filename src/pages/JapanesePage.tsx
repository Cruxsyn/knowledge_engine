import { useEffect } from 'react'
import { preloadVoices } from '@/lib/japanese/audio'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Dashboard } from '@/components/japanese/Dashboard'
import { ReviewSession } from '@/components/japanese/ReviewSession'
import { AssociationGraph } from '@/components/japanese/AssociationGraph'
import { KanjiForge } from '@/components/japanese/KanjiForge'
import PatternLab from '@/components/japanese/PatternLab'
import { ReadingPractice } from '@/components/japanese/ReadingPractice'
import { SettingsPanel } from '@/components/japanese/SettingsPanel'
import { ProgressPanel } from '@/components/japanese/ProgressPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useJapaneseStore } from '@/stores/japaneseStore'
import type { JapaneseState } from '@/stores/japaneseStore'
import {
  Compass,
  Hammer,
  Lightbulb,
  BookText,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from 'lucide-react'

// ── Placeholder for not-yet-built tabs ──────────────────────────

function PlaceholderTab({ name, description }: { name: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <h3 className="text-base text-parchment">{name}</h3>
      {description && <p className="text-warm-gray text-sm max-w-md text-center">{description}</p>}
      <p className="text-warm-gray/50 text-xs">Coming soon</p>
    </div>
  )
}

// ── Tab definitions ─────────────────────────────────────────────

interface TabDef {
  id: Exclude<JapaneseState['activeTab'], 'review'>
  label: string
  icon: LucideIcon
}

const TABS: TabDef[] = [
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'forge', label: 'Compose', icon: Hammer },
  { id: 'discover', label: 'Discover', icon: Lightbulb },
  { id: 'read', label: 'Read', icon: BookText },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const TAB_TO_PATH: Record<string, string> = {
  explore: '/japanese',
  forge: '/japanese/forge',
  discover: '/japanese/discover',
  read: '/japanese/read',
  dashboard: '/japanese/dashboard',
  review: '/japanese/review',
  settings: '/japanese/settings',
}

function pathToTab(pathname: string): JapaneseState['activeTab'] {
  if (pathname.startsWith('/japanese/forge')) return 'forge'
  if (pathname.startsWith('/japanese/discover')) return 'discover'
  if (pathname.startsWith('/japanese/read')) return 'read'
  if (pathname.startsWith('/japanese/dashboard')) return 'dashboard'
  if (pathname.startsWith('/japanese/review')) return 'review'
  if (pathname.startsWith('/japanese/settings')) return 'settings'
  return 'explore'
}

export function JapanesePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeTab = useJapaneseStore((s) => s.activeTab)
  const setActiveTab = useJapaneseStore((s) => s.setActiveTab)
  const stats = useJapaneseStore((s) => s.stats)

  // Sync URL → store on mount / direct navigation
  useEffect(() => {
    const tabFromUrl = pathToTab(location.pathname)
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
  }, [location.pathname])

  // Load stats on mount
  useEffect(() => {
    useJapaneseStore.getState().loadStats()
  }, [])

  // Preload speech synthesis voices
  useEffect(() => {
    preloadVoices()
  }, [])

  function handleTabClick(tab: JapaneseState['activeTab']) {
    setActiveTab(tab)
    // Update URL for bookmarkability without triggering a remount
    const path = TAB_TO_PATH[tab] || '/japanese'
    navigate(path, { replace: true })
  }

  function renderContent() {
    switch (activeTab) {
      case 'explore':
        return <AssociationGraph />
      case 'forge':
        return <KanjiForge />
      case 'discover':
        return <PatternLab />
      case 'read':
        return <ReadingPractice />
      case 'dashboard':
        return (
          <div className="p-6 space-y-6 overflow-y-auto h-full">
            <Dashboard stats={stats} />
            {/* Review access */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-parchment">SRS Review</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-warm-gray mb-3">
                  {stats.reviewsDue} cards due for review
                </p>
                <Button variant="outline" onClick={() => handleTabClick('review')}>
                  Start Review Session
                </Button>
              </CardContent>
            </Card>
            <ProgressPanel />
          </div>
        )
      case 'review':
        return <ReviewSession />
      case 'settings':
        return <SettingsPanel />
      default:
        return <AssociationGraph />
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header + Tab bar */}
      <div className="border-b border-ash-stone/20 bg-charcoal-slate/50">
        <div className="flex items-center justify-between px-6 pt-4 pb-0">
          <h1 className="text-xl font-semibold text-parchment">
            Japanese
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-6 mt-3 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                  'border-b-2 -mb-px whitespace-nowrap',
                  isActive
                    ? 'border-icon-gold text-parchment'
                    : 'border-transparent text-warm-gray hover:text-parchment hover:border-warm-gray/30'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  )
}
