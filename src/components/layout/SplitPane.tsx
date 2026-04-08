import { useRef, useCallback, useState } from 'react'

interface SplitPaneProps {
  left: React.ReactNode
  right: React.ReactNode
  direction?: 'horizontal' | 'vertical'
  defaultRatio?: number
}

export function SplitPane({ left, right, direction = 'horizontal', defaultRatio = 0.5 }: SplitPaneProps) {
  const [ratio, setRatio] = useState(defaultRatio)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleMouseDown = useCallback(() => {
    setDragging(true)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const newRatio = direction === 'horizontal'
      ? (e.clientX - rect.left) / rect.width
      : (e.clientY - rect.top) / rect.height
    setRatio(Math.max(0.15, Math.min(0.85, newRatio)))
  }, [dragging, direction])

  const handleMouseUp = useCallback(() => {
    setDragging(false)
  }, [])

  const isH = direction === 'horizontal'

  return (
    <div
      ref={containerRef}
      className={`flex ${isH ? 'flex-row' : 'flex-col'} h-full w-full`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div style={{ [isH ? 'width' : 'height']: `${ratio * 100}%` }} className="overflow-hidden">
        {left}
      </div>
      <div
        className={`${isH ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'} bg-ash-stone/30 hover:bg-icon-gold/50 transition-colors shrink-0 ${
          dragging ? 'bg-icon-gold/50' : ''
        }`}
        onMouseDown={handleMouseDown}
      />
      <div className="flex-1 overflow-hidden">
        {right}
      </div>
    </div>
  )
}
