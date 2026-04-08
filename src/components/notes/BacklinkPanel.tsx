import { useState, useEffect } from 'react'
import { isTauri } from '@/db/adapter'
import { Link2 } from 'lucide-react'

interface Backlink {
  source_path: string
  source_title: string
  context: string
}

export function BacklinkPanel({ target }: { target: string }) {
  const [backlinks, setBacklinks] = useState<Backlink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!target) return
      setLoading(true)
      try {
        if (isTauri()) {
          const { invoke } = await import('@tauri-apps/api/core')
          const links = await invoke<Backlink[]>('vault_get_backlinks', { target })
          setBacklinks(links)
        }
      } catch (err) {
        console.error('Failed to load backlinks:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [target])

  if (loading) return null
  if (backlinks.length === 0) return null

  return (
    <div className="border-t border-ash-stone/50 mt-4 pt-4">
      <h3 className="text-xs uppercase tracking-wider text-warm-gray/50 font-medium flex items-center gap-1 mb-3">
        <Link2 className="h-3 w-3" />
        Backlinks ({backlinks.length})
      </h3>
      <div className="space-y-2">
        {backlinks.map((link, i) => (
          <div key={i} className="p-2 rounded bg-charcoal-slate/50 border border-ash-stone/20 text-sm">
            <div className="font-medium text-parchment">{link.source_title}</div>
            {link.context && (
              <p className="text-warm-gray/70 text-xs mt-1 line-clamp-2">{link.context}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
