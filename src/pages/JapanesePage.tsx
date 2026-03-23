import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Dashboard } from '@/components/japanese/Dashboard'
import { ReviewSession } from '@/components/japanese/ReviewSession'
import { useJapaneseStore } from '@/stores/japaneseStore'
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  type LucideIcon,
  BookText,
  Settings,
  Construction,
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

function PlaceholderTab({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <Construction className="h-12 w-12 text-warm-gray/40" />
      <h3 className="text-xl font-serif text-parchment">{name}</h3>
      <p className="text-warm-gray text-sm max-w-md text-center">
        This section is under construction. Check back soon.
      </p>
    </div>
  )
}

export function JapanesePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeTab = getActiveTab(location.pathname)
  const stats = useJapaneseStore((s) => s.stats)

  function renderContent() {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} />
      case 'review':
        return <ReviewSession />
      case 'explore':
        return <PlaceholderTab name="Explore" />
      case 'kanji':
        return <PlaceholderTab name="Kanji" />
      case 'reading':
        return <PlaceholderTab name="Reading" />
      case 'settings':
        return <PlaceholderTab name="Settings" />
      default:
        return <Dashboard stats={stats} />
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
