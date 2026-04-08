import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { NotebookEditor } from '@/components/notebook/NotebookEditor'
import { useNotebookStore } from '@/stores/notebookStore'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export function NotebookPage() {
  const { id } = useParams<{ id: string }>()
  const { notebook, createNotebook, clearOutputs } = useNotebookStore()

  useEffect(() => {
    if (!notebook || id === 'new') {
      createNotebook('Untitled Notebook')
    }
  }, [id, notebook, createNotebook])

  return (
    <>
      <Header
        title={notebook?.title || 'Notebook'}
        subtitle="Computational notebook — mix markdown, math, and code"
        actions={
          <Button variant="outline" size="sm" onClick={clearOutputs}>
            <Trash2 className="h-3 w-3 mr-1" /> Clear Outputs
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <NotebookEditor />
      </div>
    </>
  )
}
