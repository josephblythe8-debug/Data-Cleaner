import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { GarmentLibrary } from '@/pages/GarmentLibrary'
import { StoreBuilderNew } from '@/pages/StoreBuilderNew'
import { StoreBuilderConfigure } from '@/pages/StoreBuilderConfigure'
import { Preview } from '@/pages/Preview'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/garments" element={<GarmentLibrary />} />
          <Route path="/store-builder" element={<StoreBuilderNew />} />
          <Route path="/store-builder/:projectId" element={<StoreBuilderConfigure />} />
          <Route path="/store-builder/:projectId/preview" element={<Preview />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
