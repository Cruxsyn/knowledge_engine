import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShareLinkDisplayProps {
  url: string
  size: number
}

export function ShareLinkDisplay({ url, size }: ShareLinkDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleOpen = () => {
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          readOnly
          value={url}
          className="flex-1 text-sm bg-obsidian border-ash-stone font-mono"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          className={cn(
            "shrink-0 transition-colors",
            copied && "border-verdigris text-verdigris"
          )}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleOpen}
          className="shrink-0"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between text-xs text-warm-gray">
        <span>
          {copied ? (
            <span className="text-verdigris">Link copied to clipboard!</span>
          ) : (
            'Share this link with others'
          )}
        </span>
        <span>{size} chars</span>
      </div>
    </div>
  )
}
