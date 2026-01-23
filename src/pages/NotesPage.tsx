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

type ViewMode = 'all' | 'recent' | 'low-confidence' | 'needs-review'

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
        subtitle={counts ? `${counts.total} notes, ${counts.needsReview} need review` : undefined}
        actions={
          <Button variant="gold" size="sm" onClick={handleNewNote}>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        }
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-3 border-b border-ash-stone/50">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="all">All Notes</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="low-confidence">
                  Low Confidence
                  {counts && counts.lowConfidence > 0 && (
                    <span className="ml-2 text-xs bg-oxide-red/20 text-oxide-red px-1.5 py-0.5 rounded-full">
                      {counts.lowConfidence}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="needs-review">
                  Needs Review
                  {counts && counts.needsReview > 0 && (
                    <span className="ml-2 text-xs bg-icon-gold/20 text-icon-gold px-1.5 py-0.5 rounded-full">
                      {counts.needsReview}
                    </span>
                  )}
                </TabsTrigger>
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
