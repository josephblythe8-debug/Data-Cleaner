import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { GarmentLibrary } from '@/pages/GarmentLibrary'
import { Blueprints } from '@/pages/Blueprints'
import { StoreBuilderNew } from '@/pages/StoreBuilderNew'
import { StoreBuilderConfigure } from '@/pages/StoreBuilderConfigure'
import { Preview } from '@/pages/Preview'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/garments" element={<GarmentLibrary />} />
          <Route path="/blueprints" element={<Blueprints />} />
          <Route path="/store-builder" element={<StoreBuilderNew />} />
          <Route path="/store-builder/:projectId" element={<StoreBuilderConfigure />} />
          <Route path="/store-builder/:projectId/preview" element={<Preview />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
