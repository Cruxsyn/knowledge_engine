import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { TerminalPage } from '@/pages/TerminalPage'
import { NotesPage } from '@/pages/NotesPage'
import { ConceptsPage } from '@/pages/ConceptsPage'
import { ExportPage } from '@/pages/ExportPage'
import { VisualizePage } from '@/pages/VisualizePage'
import { SharedViewPage } from '@/pages/SharedViewPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main app routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<NotesPage />} />
          <Route path="/terminal" element={<TerminalPage />} />
          <Route path="/concepts" element={<ConceptsPage />} />
          <Route path="/visualize" element={<VisualizePage />} />
          <Route path="/export" element={<ExportPage />} />
        </Route>

        {/* Shared content routes (minimal layout, no sidebar) */}
        <Route element={<SharedLayout />}>
          <Route path="/shared" element={<SharedViewPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
