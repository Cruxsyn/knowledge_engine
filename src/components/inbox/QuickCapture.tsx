import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/stores/appStore'
import { useCaptures } from '@/hooks/useCaptures'
import type { CaptureType, Priority } from '@/types'

const captureTypes: { value: CaptureType; label: string }[] = [
  { value: 'thought', label: 'Thought' },
  { value: 'clip', label: 'Web Clip' },
  { value: 'highlight', label: 'Highlight' },
  { value: 'code', label: 'Code' },
  { value: 'research', label: 'Research' },
  { value: 'lecture', label: 'Lecture' },
]

const priorities: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export function QuickCapture() {
  const { quickCaptureOpen, setQuickCaptureOpen, triggerRefresh } = useAppStore()
  const { createCapture } = useCaptures()
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<CaptureType>('thought')
  const [priority, setPriority] = useState<Priority>('medium')
  const [whySaved, setWhySaved] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [topic, setTopic] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setTitle('')
    setContent('')
    setType('thought')
    setPriority('medium')
    setWhySaved('')
    setSourceUrl('')
    setTopic('')
  }

  const handleClose = () => {
    setQuickCaptureOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      createCapture({
        title: title.trim(),
        content: content.trim(),
        type,
        priority,
        why_saved: whySaved.trim() || undefined,
        source_url: sourceUrl.trim() || undefined,
        topic: topic.trim() || undefined,
      })
      triggerRefresh()
      handleClose()
    } catch (err) {
      console.error('Failed to create capture:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={quickCaptureOpen} onOpenChange={setQuickCaptureOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick Capture</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the key idea?"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as CaptureType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {captureTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Capture the details..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whySaved">Why did you save this?</Label>
            <Input
              id="whySaved"
              value={whySaved}
              onChange={(e) => setWhySaved(e.target.value)}
              placeholder="What made this worth capturing?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">Source URL</Label>
              <Input
                id="sourceUrl"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., programming, design"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Capture'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
