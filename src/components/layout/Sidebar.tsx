import { NavLink } from 'react-router-dom'
import { 
  Inbox, 
  FileText, 
  Lightbulb, 
  Search, 
  Download,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/appStore'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

const navItems = [
  { to: '/', icon: Inbox, label: 'Inbox', shortcut: 'I' },
  { to: '/notes', icon: FileText, label: 'Atomic Notes', shortcut: 'N' },
  { to: '/concepts', icon: Lightbulb, label: 'Concepts', shortcut: 'C' },
]

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, setQuickCaptureOpen, setSearchOpen } = useAppStore()

  return (
    <TooltipProvider>
      <aside 
        className={cn(
          "flex flex-col h-full bg-charcoal-slate border-r border-ash-stone/50 transition-all duration-300",
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

        {/* Quick Actions */}
        <div className="p-3 space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="gold" 
                className={cn("w-full justify-start", !sidebarOpen && "justify-center px-0")}
                onClick={() => setQuickCaptureOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {sidebarOpen && <span className="ml-2">Quick Capture</span>}
              </Button>
            </TooltipTrigger>
            {!sidebarOpen && (
              <TooltipContent side="right">
                Quick Capture (Ctrl+Shift+N)
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                className={cn("w-full justify-start", !sidebarOpen && "justify-center px-0")}
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
                {sidebarOpen && <span className="ml-2">Search</span>}
                {sidebarOpen && <span className="ml-auto text-xs text-warm-gray">Ctrl+K</span>}
              </Button>
            </TooltipTrigger>
            {!sidebarOpen && (
              <TooltipContent side="right">
                Search (Ctrl+K)
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Tooltip key={item.to}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      "hover:bg-ash-stone/50 hover:text-parchment",
                      isActive 
                        ? "bg-ash-stone text-parchment" 
                        : "text-warm-gray",
                      !sidebarOpen && "justify-center px-0"
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {sidebarOpen && <span className="ml-3">{item.label}</span>}
                </NavLink>
              </TooltipTrigger>
              {!sidebarOpen && (
                <TooltipContent side="right">
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-ash-stone/50">
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/export"
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    "hover:bg-ash-stone/50 hover:text-parchment",
                    isActive 
                      ? "bg-ash-stone text-parchment" 
                      : "text-warm-gray",
                    !sidebarOpen && "justify-center px-0"
                  )
                }
              >
                <Download className="h-5 w-5" />
                {sidebarOpen && <span className="ml-3">Export</span>}
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
