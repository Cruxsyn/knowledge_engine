import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { ConceptList } from '@/components/concepts/ConceptList'
import { ConceptDetail } from '@/components/concepts/ConceptDetail'
import { ConceptEditor } from '@/components/concepts/ConceptEditor'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { useConcepts } from '@/hooks/useConcepts'

export function ConceptsPage() {
  const { selectedConcept, setSelectedConcept } = useAppStore()
  const { concepts } = useConcepts()
  const [isCreating, setIsCreating] = useState(false)

  const handleNewConcept = () => {
    setSelectedConcept(null)
    setIsCreating(true)
  }

  const handleCloseEditor = () => {
    setIsCreating(false)
  }

  return (
    <>
      <Header
        title="Concepts"
        subtitle={concepts.length > 0 ? `${concepts.length} concepts in your knowledge graph` : undefined}
        actions={
          <Button variant="gold" size="sm" onClick={handleNewConcept}>
            <Plus className="h-4 w-4 mr-2" />
            New Concept
          </Button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <ConceptList />
        </div>

        {(selectedConcept || isCreating) && (
          <div className="w-[500px] border-l border-ash-stone/50 overflow-y-auto">
            {isCreating ? (
              <ConceptEditor onClose={handleCloseEditor} />
            ) : (
              <ConceptDetail />
            )}
          </div>
        )}
      </div>
    </>
  )
}
