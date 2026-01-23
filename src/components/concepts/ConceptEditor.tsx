import { useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { useConcepts } from '@/hooks/useConcepts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { X, Save } from 'lucide-react'
import type { Concept } from '@/types'

interface ConceptEditorProps {
  concept?: Concept
  onClose: () => void
}

export function ConceptEditor({ concept, onClose }: ConceptEditorProps) {
  const { triggerRefresh, setSelectedConcept } = useAppStore()
  const { createConcept, updateConcept, concepts } = useConcepts()
  
  const [name, setName] = useState(concept?.name || '')
  const [definition, setDefinition] = useState(concept?.definition || '')
  const [intuition, setIntuition] = useState(concept?.intuition || '')
  const [pitfalls, setPitfalls] = useState(concept?.pitfalls || '')
  const [selectedPrereqs, setSelectedPrereqs] = useState<string[]>(
    concept?.prerequisites?.map(p => p.id) || []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!concept

  // Filter out current concept from available prerequisites
  const availablePrereqs = concepts.filter(c => c.id !== concept?.id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !definition.trim()) return

    setIsSubmitting(true)
    try {
      if (isEditing) {
        updateConcept(concept.id, {
          name: name.trim(),
          definition: definition.trim(),
          intuition: intuition.trim() || undefined,
          pitfalls: pitfalls.trim() || undefined,
        })
      } else {
        const newConcept = createConcept({
          name: name.trim(),
          definition: definition.trim(),
          intuition: intuition.trim() || undefined,
          pitfalls: pitfalls.trim() || undefined,
          prerequisite_ids: selectedPrereqs,
        })
        if (newConcept) {
          setSelectedConcept(newConcept)
        }
      }
      triggerRefresh()
      onClose()
    } catch (err) {
      console.error('Failed to save concept:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePrereq = (prereqId: string) => {
    setSelectedPrereqs(prev => 
      prev.includes(prereqId)
        ? prev.filter(id => id !== prereqId)
        : [...prev, prereqId]
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-ash-stone/50">
        <h3 className="font-serif font-semibold text-lg">
          {isEditing ? 'Edit Concept' : 'New Concept'}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Concept Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Recursion, REST API, Closures"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="definition">Definition *</Label>
          <Textarea
            id="definition"
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder="A clear, concise definition of this concept"
            rows={4}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="intuition">Intuition</Label>
          <Textarea
            id="intuition"
            value={intuition}
            onChange={(e) => setIntuition(e.target.value)}
            placeholder="How would you explain this to someone? What analogy helps?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pitfalls">Common Pitfalls</Label>
          <Textarea
            id="pitfalls"
            value={pitfalls}
            onChange={(e) => setPitfalls(e.target.value)}
            placeholder="What mistakes do people commonly make with this concept?"
            rows={3}
          />
        </div>

        {!isEditing && availablePrereqs.length > 0 && (
          <div className="space-y-2">
            <Label>Prerequisites</Label>
            <p className="text-xs text-warm-gray mb-2">
              What concepts should someone understand before learning this?
            </p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {availablePrereqs.map((prereq) => (
                <button
                  key={prereq.id}
                  type="button"
                  onClick={() => togglePrereq(prereq.id)}
                  className={cn(
                    "px-2 py-1 rounded-full text-sm transition-colors",
                    selectedPrereqs.includes(prereq.id)
                      ? "bg-icon-gold/30 text-icon-gold border border-icon-gold/50"
                      : "bg-ash-stone text-warm-gray hover:bg-ash-stone/80"
                  )}
                >
                  {prereq.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Concept Template Reminder */}
        <div className="p-3 bg-ash-stone/30 rounded-lg space-y-2">
          <Label className="text-icon-gold">Concept Checklist</Label>
          <ul className="text-sm text-warm-gray space-y-1">
            <li>• Definition: What is it?</li>
            <li>• Intuition: How to think about it?</li>
            <li>• Prerequisites: What do you need to know first?</li>
            <li>• Pitfalls: What goes wrong?</li>
            <li>• Examples: Link notes with concrete cases</li>
          </ul>
        </div>
      </form>

      {/* Footer */}
      <div className="p-4 border-t border-ash-stone/50 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          variant="gold" 
          className="flex-1"
          onClick={handleSubmit}
          disabled={!name.trim() || !definition.trim() || isSubmitting}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create Concept'}
        </Button>
      </div>
    </div>
  )
}
