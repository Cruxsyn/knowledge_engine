import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { InboxList } from '@/components/inbox/InboxList'
import { CaptureDetail } from '@/components/inbox/CaptureDetail'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { useCaptures } from '@/hooks/useCaptures'
import type { CaptureStatus } from '@/types'

const statusTabs: { value: CaptureStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'processing', label: 'Processing' },
  { value: 'distilled', label: 'Distilled' },
  { value: 'linked', label: 'Linked' },
]

export function InboxPage() {
  const { setQuickCaptureOpen, captureStatusFilter, setCaptureStatusFilter, selectedCapture } = useAppStore()
  const { getCounts } = useCaptures()
  const [counts, setCounts] = useState<Record<CaptureStatus, number> | null>(null)

  useEffect(() => {
    getCounts().then(setCounts)
  }, [getCounts])

  return (
    <>
      <Header 
        title="Inbox" 
        subtitle={counts ? `${counts.new} new captures awaiting processing` : undefined}
        actions={
          <Button variant="gold" size="sm" onClick={() => setQuickCaptureOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Capture
          </Button>
        }
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-3 border-b border-ash-stone/50">
            <Tabs value={captureStatusFilter} onValueChange={(v) => setCaptureStatusFilter(v as CaptureStatus | 'all')}>
              <TabsList>
                {statusTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                    {counts && tab.value !== 'all' && counts[tab.value as CaptureStatus] > 0 && (
                      <span className="ml-2 text-xs bg-ash-stone px-1.5 py-0.5 rounded-full">
                        {counts[tab.value as CaptureStatus]}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <InboxList />
          </div>
        </div>

        {selectedCapture && (
          <div className="w-96 border-l border-ash-stone/50 overflow-y-auto">
            <CaptureDetail />
          </div>
        )}
      </div>
    </>
  )
}
