import { useRef, useEffect, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { FormattedText } from '@/components/ui/formatted-text'
import { cn } from '@/lib/utils'
import { detectVisualizationType } from '@/lib/math/visualizationDetector'
import { getVisualizationLabel, getVisualizationColor, getExamples } from '@/lib/math/visualizationDetector'
import { getSuggestions, applySuggestion, CATEGORY_COLORS, type MathSuggestion } from '@/lib/math/autocomplete'
import { ChevronDown, Play, AlertCircle } from 'lucide-react'

interface MathInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => boolean
  error?: string
  className?: string
}

export function MathInput({ value, onChange, onSubmit, error, className }: MathInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const showPreview = true

  const [suggestions, setSuggestions] = useState<MathSuggestion[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const vizType = value.trim() ? detectVisualizationType(value) : null

  useEffect(() => {
    const results = getSuggestions(value)
    setSuggestions(results)
    setSelectedIdx(0)
    setShowSuggestions(results.length > 0)
  }, [value])

  const acceptSuggestion = useCallback((suggestion: MathSuggestion) => {
    const newValue = applySuggestion(value, suggestion)
    onChange(newValue)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }, [value, onChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx((i) => (i + 1) % suggestions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx((i) => (i - 1 + suggestions.length) % suggestions.length)
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        acceptSuggestion(suggestions[selectedIdx])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowSuggestions(false)
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (showSuggestions && suggestions.length > 0) {
        acceptSuggestion(suggestions[selectedIdx])
      } else {
        onSubmit()
      }
    }
  }

  const getPreviewText = () => {
    if (!value.trim()) return ''
    if (value.includes('$')) return value
    return `$${value}$`
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const examples = getExamples()

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-2">
        <div className="flex-1 relative" ref={dropdownRef}>
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
            placeholder="Enter equation (e.g., y = sin(x), sigmoid, relu, [[1,2],[3,4]])"
            className={cn(
              'pr-24 font-mono',
              error && 'border-oxide-red focus:border-oxide-red'
            )}
          />
          {vizType && (
            <Badge
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
              style={{
                backgroundColor: getVisualizationColor(vizType) + '20',
                color: getVisualizationColor(vizType),
                borderColor: getVisualizationColor(vizType),
              }}
              variant="outline"
            >
              {getVisualizationLabel(vizType)}
            </Badge>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-charcoal-slate border border-ash-stone/50 rounded-md shadow-lg overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={s.trigger + s.category}
                  onClick={() => acceptSuggestion(s)}
                  onMouseEnter={() => setSelectedIdx(i)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                    i === selectedIdx ? 'bg-ash-stone/40' : 'hover:bg-ash-stone/20'
                  )}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[s.category] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-parchment">{s.label}</code>
                      <span className="text-[10px] text-warm-gray/60 uppercase">{s.category}</span>
                    </div>
                    <div className="text-[11px] text-warm-gray truncate">{s.description}</div>
                  </div>
                  {i === selectedIdx && (
                    <span className="text-[10px] text-warm-gray/40 flex-shrink-0">Tab</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Examples</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {examples.map((ex, i) => (
              <DropdownMenuItem
                key={i}
                onClick={() => onChange(ex.expression)}
                className="flex justify-between"
              >
                <span className="text-warm-gray">{ex.label}</span>
                <code className="text-xs font-mono text-parchment">{ex.expression}</code>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={onSubmit} disabled={!value.trim()}>
          <Play className="h-4 w-4 mr-1" />
          Plot
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-oxide-red">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {showPreview && value.trim() && !error && !showSuggestions && (
        <div className="p-3 bg-charcoal-slate rounded-md border border-ash-stone/50">
          <div className="text-xs text-warm-gray mb-1">Preview</div>
          <div className="text-parchment">
            <FormattedText inline>{getPreviewText()}</FormattedText>
          </div>
        </div>
      )}

      <div className="text-xs text-warm-gray">
        Type <code className="bg-ash-stone/30 px-1 rounded">sigmoid</code>,{' '}
        <code className="bg-ash-stone/30 px-1 rounded">relu</code>,{' '}
        <code className="bg-ash-stone/30 px-1 rounded">softplus</code> for DL presets.{' '}
        Supports: equations, <code className="bg-ash-stone/30 px-1 rounded">[[matrix]]</code>,{' '}
        <code className="bg-ash-stone/30 px-1 rounded">&lt;vector&gt;</code>, LaTeX
      </div>
    </div>
  )
}
