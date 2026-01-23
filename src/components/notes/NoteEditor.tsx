import { useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { useNotes } from '@/hooks/useNotes'
import { useConcepts } from '@/hooks/useConcepts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { X, Star, Save } from 'lucide-react'
import type { AtomicNote } from '@/types'

interface NoteEditorProps {
  note?: AtomicNote
  onClose: () => void
}

export function NoteEditor({ note, onClose }: NoteEditorProps) {
  const { triggerRefresh, setSelectedNote } = useAppStore()
  const { createNote, updateNote } = useNotes()
  const { concepts } = useConcepts()
  
  const [title, setTitle] = useState(note?.title || '')
  const [summary, setSummary] = useState(note?.summary || '')
  const [keyClaim, setKeyClaim] = useState(note?.key_claim || '')
  const [example, setExample] = useState(note?.example || '')
  const [confidence, setConfidence] = useState(note?.confidence || 3)
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>(
    note?.concepts?.map(c => c.id) || []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!note

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !summary.trim() || !keyClaim.trim()) return

    setIsSubmitting(true)
    try {
      if (isEditing) {
        updateNote(note.id, {
          title: title.trim(),
          summary: summary.trim(),
          key_claim: keyClaim.trim(),
          example: example.trim() || undefined,
          confidence,
        })
      } else {
        const newNote = createNote({
          title: title.trim(),
          summary: summary.trim(),
          key_claim: keyClaim.trim(),
          example: example.trim() || undefined,
          confidence,
          concept_ids: selectedConcepts,
        })
        if (newNote) {
          setSelectedNote(newNote)
        }
      }
      triggerRefresh()
      onClose()
    } catch (err) {
      console.error('Failed to save note:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleConcept = (conceptId: string) => {
    setSelectedConcepts(prev => 
      prev.includes(conceptId)
        ? prev.filter(id => id !== conceptId)
        : [...prev, conceptId]
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-ash-stone/50">
        <h3 className="font-serif font-semibold text-lg">
          {isEditing ? 'Edit Note' : 'New Atomic Note'}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="One idea, clearly named"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">Summary * (2-5 sentences)</Label>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="What does this mean? How would you explain it?"
            rows={4}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="keyClaim">Key Claim *</Label>
          <Input
            id="keyClaim"
            value={keyClaim}
            onChange={(e) => setKeyClaim(e.target.value)}
            placeholder="The core insight in one sentence"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="example">Example / Application</Label>
          <Textarea
            id="example"
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="A concrete example or use case"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Confidence Level</Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setConfidence(level)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={cn(
                    "h-6 w-6",
                    level <= confidence 
                      ? "fill-icon-gold text-icon-gold" 
                      : "text-ash-stone hover:text-warm-gray"
                  )}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-warm-gray">
              {confidence === 1 && 'Very uncertain'}
              {confidence === 2 && 'Somewhat uncertain'}
              {confidence === 3 && 'Moderately confident'}
              {confidence === 4 && 'Confident'}
              {confidence === 5 && 'Very confident'}
            </span>
          </div>
        </div>

        {!isEditing && concepts.length > 0 && (
          <div className="space-y-2">
            <Label>Link to Concepts</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {concepts.map((concept) => (
                <button
                  key={concept.id}
                  type="button"
                  onClick={() => toggleConcept(concept.id)}
                  className={cn(
                    "px-2 py-1 rounded-full text-sm transition-colors",
                    selectedConcepts.includes(concept.id)
                      ? "bg-deep-azure/30 text-deep-azure border border-deep-azure/50"
                      : "bg-ash-stone text-warm-gray hover:bg-ash-stone/80"
                  )}
                >
                  {concept.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Distillation Checklist */}
        <div className="p-3 bg-ash-stone/30 rounded-lg space-y-2">
          <Label className="text-icon-gold">Distillation Checklist</Label>
          <ul className="text-sm text-warm-gray space-y-1">
            <li>• What does this mean?</li>
            <li>• What is it used for?</li>
            <li>• What does it depend on?</li>
            <li>• What are common mistakes?</li>
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
          disabled={!title.trim() || !summary.trim() || !keyClaim.trim() || isSubmitting}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create Note'}
        </Button>
      </div>
    </div>
  )
}
