import { useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { useNotes } from '@/hooks/useNotes'
import { useConcepts } from '@/hooks/useConcepts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { 
  X, 
  Trash2, 
  Star,
  Link2,
  CheckCircle,
  Edit2
} from 'lucide-react'
import { NoteEditor } from './NoteEditor'

export function NoteDetail() {
  const { selectedNote, setSelectedNote, triggerRefresh } = useAppStore()
  const { updateNote, markReviewed, deleteNote, linkToConcept, unlinkFromConcept } = useNotes()
  const { concepts: allConcepts } = useConcepts()
  const [isEditing, setIsEditing] = useState(false)
  const [isLinking, setIsLinking] = useState(false)

  if (!selectedNote) return null

  const handleClose = () => {
    setSelectedNote(null)
    setIsEditing(false)
  }

  const handleMarkReviewed = () => {
    markReviewed(selectedNote.id)
    triggerRefresh()
  }

  const handleUpdateConfidence = (confidence: number) => {
    updateNote(selectedNote.id, { confidence })
    triggerRefresh()
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNote(selectedNote.id)
      setSelectedNote(null)
      triggerRefresh()
    }
  }

  const handleLinkConcept = (conceptId: string) => {
    linkToConcept(selectedNote.id, conceptId)
    setIsLinking(false)
    triggerRefresh()
  }

  const handleUnlinkConcept = (conceptId: string) => {
    unlinkFromConcept(selectedNote.id, conceptId)
    triggerRefresh()
  }

  const linkedConceptIds = new Set(selectedNote.concepts?.map(c => c.id) || [])
  const availableConcepts = allConcepts.filter(c => !linkedConceptIds.has(c.id))

  if (isEditing) {
    return <NoteEditor note={selectedNote} onClose={() => setIsEditing(false)} />
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-ash-stone/50">
        <h3 className="font-serif font-semibold text-lg truncate">Note Details</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h2 className="text-xl font-serif font-semibold text-parchment mb-3">
            {selectedNote.title}
          </h2>
          
          {/* Confidence Stars */}
          <div className="flex items-center gap-2 mb-4">
            <Label className="text-warm-gray text-sm">Confidence:</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => handleUpdateConfidence(level)}
                  className="p-0.5 hover:scale-110 transition-transform"
                >
                  <Star
                    className={cn(
                      "h-5 w-5",
                      level <= selectedNote.confidence 
                        ? "fill-icon-gold text-icon-gold" 
                        : "text-ash-stone hover:text-warm-gray"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-warm-gray">Summary</Label>
          <p className="text-parchment">{selectedNote.summary}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-warm-gray">Key Claim</Label>
          <p className="text-parchment italic">"{selectedNote.key_claim}"</p>
        </div>

        {selectedNote.example && (
          <div className="space-y-2">
            <Label className="text-warm-gray">Example / Application</Label>
            <p className="text-parchment">{selectedNote.example}</p>
          </div>
        )}

        {/* Linked Concepts */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-warm-gray">Linked Concepts</Label>
            {!isLinking && availableConcepts.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setIsLinking(true)}>
                <Link2 className="h-4 w-4 mr-1" />
                Link
              </Button>
            )}
          </div>
          
          {isLinking && (
            <Select onValueChange={handleLinkConcept}>
              <SelectTrigger>
                <SelectValue placeholder="Select a concept to link" />
              </SelectTrigger>
              <SelectContent>
                {availableConcepts.map((concept) => (
                  <SelectItem key={concept.id} value={concept.id}>
                    {concept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedNote.concepts && selectedNote.concepts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedNote.concepts.map((concept) => (
                <Badge 
                  key={concept.id} 
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  {concept.name}
                  <button
                    onClick={() => handleUnlinkConcept(concept.id)}
                    className="ml-1 hover:text-oxide-red"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-warm-gray">No concepts linked yet</p>
          )}
        </div>

        <div className="text-xs text-warm-gray space-y-1">
          <p>Created: {formatDateTime(selectedNote.created_at)}</p>
          <p>Updated: {formatDateTime(selectedNote.updated_at)}</p>
          {selectedNote.last_reviewed && (
            <p>Last Reviewed: {formatDateTime(selectedNote.last_reviewed)}</p>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-ash-stone/50 space-y-2">
        <Button 
          variant="gold" 
          className="w-full"
          onClick={handleMarkReviewed}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark as Reviewed
        </Button>
        <Button 
          variant="outline" 
          className="w-full text-oxide-red hover:text-oxide-red hover:bg-oxide-red/10"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  )
}
