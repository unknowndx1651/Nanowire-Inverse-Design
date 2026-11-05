import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AppLayout } from './components/layout/AppLayout'
import { DesignLab } from './pages/DesignLab'
import { Optimization } from './pages/Optimization'
import { Results } from './pages/Results'
import { AppStateProvider } from './context/AppStateProvider'
import { OptimizationRunProvider } from './context/OptimizationRunProvider'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppStateProvider>
      <OptimizationRunProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>


              <Route index element={<Navigate to="/design" replace />} />
              <Route path="design" element={<DesignLab />} />
              <Route path="optimization" element={<Optimization />} />
              <Route path="results" element={<Results />} />
              <Route path="style-guide" element={<App />} />

              
            </Route>
          </Routes>
        </BrowserRouter>
      </OptimizationRunProvider>
    </AppStateProvider>
  </StrictMode>,
)
