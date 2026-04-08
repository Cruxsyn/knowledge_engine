import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, Lightbulb, Terminal, Calculator, Network, BookOpen, Brain, GitBranch } from 'lucide-react'

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  action: () => void
  category: 'navigation' | 'action'
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const commands: Command[] = [
    { id: 'notes', label: 'Go to Notes', icon: FileText, action: () => navigate('/'), category: 'navigation' },
    { id: 'concepts', label: 'Go to Concepts', icon: Lightbulb, action: () => navigate('/concepts'), category: 'navigation' },
    { id: 'graph', label: 'Go to Knowledge Graph', icon: Network, action: () => navigate('/graph'), category: 'navigation' },
    { id: 'notebook', label: 'New Notebook', icon: BookOpen, action: () => navigate('/notebook/new'), category: 'navigation' },
    { id: 'nn', label: 'Neural Network Playground', icon: Brain, action: () => navigate('/nn'), category: 'navigation' },
    { id: 'terminal', label: 'Go to Terminal', icon: Terminal, action: () => navigate('/terminal'), category: 'navigation' },
    { id: 'math', label: 'Go to Math Viz', icon: Calculator, action: () => navigate('/math-viz'), category: 'navigation' },
    { id: 'visualize', label: 'Go to Visualize', icon: GitBranch, action: () => navigate('/visualize'), category: 'navigation' },
  ]

  const filtered = query
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands

  useEffect(() => {
    setSelectedIdx(0)
  }, [query])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault()
      setOpen(o => !o)
      setQuery('')
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  if (!open) return null

  const executeCommand = (cmd: Command) => {
    cmd.action()
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-[560px] bg-charcoal-slate border border-ash-stone/50 rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 p-4 border-b border-ash-stone/50">
          <Search className="h-5 w-5 text-warm-gray/50" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIdx(i => Math.min(i + 1, filtered.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIdx(i => Math.max(i - 1, 0))
              } else if (e.key === 'Enter' && filtered[selectedIdx]) {
                executeCommand(filtered[selectedIdx])
              }
            }}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-parchment text-sm outline-none placeholder:text-warm-gray/40"
          />
          <kbd className="text-[10px] text-warm-gray/40 bg-obsidian px-1.5 py-0.5 rounded">Ctrl+P</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                i === selectedIdx
                  ? 'bg-ash-stone/40 text-parchment'
                  : 'text-warm-gray hover:bg-ash-stone/20'
              }`}
              onClick={() => executeCommand(cmd)}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              <cmd.icon className="h-4 w-4 shrink-0" />
              <span>{cmd.label}</span>
              {cmd.description && (
                <span className="text-xs text-warm-gray/50 ml-auto">{cmd.description}</span>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-warm-gray/50 text-sm py-8">No commands found</p>
          )}
        </div>
      </div>
    </div>
  )
}
