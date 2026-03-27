import { cn } from '@/lib/utils'
import { Info, Lightbulb, AlertTriangle } from 'lucide-react'

interface CalloutBlockProps {
  type: 'note' | 'tip' | 'warning'
  children: React.ReactNode
}

const calloutConfig = {
  note: {
    icon: Info,
    borderColor: 'border-deep-azure',
    bgColor: 'bg-deep-azure/10',
    iconColor: 'text-deep-azure',
    label: 'Note',
  },
  tip: {
    icon: Lightbulb,
    borderColor: 'border-verdigris',
    bgColor: 'bg-verdigris/10',
    iconColor: 'text-verdigris',
    label: 'Tip',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'border-icon-gold',
    bgColor: 'bg-icon-gold/10',
    iconColor: 'text-icon-gold',
    label: 'Warning',
  },
}

export function CalloutBlock({ type, children }: CalloutBlockProps) {
  const config = calloutConfig[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'my-6 rounded-lg border-l-4 p-4',
        config.borderColor,
        config.bgColor
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('h-4 w-4', config.iconColor)} />
        <span className={cn('text-xs font-semibold uppercase tracking-wider', config.iconColor)}>
          {config.label}
        </span>
      </div>
      <div className="text-warm-gray text-sm leading-relaxed">
        {children}
      </div>
    </div>
  )
}
