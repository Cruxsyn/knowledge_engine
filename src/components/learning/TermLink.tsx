import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConcepts } from '@/hooks/useConcepts'
import { Badge } from '@/components/ui/badge'
import type { TermReference } from '@/lib/learning/contentProcessor'

interface TermLinkProps {
  termRef: TermReference
  children: React.ReactNode
}

export function TermLink({ termRef, children }: TermLinkProps) {
  const { getConceptById } = useConcepts()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [concept, setConcept] = useState<ReturnType<typeof getConceptById>>(null)
  const containerRef = useRef<HTMLSpanElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load concept data eagerly
  useEffect(() => {
    if (termRef.conceptId) {
      const c = getConceptById(termRef.conceptId)
      setConcept(c)
    }
  }, [termRef.conceptId, getConceptById])

  const definition = concept?.definition || termRef.definition
  const intuition = concept?.intuition

  const handleOpen = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 200)
  }, [])

  const masteryColors: Record<string, string> = {
    unknown: 'bg-warm-gray/20 text-warm-gray',
    learning: 'bg-deep-azure/20 text-deep-azure',
    solid: 'bg-verdigris/20 text-verdigris',
    teachable: 'bg-icon-gold/20 text-icon-gold',
  }

  return (
    <span ref={containerRef} className="relative inline">
      <span
        className="text-icon-gold border-b border-dotted border-icon-gold/50 cursor-help hover:border-icon-gold hover:border-solid transition-colors"
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onClick={handleOpen}
      >
        {children}
      </span>

      {open && (definition || intuition || concept) && (
        <div
          ref={popoverRef}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 rounded-lg border border-ash-stone/60 bg-charcoal-slate shadow-xl shadow-black/40 animate-in fade-in-0 zoom-in-95 duration-150"
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
        >
          {/* Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-charcoal-slate border-r border-b border-ash-stone/60" />

          <div className="relative p-4">
            <p className="font-serif font-semibold text-parchment text-sm mb-2">
              {termRef.displayText}
            </p>

            {definition && (
              <p className="text-warm-gray text-xs leading-relaxed mb-2">{definition}</p>
            )}

            {intuition && (
              <p className="text-warm-gray/70 text-xs leading-relaxed italic mb-2 pl-3 border-l-2 border-icon-gold/30">
                Think of it as: {intuition}
              </p>
            )}

            {concept && (
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-ash-stone/30">
                <Badge className={`text-[10px] px-1.5 py-0 ${masteryColors[concept.mastery] || ''}`}>
                  {concept.mastery}
                </Badge>
                <button
                  className="text-xs text-deep-azure hover:text-icon-gold transition-colors"
                  onClick={() => navigate('/concepts')}
                >
                  View concept →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </span>
  )
}
