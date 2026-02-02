import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FormattedText } from '@/components/ui/formatted-text'
import { Check, Search } from 'lucide-react'
import { cn, truncate } from '@/lib/utils'
import type { Concept, AtomicNote } from '@/types'
import { NOTE_TYPE_CONFIGS, getNoteDisplayText } from '@/types'

interface ShareSelectionPanelProps {
  type: 'concepts' | 'notes'
  concepts?: Concept[]
  notes?: AtomicNote[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onDeselectAll: () => void
}

export function ShareSelectionPanel({
  type,
  concepts = [],
  notes = [],
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll
}: ShareSelectionPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const items = type === 'concepts' ? concepts : notes
  const allIds = items.map(item => item.id)
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id))

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items

    const query = searchQuery.toLowerCase()
    if (type === 'concepts') {
      return (items as Concept[]).filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.definition.toLowerCase().includes(query)
      )
    } else {
      return (items as AtomicNote[]).filter(n =>
        n.title.toLowerCase().includes(query)
      )
    }
  }, [items, searchQuery, type])

  const handleSelectAllToggle = () => {
    if (allSelected) {
      onDeselectAll()
    } else {
      onSelectAll(allIds)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-parchment capitalize">
          {type} ({selectedIds.size}/{items.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSelectAllToggle}
          className="text-xs h-7"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </Button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray" />
        <Input
          placeholder={`Search ${type}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 text-sm bg-obsidian border-ash-stone"
        />
      </div>

      <ScrollArea className="flex-1 -mx-1 px-1">
        <div className="space-y-2">
          {filteredItems.length === 0 ? (
            <div className="text-sm text-warm-gray text-center py-4">
              {searchQuery ? 'No matches found' : `No ${type} available`}
            </div>
          ) : (
            filteredItems.map((item) => (
              <SelectableItem
                key={item.id}
                item={item}
                type={type}
                isSelected={selectedIds.has(item.id)}
                onToggle={() => onToggle(item.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

interface SelectableItemProps {
  item: Concept | AtomicNote
  type: 'concepts' | 'notes'
  isSelected: boolean
  onToggle: () => void
}

function SelectableItem({ item, type, isSelected, onToggle }: SelectableItemProps) {
  if (type === 'concepts') {
    const concept = item as Concept
    return (
      <div
        onClick={onToggle}
        className={cn(
          "p-3 rounded-lg border cursor-pointer transition-all",
          "hover:border-ash-stone",
          isSelected
            ? "border-icon-gold/50 bg-icon-gold/10"
            : "border-ash-stone/30 bg-charcoal-slate/50"
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5",
            isSelected
              ? "border-icon-gold bg-icon-gold"
              : "border-ash-stone"
          )}>
            {isSelected && <Check className="h-3 w-3 text-obsidian" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-parchment truncate">
                {concept.name}
              </span>
              <Badge variant={concept.mastery as any} className="text-xs shrink-0">
                {concept.mastery}
              </Badge>
            </div>
            <div className="text-xs text-warm-gray line-clamp-2">
              <FormattedText inline>{truncate(concept.definition, 100)}</FormattedText>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Note item
  const note = item as AtomicNote
  const typeConfig = NOTE_TYPE_CONFIGS.find(t => t.value === note.note_type)
  const displayText = getNoteDisplayText(note)

  return (
    <div
      onClick={onToggle}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all",
        "hover:border-ash-stone",
        isSelected
          ? "border-icon-gold/50 bg-icon-gold/10"
          : "border-ash-stone/30 bg-charcoal-slate/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5",
          isSelected
            ? "border-icon-gold bg-icon-gold"
            : "border-ash-stone"
        )}>
          {isSelected && <Check className="h-3 w-3 text-obsidian" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs shrink-0 capitalize">
              {typeConfig?.label || note.note_type}
            </Badge>
          </div>
          <div className="font-medium text-sm text-parchment truncate mb-1">
            {note.title}
          </div>
          <div className="text-xs text-warm-gray line-clamp-2">
            <FormattedText inline>{truncate(displayText.primary, 80)}</FormattedText>
          </div>
        </div>
      </div>
    </div>
  )
}
