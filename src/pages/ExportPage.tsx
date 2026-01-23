import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Upload, FileText, Database, FolderDown } from 'lucide-react'
import { useDatabase } from '@/hooks/useDatabase'
import { exportAllAsMarkdown, exportConceptsAsMarkdown, exportNotesAsMarkdown } from '@/lib/export'

export function ExportPage() {
  const { exportDb, importDb } = useDatabase()
  const [importing, setImporting] = useState(false)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      await importDb(file)
      alert('Database imported successfully!')
    } catch (err) {
      alert('Failed to import database. Please check the file format.')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  return (
    <>
      <Header 
        title="Export & Backup" 
        subtitle="Export your knowledge base or create backups"
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Database Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-icon-gold" />
                Database Backup
              </CardTitle>
              <CardDescription>
                Export or import the entire database. This includes all captures, notes, concepts, and their relationships.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button variant="outline" onClick={exportDb}>
                <Download className="h-4 w-4 mr-2" />
                Export Database (.db)
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".db,.sqlite"
                  onChange={handleImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={importing}
                />
                <Button variant="outline" disabled={importing}>
                  <Upload className="h-4 w-4 mr-2" />
                  {importing ? 'Importing...' : 'Import Database'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Markdown Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-verdigris" />
                Markdown Export
              </CardTitle>
              <CardDescription>
                Export your knowledge as portable Markdown files. Great for sharing or using in other tools.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" onClick={exportNotesAsMarkdown}>
                  <FolderDown className="h-4 w-4 mr-2" />
                  Export All Notes
                </Button>
                
                <Button variant="outline" onClick={exportConceptsAsMarkdown}>
                  <FolderDown className="h-4 w-4 mr-2" />
                  Export All Concepts
                </Button>
                
                <Button variant="gold" onClick={exportAllAsMarkdown}>
                  <FolderDown className="h-4 w-4 mr-2" />
                  Export Everything
                </Button>
              </div>
              
              <p className="text-sm text-warm-gray">
                Exports will be downloaded as a ZIP file containing organized Markdown files.
              </p>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-deep-azure/30 bg-deep-azure/5">
            <CardHeader>
              <CardTitle className="text-deep-azure">About Your Data</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-warm-gray space-y-2">
              <p>
                Your knowledge base is stored locally in your browser using SQLite. 
                This means your data stays on your device and is not sent to any server.
              </p>
              <p>
                We recommend creating regular backups, especially before clearing browser data 
                or switching devices.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
