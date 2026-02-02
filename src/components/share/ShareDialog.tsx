import { useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ShareSelectionPanel } from './ShareSelectionPanel'
import { ShareLinkDisplay } from './ShareLinkDisplay'
import { useShareStore } from '@/stores/shareStore'
import { useConcepts } from '@/hooks/useConcepts'
import { useNotes } from '@/hooks/useNotes'
import { getAllLinks } from '@/db/queries/links'
import { Share2, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ShareDialog() {
  const { concepts } = useConcepts()
  const { notes } = useNotes()

  const {
    isOpen,
    setOpen,
    selectedConceptIds,
    selectedNoteIds,
    toggleConcept,
    toggleNote,
    selectAllConcepts,
    selectAllNotes,
    deselectAllConcepts,
    deselectAllNotes,
    includeRelationships,
    setIncludeRelationships,
    shareResult,
    isGenerating,
    generateShare,
    estimateSize
  } = useShareStore()

  // Get all links for sharing
  const links = useMemo(() => {
    try {
      return getAllLinks()
    } catch {
      return []
    }
  }, [])

  // Calculate estimated size
  const estimatedSize = useMemo(() => {
    if (selectedConceptIds.size === 0 && selectedNoteIds.size === 0) {
      return 0
    }
    return estimateSize(concepts, notes, links)
  }, [concepts, notes, links, selectedConceptIds, selectedNoteIds, estimateSize])

  const totalSelected = selectedConceptIds.size + selectedNoteIds.size
  const isOverLimit = estimatedSize > 1500

  const handleGenerate = () => {
    generateShare(concepts, notes, links)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-icon-gold" />
            Share Knowledge
          </DialogTitle>
          <DialogDescription>
            Select the concepts and notes you want to share. A link will be generated that anyone can use to view the shared content.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 py-4">
          {/* Concepts column */}
          <div className="flex flex-col min-h-0 border border-ash-stone/30 rounded-lg p-3">
            <ShareSelectionPanel
              type="concepts"
              concepts={concepts}
              selectedIds={selectedConceptIds}
              onToggle={toggleConcept}
              onSelectAll={selectAllConcepts}
              onDeselectAll={deselectAllConcepts}
            />
          </div>

          {/* Notes column */}
          <div className="flex flex-col min-h-0 border border-ash-stone/30 rounded-lg p-3">
            <ShareSelectionPanel
              type="notes"
              notes={notes}
              selectedIds={selectedNoteIds}
              onToggle={toggleNote}
              onSelectAll={selectAllNotes}
              onDeselectAll={deselectAllNotes}
            />
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between py-3 border-t border-ash-stone/30">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeRelationships}
              onChange={(e) => setIncludeRelationships(e.target.checked)}
              className="w-4 h-4 rounded border-ash-stone bg-obsidian text-icon-gold focus:ring-icon-gold"
            />
            <span className="text-sm text-warm-gray">
              Include concept relationships
            </span>
          </label>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-warm-gray">
              Selected: {totalSelected} item{totalSelected !== 1 ? 's' : ''}
            </span>
            <span className={cn(
              "text-warm-gray",
              isOverLimit && "text-oxide-red"
            )}>
              ~{estimatedSize} chars
              {isOverLimit && ' (too large)'}
            </span>
          </div>
        </div>

        {/* Share result or generate button */}
        {shareResult?.success ? (
          <div className="pt-3 border-t border-ash-stone/30">
            <Label className="text-sm text-warm-gray mb-2 block">
              Your share link
            </Label>
            <ShareLinkDisplay url={shareResult.url} size={shareResult.size} />
          </div>
        ) : (
          <DialogFooter className="pt-3 border-t border-ash-stone/30">
            {shareResult && !shareResult.success && (
              <div className="flex items-center gap-2 text-sm text-oxide-red mr-auto">
                <AlertCircle className="h-4 w-4" />
                {shareResult.error}
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="gold"
              onClick={handleGenerate}
              disabled={totalSelected === 0 || isGenerating || isOverLimit}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Generate Link
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
