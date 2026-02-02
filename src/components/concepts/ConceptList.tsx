import { useConcepts } from '@/hooks/useConcepts'
import { ConceptCard } from './ConceptCard'
import { Loader2, Lightbulb } from 'lucide-react'

export function ConceptList() {
  const { concepts, loading, error } = useConcepts()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-icon-gold" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-oxide-red">
        <p>Failed to load concepts</p>
        <p className="text-sm text-warm-gray mt-2">{error.message}</p>
      </div>
    )
  }

  if (concepts.length === 0) {
    return (
      <div className="text-center py-12">
        <Lightbulb className="h-12 w-12 mx-auto text-warm-gray/50 mb-4" />
        <h3 className="text-lg font-medium text-parchment mb-2">No concepts yet</h3>
        <p className="text-warm-gray">
          Create your first concept to start building your knowledge graph
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {concepts.map((concept) => (
        <ConceptCard key={concept.id} concept={concept} />
      ))}
    </div>
  )
}
