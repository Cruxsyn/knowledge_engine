import { useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { useConcepts } from '@/hooks/useConcepts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime } from '@/lib/utils'
import { 
  X, 
  Trash2, 
  Edit2,
  Link2,
  GitBranch
} from 'lucide-react'
import { ConceptEditor } from './ConceptEditor'
import { LinkEditor } from './LinkEditor'
import { ConceptGraph } from './ConceptGraph'
import type { MasteryLevel } from '@/types'

const masteryLevels: MasteryLevel[] = ['unknown', 'learning', 'solid', 'teachable']

export function ConceptDetail() {
  const { selectedConcept, setSelectedConcept, triggerRefresh } = useAppStore()
  const { getConceptById, updateMastery, deleteConcept } = useConcepts()
  const [isEditing, setIsEditing] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [showGraph, setShowGraph] = useState(false)

  if (!selectedConcept) return null

  // Get full concept with relationships
  const fullConcept = getConceptById(selectedConcept.id)
  const concept = fullConcept || selectedConcept

  const handleClose = () => {
    setSelectedConcept(null)
    setIsEditing(false)
    setIsLinking(false)
  }

  const handleMasteryChange = (mastery: MasteryLevel) => {
    updateMastery(concept.id, mastery)
    triggerRefresh()
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this concept? All links will be removed.')) {
      deleteConcept(concept.id)
      setSelectedConcept(null)
      triggerRefresh()
    }
  }

  if (isEditing) {
    return <ConceptEditor concept={concept} onClose={() => setIsEditing(false)} />
  }

  if (isLinking) {
    return <LinkEditor concept={concept} onClose={() => setIsLinking(false)} />
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-ash-stone/50">
        <h3 className="font-serif font-semibold text-lg truncate">Concept Details</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setShowGraph(!showGraph)}>
            <GitBranch className="h-4 w-4" />
          </Button>
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
        {showGraph && (
          <div className="h-48 border border-ash-stone/50 rounded-lg overflow-hidden">
            <ConceptGraph conceptId={concept.id} />
          </div>
        )}

        <div>
          <h2 className="text-xl font-serif font-semibold text-parchment mb-3">
            {concept.name}
          </h2>
          
          {/* Mastery Level */}
          <div className="space-y-2">
            <Label className="text-warm-gray">Mastery Level</Label>
            <Select value={concept.mastery} onValueChange={handleMasteryChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {masteryLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    <Badge variant={level as any} className="mr-2">{level}</Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-warm-gray">Definition</Label>
          <p className="text-parchment">{concept.definition}</p>
        </div>

        {concept.intuition && (
          <div className="space-y-2">
            <Label className="text-warm-gray">Intuition</Label>
            <p className="text-parchment">{concept.intuition}</p>
          </div>
        )}

        {concept.pitfalls && (
          <div className="space-y-2">
            <Label className="text-warm-gray">Common Pitfalls</Label>
            <p className="text-parchment text-oxide-red/80">{concept.pitfalls}</p>
          </div>
        )}

        {/* Prerequisites */}
        <div className="space-y-2">
          <Label className="text-warm-gray">Prerequisites</Label>
          {concept.prerequisites && concept.prerequisites.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {concept.prerequisites.map((prereq) => (
                <Badge 
                  key={prereq.id} 
                  variant="outline"
                  className="cursor-pointer hover:bg-ash-stone/50"
                  onClick={() => {
                    const full = getConceptById(prereq.id)
                    if (full) setSelectedConcept(full)
                  }}
                >
                  {prereq.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-warm-gray">No prerequisites defined</p>
          )}
        </div>

        {/* Dependents */}
        {concept.dependents && concept.dependents.length > 0 && (
          <div className="space-y-2">
            <Label className="text-warm-gray">Used By</Label>
            <div className="flex flex-wrap gap-2">
              {concept.dependents.map((dep) => (
                <Badge 
                  key={dep.id} 
                  variant="outline"
                  className="cursor-pointer hover:bg-ash-stone/50"
                  onClick={() => {
                    const full = getConceptById(dep.id)
                    if (full) setSelectedConcept(full)
                  }}
                >
                  {dep.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Linked Notes */}
        <div className="space-y-2">
          <Label className="text-warm-gray">Linked Notes</Label>
          {concept.notes && concept.notes.length > 0 ? (
            <div className="space-y-2">
              {concept.notes.map((note) => (
                <div 
                  key={note.id}
                  className="p-3 bg-ash-stone/30 rounded-lg"
                >
                  <p className="font-medium text-parchment">{note.title}</p>
                  <p className="text-sm text-warm-gray line-clamp-2">{note.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-warm-gray">No notes linked yet</p>
          )}
        </div>

        <div className="text-xs text-warm-gray space-y-1">
          <p>Created: {formatDateTime(concept.created_at)}</p>
          <p>Updated: {formatDateTime(concept.updated_at)}</p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-ash-stone/50 space-y-2">
        <Button 
          variant="gold" 
          className="w-full"
          onClick={() => setIsLinking(true)}
        >
          <Link2 className="h-4 w-4 mr-2" />
          Manage Links
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
