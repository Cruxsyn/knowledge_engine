import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { useNotes } from '@/hooks/useNotes'
import { useConcepts } from '@/hooks/useConcepts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { X, Star, Save } from 'lucide-react'
import type { AtomicNote, NoteType, NoteContent } from '@/types'
import { NOTE_TYPE_CONFIGS } from '@/types'
import { getSortedTemplates, trackNoteCreation, getLastUsedType, type NoteTemplate } from '@/lib/noteTemplates'

interface NoteEditorProps {
  note?: AtomicNote
  onClose: () => void
}

function getDefaultContent(noteType: NoteType): NoteContent {
  const config = NOTE_TYPE_CONFIGS.find(c => c.value === noteType)
  if (!config) return { summary: '', key_claim: '' }
  
  const content: Record<string, string> = {}
  for (const field of config.fields) {
    content[field.name] = ''
  }
  return content as NoteContent
}

export function NoteEditor({ note, onClose }: NoteEditorProps) {
  const { triggerRefresh, setSelectedNote } = useAppStore()
  const { createNote, updateNote } = useNotes()
  const { concepts } = useConcepts()
  
  const initialType = note?.note_type || getLastUsedType() || 'definition'
  const [title, setTitle] = useState(note?.title || '')
  const [noteType, setNoteType] = useState<NoteType>(initialType)
  const [content, setContent] = useState<Record<string, string>>(
    (note?.content as Record<string, string>) || getDefaultContent(initialType) as Record<string, string>
  )
  const [confidence, setConfidence] = useState(note?.confidence || 3)
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>(
    note?.concepts?.map(c => c.id) || []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)

  const isEditing = !!note
  const typeConfig = NOTE_TYPE_CONFIGS.find(c => c.value === noteType)
  const templates = getSortedTemplates(noteType)

  // Reset content when type changes (only for new notes)
  useEffect(() => {
    if (!isEditing) {
      setContent(getDefaultContent(noteType) as Record<string, string>)
      setActiveTemplate(null)
    }
  }, [noteType, isEditing])

  const applyTemplate = (template: NoteTemplate) => {
    setContent(template.fields as Record<string, string>)
    setActiveTemplate(template.id)
  }

  const updateContentField = (fieldName: string, value: string) => {
    setContent(prev => ({ ...prev, [fieldName]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    // Validate required fields
    const requiredFields = typeConfig?.fields.filter(f => f.required) || []
    const missingRequired = requiredFields.some(f => !content[f.name]?.trim())
    if (missingRequired) return

    setIsSubmitting(true)
    try {
      if (isEditing) {
        updateNote(note.id, {
          title: title.trim(),
          note_type: noteType,
          content: content as NoteContent,
          confidence,
        })
      } else {
        const newNote = createNote({
          title: title.trim(),
          note_type: noteType,
          content: content as NoteContent,
          confidence,
          concept_ids: selectedConcepts,
        })
        if (newNote) {
          setSelectedNote(newNote)
        }
        trackNoteCreation(noteType, activeTemplate || undefined)
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

  const isFormValid = () => {
    if (!title.trim()) return false
    const requiredFields = typeConfig?.fields.filter(f => f.required) || []
    return !requiredFields.some(f => !content[f.name]?.trim())
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
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name this note"
            required
          />
        </div>

        {/* Note Type Selector */}
        <div className="space-y-2">
          <Label>Note Type</Label>
          <Select value={noteType} onValueChange={(value) => setNoteType(value as NoteType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOTE_TYPE_CONFIGS.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col">
                    <span>{type.label}</span>
                    <span className="text-xs text-warm-gray">{type.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template chips */}
        {!isEditing && templates.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-warm-gray">Quick Templates</Label>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs transition-colors border',
                    activeTemplate === t.id
                      ? 'bg-icon-gold/20 text-icon-gold border-icon-gold/50'
                      : 'bg-ash-stone/30 text-warm-gray border-ash-stone/50 hover:bg-ash-stone/50 hover:text-parchment'
                  )}
                >
                  {t.name}
                  {t.category && (
                    <span className="ml-1 text-[9px] opacity-60">{t.category}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Fields based on Note Type */}
        {typeConfig && (
          <div className="space-y-4 p-4 bg-ash-stone/20 rounded-lg">
            <p className="text-xs text-warm-gray mb-2">{typeConfig.description}</p>
            {typeConfig.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label} {field.required && '*'}
                </Label>
                {field.multiline ? (
                  <Textarea
                    id={field.name}
                    value={content[field.name] || ''}
                    onChange={(e) => updateContentField(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                    required={field.required}
                  />
                ) : (
                  <Input
                    id={field.name}
                    value={content[field.name] || ''}
                    onChange={(e) => updateContentField(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Confidence Level */}
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

        {/* Link to Concepts */}
        {concepts.length > 0 && (
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
          disabled={!isFormValid() || isSubmitting}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create Note'}
        </Button>
      </div>
    </div>
  )
}
