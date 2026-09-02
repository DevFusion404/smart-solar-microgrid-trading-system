import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DashboardPage } from './pages/backoffice/DashboardPage'
import { PlaceholderPage } from './pages/backoffice/PlaceholderPage'
import { OperatorDashboard } from './pages/operator/OperatorDashboard'
import { OperatorLayout } from './components/layout/OperatorLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/backoffice" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/backoffice" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="*" element={<PlaceholderPage />} />
        </Route>
        <Route path="/operator" element={<OperatorLayout />}>
          <Route index element={<OperatorDashboard />} />
          <Route path="*" element={<PlaceholderPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
