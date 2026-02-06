import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useMathVizStore } from '@/stores/mathVizStore'
import type { EquationGroup } from '@/stores/mathVizStore'
import { FolderOpen, Save, Plus, Trash2, Play, BookOpen, X, Check } from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  'deep-learning': '#C8A24A',
  'calculus': '#2E6F68',
  'linear-algebra': '#8B5A8B',
  'custom': '#5B7DB8',
}

const CATEGORY_LABELS: Record<string, string> = {
  'deep-learning': 'DL',
  'calculus': 'Calc',
  'linear-algebra': 'LinAlg',
  'custom': 'Custom',
}

interface EquationGroupsProps {
  className?: string
}

export function EquationGroups({ className }: EquationGroupsProps) {
  const {
    equationGroups,
    activeGroupId,
    loadGroup,
    deleteGroup,
    saveGroup,
    activeExpressionIds,
  } = useMathVizStore()

  const [showSaveForm, setShowSaveForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('custom')

  const hasActiveExpressions = activeExpressionIds.length >= 2

  // Group by category
  const grouped = equationGroups.reduce<Record<string, EquationGroup[]>>((acc, g) => {
    const cat = g.category || 'custom'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(g)
    return acc
  }, {})

  const handleSave = () => {
    if (!newName.trim()) return
    saveGroup(newName.trim(), undefined, newCategory)
    setNewName('')
    setShowSaveForm(false)
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between p-3 border-b border-ash-stone/50">
        <span className="text-sm font-medium text-parchment flex items-center gap-2">
          <FolderOpen className="h-3.5 w-3.5" />
          Groups
        </span>
        {hasActiveExpressions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSaveForm(!showSaveForm)}
            className="h-7 text-xs text-icon-gold hover:text-icon-gold"
          >
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        )}
      </div>

      {showSaveForm && (
        <div className="p-3 border-b border-ash-stone/50 bg-ash-stone/10 space-y-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Group name..."
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSaveForm(false) }}
          />
          <div className="flex gap-1">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setNewCategory(key)}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] border transition-colors',
                  newCategory === key
                    ? 'border-current bg-current/10'
                    : 'border-ash-stone/50 text-warm-gray hover:border-warm-gray'
                )}
                style={newCategory === key ? { color: CATEGORY_COLORS[key], borderColor: CATEGORY_COLORS[key] } : undefined}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <Button size="sm" className="h-7 text-xs flex-1" onClick={handleSave} disabled={!newName.trim()}>
              <Check className="h-3 w-3 mr-1" />
              Save Group
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowSaveForm(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {Object.entries(grouped).map(([category, groups]) => (
            <div key={category}>
              <div className="px-2 mb-1 text-[10px] uppercase tracking-widest text-warm-gray/60">
                {CATEGORY_LABELS[category] || category}
              </div>
              <div className="space-y-1">
                {groups.map((group) => {
                  const isActive = activeGroupId === group.id
                  const catColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.custom

                  return (
                    <div
                      key={group.id}
                      className={cn(
                        'group flex items-start gap-2 p-2 rounded-md transition-colors cursor-pointer',
                        'hover:bg-ash-stone/30',
                        isActive && 'bg-ash-stone/20 border-l-2',
                      )}
                      style={isActive ? { borderLeftColor: catColor } : undefined}
                      onClick={() => loadGroup(group.id)}
                    >
                      <BookOpen className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: catColor }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-parchment truncate">{group.name}</span>
                          {group.isBuiltIn && (
                            <Badge variant="outline" className="text-[9px] h-3.5 px-1 border-warm-gray/30 text-warm-gray/60">
                              preset
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-warm-gray mt-0.5">
                          {group.expressions.length} expression{group.expressions.length !== 1 ? 's' : ''}
                        </div>
                        {group.description && (
                          <div className="text-[10px] text-warm-gray/60 mt-0.5 truncate">
                            {group.description}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); loadGroup(group.id) }}
                          className="h-6 w-6"
                          title="Load"
                        >
                          <Play className="h-3 w-3 text-icon-gold" />
                        </Button>
                        {!group.isBuiltIn && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); deleteGroup(group.id) }}
                            className="h-6 w-6 hover:text-oxide-red"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {equationGroups.length === 0 && (
            <div className="p-4 text-center text-warm-gray text-sm">
              <p>No groups yet</p>
              <p className="text-xs mt-1">Plot 2+ expressions and save them as a group</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {!showSaveForm && hasActiveExpressions && (
        <div className="p-2 border-t border-ash-stone/50">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={() => setShowSaveForm(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Save as Group ({activeExpressionIds.length} expressions)
          </Button>
        </div>
      )}
    </div>
  )
}
