import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { InboxPage } from '@/pages/InboxPage'
import { NotesPage } from '@/pages/NotesPage'
import { ConceptsPage } from '@/pages/ConceptsPage'
import { ExportPage } from '@/pages/ExportPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<InboxPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/concepts" element={<ConceptsPage />} />
          <Route path="/export" element={<ExportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
