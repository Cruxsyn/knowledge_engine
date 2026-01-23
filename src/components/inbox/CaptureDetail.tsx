import { useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { useCaptures } from '@/hooks/useCaptures'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime } from '@/lib/utils'
import { 
  X, 
  Trash2, 
  ArrowRight, 
  ExternalLink,
  Save,
  Edit2
} from 'lucide-react'
import type { CaptureStatus } from '@/types'

const statusOptions: CaptureStatus[] = ['new', 'processing', 'distilled', 'linked', 'published']

export function CaptureDetail() {
  const { selectedCapture, setSelectedCapture, triggerRefresh } = useAppStore()
  const { updateCapture, updateStatus, deleteCapture } = useCaptures()
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [editedWhySaved, setEditedWhySaved] = useState('')

  if (!selectedCapture) return null

  const handleClose = () => {
    setSelectedCapture(null)
    setIsEditing(false)
  }

  const handleEdit = () => {
    setEditedTitle(selectedCapture.title)
    setEditedContent(selectedCapture.content)
    setEditedWhySaved(selectedCapture.why_saved || '')
    setIsEditing(true)
  }

  const handleSave = () => {
    updateCapture(selectedCapture.id, {
      title: editedTitle,
      content: editedContent,
      why_saved: editedWhySaved || undefined,
    })
    setIsEditing(false)
    triggerRefresh()
  }

  const handleStatusChange = (status: CaptureStatus) => {
    updateStatus(selectedCapture.id, status)
    triggerRefresh()
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this capture?')) {
      deleteCapture(selectedCapture.id)
      setSelectedCapture(null)
      triggerRefresh()
    }
  }

  const currentStatusIndex = statusOptions.indexOf(selectedCapture.status)
  const nextStatus = statusOptions[currentStatusIndex + 1]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-ash-stone/50">
        <h3 className="font-serif font-semibold text-lg truncate">
          {isEditing ? 'Edit Capture' : 'Capture Details'}
        </h3>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <Button variant="ghost" size="icon" onClick={handleEdit}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={8}
              />
            </div>
            <div className="space-y-2">
              <Label>Why did you save this?</Label>
              <Input
                value={editedWhySaved}
                onChange={(e) => setEditedWhySaved(e.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-serif font-semibold text-parchment mb-2">
                {selectedCapture.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={selectedCapture.status as any}>{selectedCapture.status}</Badge>
                <Badge variant={selectedCapture.priority}>{selectedCapture.priority}</Badge>
                <span className="text-xs text-warm-gray capitalize">{selectedCapture.type}</span>
              </div>
            </div>

            {selectedCapture.content && (
              <div className="space-y-2">
                <Label className="text-warm-gray">Content</Label>
                <p className="text-parchment whitespace-pre-wrap">{selectedCapture.content}</p>
              </div>
            )}

            {selectedCapture.why_saved && (
              <div className="space-y-2">
                <Label className="text-warm-gray">Why Saved</Label>
                <p className="text-parchment">{selectedCapture.why_saved}</p>
              </div>
            )}

            {selectedCapture.source?.url && (
              <div className="space-y-2">
                <Label className="text-warm-gray">Source</Label>
                <a 
                  href={selectedCapture.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-deep-azure hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  {selectedCapture.source.url}
                </a>
              </div>
            )}

            {selectedCapture.topic && (
              <div className="space-y-2">
                <Label className="text-warm-gray">Topic</Label>
                <span className="text-xs px-2 py-1 bg-ash-stone rounded-full">
                  {selectedCapture.topic}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-warm-gray">Status Workflow</Label>
              <Select value={selectedCapture.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-warm-gray space-y-1">
              <p>Created: {formatDateTime(selectedCapture.created_at)}</p>
              <p>Updated: {formatDateTime(selectedCapture.updated_at)}</p>
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-ash-stone/50 space-y-2">
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button variant="gold" className="flex-1" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        ) : (
          <>
            {nextStatus && (
              <Button 
                variant="gold" 
                className="w-full"
                onClick={() => handleStatusChange(nextStatus)}
              >
                Move to {nextStatus}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            <Button 
              variant="outline" 
              className="w-full text-oxide-red hover:text-oxide-red hover:bg-oxide-red/10"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
