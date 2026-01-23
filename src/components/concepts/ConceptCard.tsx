import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/stores/appStore'
import { truncate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Concept } from '@/types'

interface ConceptCardProps {
  concept: Concept
}

export function ConceptCard({ concept }: ConceptCardProps) {
  const { selectedConcept, setSelectedConcept } = useAppStore()
  const isSelected = selectedConcept?.id === concept.id

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:border-ash-stone",
        isSelected && "border-icon-gold/50 bg-ash-stone/30"
      )}
      onClick={() => setSelectedConcept(isSelected ? null : concept)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{concept.name}</CardTitle>
          <Badge variant={concept.mastery as any}>{concept.mastery}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-warm-gray line-clamp-3">
          {truncate(concept.definition, 150)}
        </p>

        {concept.prerequisites && concept.prerequisites.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-warm-gray mr-1">Prereqs:</span>
            {concept.prerequisites.slice(0, 2).map((prereq) => (
              <span 
                key={prereq.id}
                className="text-xs px-2 py-0.5 bg-ash-stone rounded-full text-warm-gray"
              >
                {prereq.name}
              </span>
            ))}
            {concept.prerequisites.length > 2 && (
              <span className="text-xs text-warm-gray">
                +{concept.prerequisites.length - 2}
              </span>
            )}
          </div>
        )}

        {concept.notes && concept.notes.length > 0 && (
          <div className="text-xs text-warm-gray">
            {concept.notes.length} linked note{concept.notes.length !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
