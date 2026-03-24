import { useState, useCallback } from 'react'
import { Volume2, VolumeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { speakJapanese, stopAudio, isJapaneseVoiceAvailable } from '@/lib/japanese/audio'

interface SpeakButtonProps {
  text: string
  rate?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

export function SpeakButton({ text, rate = 0.9, size = 'md', className, label }: SpeakButtonProps) {
  const [playing, setPlaying] = useState(false)
  const available = isJapaneseVoiceAvailable()

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (playing) {
      stopAudio()
      setPlaying(false)
      return
    }

    setPlaying(true)
    const ok = await speakJapanese(text, rate)
    if (!ok) {
      setPlaying(false)
      return
    }
    // Reset after estimated duration
    setTimeout(() => setPlaying(false), Math.max(800, text.length * 250))
  }, [text, rate, playing])

  const sizeClasses = {
    sm: 'h-5 w-5 p-0.5',
    md: 'h-7 w-7 p-1',
    lg: 'h-9 w-9 p-1.5',
  }

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  if (!available) {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          'text-warm-gray/20 cursor-not-allowed',
          sizeClasses[size],
          className
        )}
        title="No Japanese voice installed. Windows: Settings → Time & Language → Speech → Add voices → Japanese"
        aria-label="Audio unavailable"
        disabled
      >
        <VolumeOff className={iconSize[size]} />
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-all',
        'hover:bg-icon-gold/20 active:scale-95',
        'text-warm-gray hover:text-icon-gold',
        playing && 'text-icon-gold bg-icon-gold/10',
        sizeClasses[size],
        className
      )}
      title={label || `Play: ${text}`}
      aria-label={label || `Play pronunciation: ${text}`}
    >
      <Volume2 className={iconSize[size]} />
    </button>
  )
}

/**
 * Inline speak button — smaller, more subtle.
 */
export function InlineSpeakButton({ text, rate = 0.9, className }: { text: string; rate?: number; className?: string }) {
  return (
    <SpeakButton
      text={text}
      rate={rate}
      size="sm"
      className={cn('ml-1 opacity-50 hover:opacity-100', className)}
    />
  )
}
