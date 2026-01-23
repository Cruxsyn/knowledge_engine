import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/stores/appStore'
import { formatDate, truncate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Capture } from '@/types'
import { 
  MessageSquare, 
  Link2, 
  Highlighter, 
  Code2, 
  BookOpen, 
  Mic 
} from 'lucide-react'

const typeIcons = {
  thought: MessageSquare,
  clip: Link2,
  highlight: Highlighter,
  code: Code2,
  research: BookOpen,
  lecture: Mic,
}

interface CaptureCardProps {
  capture: Capture
}

export function CaptureCard({ capture }: CaptureCardProps) {
  const { selectedCapture, setSelectedCapture } = useAppStore()
  const isSelected = selectedCapture?.id === capture.id
  const Icon = typeIcons[capture.type]

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:border-ash-stone",
        isSelected && "border-icon-gold/50 bg-ash-stone/30"
      )}
      onClick={() => setSelectedCapture(isSelected ? null : capture)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-4 w-4 text-warm-gray shrink-0" />
            <CardTitle className="text-base truncate">{capture.title}</CardTitle>
          </div>
          <Badge variant={capture.priority}>{capture.priority}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {capture.content && (
          <p className="text-sm text-warm-gray line-clamp-3">
            {truncate(capture.content, 150)}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <Badge variant={capture.status as any}>{capture.status}</Badge>
          <span className="text-xs text-warm-gray">
            {formatDate(capture.created_at)}
          </span>
        </div>

        {capture.topic && (
          <div className="flex items-center gap-1">
            <span className="text-xs px-2 py-0.5 bg-ash-stone rounded-full text-warm-gray">
              {capture.topic}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
