import { useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { useConcepts } from '@/hooks/useConcepts'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Plus, Trash2, ArrowRight } from 'lucide-react'
import type { Concept, RelationshipType } from '@/types'

const relationshipTypes: { value: RelationshipType; label: string; description: string }[] = [
  { value: 'prerequisite_of', label: 'Prerequisite of', description: 'This concept must be learned before the target' },
  { value: 'depends_on', label: 'Depends on', description: 'This concept requires the target' },
  { value: 'explains', label: 'Explains', description: 'This concept clarifies the target' },
  { value: 'contradicts', label: 'Contradicts', description: 'This concept conflicts with the target' },
  { value: 'refines', label: 'Refines', description: 'This concept is a more specific version of the target' },
  { value: 'example_of', label: 'Example of', description: 'This concept is an instance of the target' },
  { value: 'used_in', label: 'Used in', description: 'This concept is applied in the target' },
]

interface LinkEditorProps {
  concept: Concept
  onClose: () => void
}

export function LinkEditor({ concept, onClose }: LinkEditorProps) {
  const { triggerRefresh } = useAppStore()
  const { concepts, getConceptLinks, createLink, deleteLink } = useConcepts()
  
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [selectedRelationship, setSelectedRelationship] = useState<RelationshipType>('depends_on')
  const [reason, setReason] = useState('')
  
  const links = getConceptLinks(concept.id)
  const otherConcepts = concepts.filter(c => c.id !== concept.id)

  const handleAddLink = () => {
    if (!selectedTarget || !selectedRelationship) return
    
    createLink({
      source_id: concept.id,
      target_id: selectedTarget,
      relationship: selectedRelationship,
      reason: reason.trim() || undefined,
    })
    
    setSelectedTarget('')
    setReason('')
    triggerRefresh()
  }

  const handleDeleteLink = (linkId: string) => {
    deleteLink(linkId)
    triggerRefresh()
  }

  const getConceptName = (id: string) => {
    return concepts.find(c => c.id === id)?.name || 'Unknown'
  }

  const outgoingLinks = links.filter(l => l.source_id === concept.id)
  const incomingLinks = links.filter(l => l.target_id === concept.id)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-ash-stone/50">
        <h3 className="font-serif font-semibold text-lg">
          Manage Links: {concept.name}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Add New Link */}
        <div className="space-y-4 p-4 bg-ash-stone/30 rounded-lg">
          <Label className="text-icon-gold">Add New Link</Label>
          
          <div className="space-y-2">
            <Label className="text-sm text-warm-gray">Relationship Type</Label>
            <Select value={selectedRelationship} onValueChange={(v) => setSelectedRelationship(v as RelationshipType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((rel) => (
                  <SelectItem key={rel.value} value={rel.value}>
                    <div className="flex flex-col">
                      <span>{rel.label}</span>
                      <span className="text-xs text-warm-gray">{rel.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-warm-gray">Target Concept</Label>
            <Select value={selectedTarget} onValueChange={setSelectedTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Select a concept" />
              </SelectTrigger>
              <SelectContent>
                {otherConcepts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-warm-gray">Reason (optional)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why does this link exist?"
            />
          </div>

          <Button 
            variant="gold" 
            className="w-full"
            onClick={handleAddLink}
            disabled={!selectedTarget}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>

        {/* Outgoing Links */}
        <div className="space-y-2">
          <Label className="text-warm-gray">
            Outgoing Links ({outgoingLinks.length})
          </Label>
          {outgoingLinks.length > 0 ? (
            <div className="space-y-2">
              {outgoingLinks.map((link) => (
                <div 
                  key={link.id}
                  className="flex items-center justify-between p-3 bg-charcoal-slate rounded-lg border border-ash-stone/50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-parchment font-medium truncate">
                      {concept.name}
                    </span>
                    <span className="text-xs text-icon-gold shrink-0">
                      {link.relationship.replace('_', ' ')}
                    </span>
                    <ArrowRight className="h-3 w-3 text-warm-gray shrink-0" />
                    <span className="text-sm text-parchment font-medium truncate">
                      {getConceptName(link.target_id)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-oxide-red hover:text-oxide-red hover:bg-oxide-red/10"
                    onClick={() => handleDeleteLink(link.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-warm-gray">No outgoing links</p>
          )}
        </div>

        {/* Incoming Links */}
        <div className="space-y-2">
          <Label className="text-warm-gray">
            Incoming Links ({incomingLinks.length})
          </Label>
          {incomingLinks.length > 0 ? (
            <div className="space-y-2">
              {incomingLinks.map((link) => (
                <div 
                  key={link.id}
                  className="flex items-center justify-between p-3 bg-charcoal-slate rounded-lg border border-ash-stone/50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-parchment font-medium truncate">
                      {getConceptName(link.source_id)}
                    </span>
                    <span className="text-xs text-deep-azure shrink-0">
                      {link.relationship.replace('_', ' ')}
                    </span>
                    <ArrowRight className="h-3 w-3 text-warm-gray shrink-0" />
                    <span className="text-sm text-parchment font-medium truncate">
                      {concept.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-oxide-red hover:text-oxide-red hover:bg-oxide-red/10"
                    onClick={() => handleDeleteLink(link.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-warm-gray">No incoming links</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-ash-stone/50">
        <Button variant="outline" className="w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  )
}
