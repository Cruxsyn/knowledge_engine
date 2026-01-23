import { Search, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/appStore'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { toggleSidebar, setSearchOpen } = useAppStore()

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-ash-stone/50 bg-charcoal-slate/50">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div>
          <h1 className="text-2xl font-serif font-semibold text-parchment">{title}</h1>
          {subtitle && (
            <p className="text-sm text-warm-gray mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {actions}
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
          <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-ash-stone bg-ash-stone/50 px-1.5 font-mono text-[10px] font-medium text-warm-gray">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>
    </header>
  )
}
