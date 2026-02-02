import { Header } from '@/components/layout/Header'
import { NoteList } from '@/components/notes/NoteList'
import { NoteDetail } from '@/components/notes/NoteDetail'
import { NoteEditor } from '@/components/notes/NoteEditor'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { useNotes } from '@/hooks/useNotes'
import { useState } from 'react'
import type { NoteType } from '@/types'

type ViewMode = 'all' | NoteType

const noteTypeTabs: { value: ViewMode; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'definition', label: 'Definitions' },
  { value: 'idea', label: 'Ideas' },
  { value: 'connection', label: 'Connections' },
  { value: 'question', label: 'Questions' },
  { value: 'insight', label: 'Insights' },
  { value: 'process', label: 'Processes' },
  { value: 'example', label: 'Examples' },
  { value: 'other', label: 'Other' },
]

export function NotesPage() {
  const { selectedNote, setSelectedNote } = useAppStore()
  const { getCounts } = useNotes()
  const counts = getCounts()
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [isCreating, setIsCreating] = useState(false)

  const handleNewNote = () => {
    setSelectedNote(null)
    setIsCreating(true)
  }

  const handleCloseEditor = () => {
    setIsCreating(false)
  }

  return (
    <>
      <Header
        title="Atomic Notes"
        subtitle={counts ? `${counts.total} notes` : undefined}
        actions={
          <Button variant="gold" size="sm" onClick={handleNewNote}>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-3 border-b border-ash-stone/50 overflow-x-auto">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                {noteTypeTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                    {counts && tab.value !== 'all' && counts.byType[tab.value as NoteType] > 0 && (
                      <span className="ml-2 text-xs bg-ash-stone px-1.5 py-0.5 rounded-full">
                        {counts.byType[tab.value as NoteType]}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <NoteList viewMode={viewMode} />
          </div>
        </div>

        {(selectedNote || isCreating) && (
          <div className="w-[500px] border-l border-ash-stone/50 overflow-y-auto">
            {isCreating ? (
              <NoteEditor onClose={handleCloseEditor} />
            ) : (
              <NoteDetail />
            )}
          </div>
        )}
      </div>
    </>
  )
}
