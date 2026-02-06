import { NavLink } from 'react-router-dom'
import {
  FileText,
  Lightbulb,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Share2,
  Calculator,
  Network
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/appStore'
import { useShareStore } from '@/stores/shareStore'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

const learnItems = [
  { to: '/', icon: FileText, label: 'Atomic Notes', shortcut: 'Alt+N' },
  { to: '/concepts', icon: Lightbulb, label: 'Concepts', shortcut: 'Alt+C' },
]

const toolItems = [
  { to: '/terminal', icon: Terminal, label: 'Terminal', shortcut: 'Alt+T' },
  { to: '/math-viz', icon: Calculator, label: 'Math Viz', shortcut: 'Alt+M' },
]

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, setSearchOpen } = useAppStore()
  const { setOpen: setShareOpen } = useShareStore()

  return (
    <TooltipProvider>
      <aside 
        className={cn(
          "flex flex-col h-full bg-charcoal-slate border-r border-ash-stone/50 transition-all duration-300 overflow-hidden",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between p-4 border-b border-ash-stone/50">
          {sidebarOpen && (
            <h1 className="font-serif text-xl text-icon-gold font-semibold">
              Arkvim
            </h1>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleSidebar}
            className="ml-auto"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Search */}
        <div className="p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full", !sidebarOpen && "justify-center px-0")}
                onClick={() => setSearchOpen(true)}
              >
                <span className="inline-flex items-center gap-2 flex-1">
                  <Search className="h-4 w-4" />
                  {sidebarOpen && <span>Search</span>}
                  {sidebarOpen && <span className="ml-auto text-xs text-warm-gray">Ctrl+K</span>}
                </span>
              </Button>
            </TooltipTrigger>
            {!sidebarOpen && (
              <TooltipContent side="right">
                Search (Ctrl+K)
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Navigation - sectioned */}
        <nav className="flex-1 flex flex-col p-3 pt-4 space-y-6 overflow-y-auto">
          {/* LEARN section */}
          <div>
            {sidebarOpen && (
              <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-warm-gray/50 font-medium">
                Learn
              </div>
            )}
            {learnItems.map((item) => (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        "block py-3 mb-3 rounded-md text-sm font-medium transition-colors",
                        "hover:bg-ash-stone/50 hover:text-parchment",
                        isActive
                          ? "bg-ash-stone/60 text-parchment px-3"
                          : "text-warm-gray px-3",
                        !sidebarOpen && "text-center px-0"
                      )
                    }
                  >
                    <span className="inline-flex items-center gap-3 w-full min-w-0">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {sidebarOpen && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          <span className="text-[10px] text-warm-gray/40">{item.shortcut}</span>
                        </>
                      )}
                    </span>
                  </NavLink>
                </TooltipTrigger>
                {!sidebarOpen && (
                  <TooltipContent side="right">
                    {item.label} ({item.shortcut})
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>

          {/* TOOLS section */}
          <div>
            {sidebarOpen && (
              <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-warm-gray/50 font-medium">
                Tools
              </div>
            )}
            {toolItems.map((item) => (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "block py-3 mb-3 rounded-md text-sm font-medium transition-colors",
                        "hover:bg-ash-stone/50 hover:text-parchment",
                        isActive
                          ? "bg-ash-stone/60 text-parchment px-3"
                          : "text-warm-gray px-3",
                        !sidebarOpen && "text-center px-0"
                      )
                    }
                  >
                    <span className="inline-flex items-center gap-3 w-full min-w-0">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {sidebarOpen && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          <span className="text-[10px] text-warm-gray/40">{item.shortcut}</span>
                        </>
                      )}
                    </span>
                  </NavLink>
                </TooltipTrigger>
                {!sidebarOpen && (
                  <TooltipContent side="right">
                    {item.label} ({item.shortcut})
                  </TooltipContent>
                )}
              </Tooltip>
            ))}

            {/* Visualize link */}
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink
                  to="/visualize"
                  className={({ isActive }) =>
                    cn(
                      "block py-3 mb-3 rounded-md text-sm font-medium transition-colors",
                      "hover:bg-ash-stone/50 hover:text-parchment",
                      isActive
                        ? "bg-ash-stone/60 text-parchment px-3"
                        : "text-warm-gray px-3",
                      !sidebarOpen && "text-center px-0"
                    )
                  }
                >
                  <span className="inline-flex items-center gap-3 w-full">
                    <Network className="h-4 w-4 shrink-0" />
                    {sidebarOpen && <span>Visualize</span>}
                  </span>
                </NavLink>
              </TooltipTrigger>
              {!sidebarOpen && (
                <TooltipContent side="right">
                  Visualize
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-ash-stone/50 space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={() => setShareOpen(true)}
                className={cn(
                  "w-full justify-start px-3 py-3 h-auto text-sm font-medium",
                  "hover:bg-ash-stone/50 hover:text-parchment text-warm-gray",
                  !sidebarOpen && "justify-center px-0"
                )}
              >
                <span className="inline-flex items-center gap-3">
                  <Share2 className="h-4 w-4" />
                  {sidebarOpen && <span>Share</span>}
                </span>
              </Button>
            </TooltipTrigger>
            {!sidebarOpen && (
              <TooltipContent side="right">
                Share
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/export"
                className={({ isActive }) =>
                  cn(
                    "block py-4 rounded-md text-sm font-medium transition-colors",
                    "hover:bg-ash-stone/50 hover:text-parchment",
                    isActive
                      ? "bg-ash-stone/60 text-parchment px-3"
                      : "text-warm-gray px-3",
                    !sidebarOpen && "text-center px-0"
                  )
                }
              >
                <span className="inline-flex items-center gap-3">
                  <Download className="h-4 w-4" />
                  {sidebarOpen && <span>Export</span>}
                </span>
              </NavLink>
            </TooltipTrigger>
            {!sidebarOpen && (
              <TooltipContent side="right">
                Export
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
