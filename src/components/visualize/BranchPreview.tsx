import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FormattedText } from '@/components/ui/formatted-text'
import { ArrowRight, GitBranch } from 'lucide-react'
import type { AtomicNote, Concept } from '@/types'
import { getNoteDisplayText } from '@/types'

interface BranchPreviewProps {
  parentNode: {
    id: string
    type: 'note' | 'concept'
    label: string
    data: AtomicNote | Concept
  }
  draftLabel: string
}

export function BranchPreview({ parentNode, draftLabel }: BranchPreviewProps) {
  const parentColor = parentNode.type === 'note' ? '#4A9E8F' : '#5B7DB8'

  return (
    <Card className="p-4 bg-charcoal-slate/95 border-ash-stone/50 backdrop-blur-sm shadow-xl max-w-xs">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <GitBranch className="h-4 w-4 text-icon-gold" />
        <span className="text-sm font-medium text-parchment">Creating Branch</span>
      </div>

      {/* Parent Node */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: parentColor }}
          />
          <Badge
            variant="outline"
            className="text-xs"
            style={{ borderColor: parentColor, color: parentColor }}
          >
            {parentNode.type}
          </Badge>
        </div>
        <h4 className="text-sm font-medium text-parchment mb-1">
          {parentNode.label}
        </h4>
        <div className="text-xs text-warm-gray line-clamp-2">
          {parentNode.type === 'note' ? (
            <FormattedText inline>
              {getNoteDisplayText(parentNode.data as AtomicNote).primary}
            </FormattedText>
          ) : (
            <FormattedText inline>
              {(parentNode.data as Concept).definition}
            </FormattedText>
          )}
        </div>
      </div>

      {/* Connection Arrow */}
      <div className="flex items-center justify-center my-2">
        <div className="flex-1 h-px bg-ash-stone/50" />
        <ArrowRight className="h-4 w-4 text-icon-gold mx-2" />
        <div className="flex-1 h-px bg-ash-stone/50 border-dashed" />
      </div>

      {/* New Note */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-3 h-3 rounded-full border-2 border-dashed"
            style={{ borderColor: '#4A9E8F' }}
          />
          <Badge
            variant="outline"
            className="text-xs border-dashed"
            style={{ borderColor: '#4A9E8F', color: '#4A9E8F' }}
          >
            new note
          </Badge>
        </div>
        <p className="text-sm text-warm-gray/70 italic">
          {draftLabel || 'Untitled'}
        </p>
      </div>

      {/* Hint */}
      <p className="text-xs text-warm-gray/50 mt-3 pt-3 border-t border-ash-stone/30">
        Use the terminal to fill in details
      </p>
    </Card>
  )
}
