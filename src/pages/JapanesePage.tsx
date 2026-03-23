import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Dashboard } from '@/components/japanese/Dashboard'
import { ReviewSession } from '@/components/japanese/ReviewSession'
import { AssociationGraph } from '@/components/japanese/AssociationGraph'
import { KanjiBrowser } from '@/components/japanese/KanjiBrowser'
import { ReadingPractice } from '@/components/japanese/ReadingPractice'
import { SettingsPanel } from '@/components/japanese/SettingsPanel'
import { ProgressPanel } from '@/components/japanese/ProgressPanel'
import { useJapaneseStore } from '@/stores/japaneseStore'
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  type LucideIcon,
  BookText,
  Settings,
} from 'lucide-react'

interface TabDef {
  id: string
  label: string
  path: string
  icon: LucideIcon
}

const TABS: TabDef[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/japanese', icon: LayoutDashboard },
  { id: 'review', label: 'Review', path: '/japanese/review', icon: BookOpen },
  { id: 'explore', label: 'Explore', path: '/japanese/explore', icon: Compass },
  { id: 'kanji', label: 'Kanji', path: '/japanese/kanji', icon: BookText },
  { id: 'reading', label: 'Reading', path: '/japanese/reading', icon: BookText },
  { id: 'settings', label: 'Settings', path: '/japanese/settings', icon: Settings },
]

function getActiveTab(pathname: string): string {
  // Check from most specific to least specific
  if (pathname.startsWith('/japanese/review')) return 'review'
  if (pathname.startsWith('/japanese/explore')) return 'explore'
  if (pathname.startsWith('/japanese/kanji')) return 'kanji'
  if (pathname.startsWith('/japanese/reading')) return 'reading'
  if (pathname.startsWith('/japanese/settings')) return 'settings'
  return 'dashboard'
}

export function JapanesePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeTab = getActiveTab(location.pathname)
  const stats = useJapaneseStore((s) => s.stats)

  // Load stats on mount
  useEffect(() => {
    useJapaneseStore.getState().loadStats()
  }, [])

  function renderContent() {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-6 space-y-6 overflow-y-auto h-full">
            <Dashboard stats={stats} />
            <ProgressPanel />
          </div>
        )
      case 'review':
        return <ReviewSession />
      case 'explore':
        return <AssociationGraph />
      case 'kanji':
        return <KanjiBrowser />
      case 'reading':
        return <ReadingPractice />
      case 'settings':
        return <SettingsPanel />
      default:
        return (
          <div className="p-6 space-y-6 overflow-y-auto h-full">
            <Dashboard stats={stats} />
            <ProgressPanel />
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header + Tab bar */}
      <div className="border-b border-ash-stone/30 bg-charcoal-slate/50">
        <div className="flex items-center justify-between px-6 pt-4 pb-0">
          <h1 className="text-2xl font-serif font-semibold text-parchment">
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
                onClick={() => navigate(tab.path)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  'border-b-2 -mb-px whitespace-nowrap',
                  isActive
                    ? 'border-icon-gold text-parchment'
                    : 'border-transparent text-warm-gray hover:text-parchment hover:border-warm-gray/30'
                )}
              >
                <Icon className="h-4 w-4" />
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
