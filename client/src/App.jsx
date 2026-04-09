import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Shell from './components/layout/Shell'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import CompanyPage from './pages/CompanyPage'
import Pipeline from './pages/Pipeline'
import Settings from './pages/Settings'
import Candidates from './pages/Candidates'

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/:id" element={<CompanyPage />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}
