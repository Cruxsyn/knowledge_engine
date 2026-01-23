import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { ConceptList } from '@/components/concepts/ConceptList'
import { ConceptDetail } from '@/components/concepts/ConceptDetail'
import { ConceptEditor } from '@/components/concepts/ConceptEditor'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { useConcepts } from '@/hooks/useConcepts'
import type { MasteryLevel } from '@/types'

type ViewMode = MasteryLevel | 'all' | 'missing-prereqs' | 'missing-examples'

const masteryTabs: { value: ViewMode; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'learning', label: 'Learning' },
  { value: 'solid', label: 'Solid' },
  { value: 'teachable', label: 'Teachable' },
]

export function ConceptsPage() {
  const { selectedConcept, setSelectedConcept, setMasteryFilter } = useAppStore()
  const { getCounts } = useConcepts()
  const counts = getCounts()
  const [isCreating, setIsCreating] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('all')

  const handleNewConcept = () => {
    setSelectedConcept(null)
    setIsCreating(true)
  }

  const handleCloseEditor = () => {
    setIsCreating(false)
  }

  const handleViewChange = (value: ViewMode) => {
    setViewMode(value)
    if (value === 'all' || value === 'missing-prereqs' || value === 'missing-examples') {
      setMasteryFilter('all')
    } else {
      setMasteryFilter(value as MasteryLevel)
    }
  }

  const totalCount = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0

  return (
    <>
      <Header 
        title="Concepts" 
        subtitle={totalCount > 0 ? `${totalCount} concepts in your knowledge graph` : undefined}
        actions={
          <Button variant="gold" size="sm" onClick={handleNewConcept}>
            <Plus className="h-4 w-4 mr-2" />
            New Concept
          </Button>
        }
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-3 border-b border-ash-stone/50">
            <Tabs value={viewMode} onValueChange={(v) => handleViewChange(v as ViewMode)}>
              <TabsList>
                {masteryTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                    {counts && tab.value !== 'all' && tab.value in counts && counts[tab.value as MasteryLevel] > 0 && (
                      <span className="ml-2 text-xs bg-ash-stone px-1.5 py-0.5 rounded-full">
                        {counts[tab.value as MasteryLevel]}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <ConceptList viewMode={viewMode} />
          </div>
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
