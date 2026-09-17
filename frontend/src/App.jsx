import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'

// Backoffice pages
import { DashboardPage } from './pages/backoffice/DashboardPage'
import { PlaceholderPage } from './pages/backoffice/PlaceholderPage'
import { ProfilePage as BackofficeProfilePage } from './pages/backoffice/ProfilePage'
import { ProsumersPage } from './pages/backoffice/ProsumersPage'
import { ProsumerRequestsPage } from './pages/backoffice/ProsumerRequestsPage'
import { ProsumerDetailPage } from './pages/backoffice/ProsumerDetailPage'
import { UserManagementPage } from './pages/backoffice/UserManagementPage'

// Microgrid Node pages (Component 2 - Sithmaka)
import { NodesListPage } from './pages/backoffice/nodes/NodesListPage'
import { AddNodePage } from './pages/backoffice/nodes/AddNodePage'
import { NodeSchedulesPage } from './pages/backoffice/nodes/NodeSchedulesPage'

// Energy slot / reservation pages (existing)
import { EnergySlotDashboard } from './pages/Reservation/EnergySlotDashboard'
import { ManageEnergySlots } from './pages/Reservation/ManageEnergySlots'
import { EnergySlotReservations } from './pages/Reservation/EnergySlotReservations'

// GridOperator pages
import { OperatorDashboard } from './pages/operator/OperatorDashboard'
import { OperatorLayout } from './components/layout/OperatorLayout'
import { ProfilePage as GridOperatorProfilePage } from './pages/gridOperator/ProfilePage'
import { ProsumerListPage as GridOperatorProsumerListPage } from './pages/gridOperator/ProsumerListPage'

// Prosumer portal
import { ProsumerLayout } from './components/layout/ProsumerLayout'
import { ProfilePage as ProsumerProfilePage } from './pages/prosumer/ProfilePage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/backoffice" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Backoffice ── */}
          <Route path="/backoffice" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />

            {/* Account management */}
            <Route path="profile" element={<BackofficeProfilePage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="prosumers" element={<ProsumersPage />} />
            <Route path="prosumers/requests" element={<ProsumerRequestsPage />} />
            <Route path="prosumers/:nic" element={<ProsumerDetailPage />} />

            {/* Microgrid Nodes (Component 2 - Sithmaka) */}
            <Route path="nodes" element={<NodesListPage />} />
            <Route path="nodes/new" element={<AddNodePage />} />
            <Route path="nodes/schedules" element={<NodeSchedulesPage />} />

            {/* Energy slots (existing) */}
            <Route path="energy-slots" element={<EnergySlotDashboard />} />
            <Route path="energy-slots/manage" element={<ManageEnergySlots />} />
            <Route path="energy-slots/reservations" element={<EnergySlotReservations />} />
            <Route path="energy-slots/reservations/:reservationId" element={<EnergySlotReservations />} />

            <Route path="*" element={<PlaceholderPage />} />
          </Route>

          {/* ── Grid Operator ── */}
          <Route path="/operator" element={<OperatorLayout />}>
            <Route index element={<OperatorDashboard />} />

            {/* Account management */}
            <Route path="profile" element={<GridOperatorProfilePage />} />
            <Route path="prosumers" element={<GridOperatorProsumerListPage />} />

            <Route path="*" element={<PlaceholderPage />} />
          </Route>

          {/* ── Prosumer Portal ── */}
          <Route path="/prosumer" element={<ProsumerLayout />}>
            <Route index element={<Navigate to="/prosumer/profile" replace />} />
            <Route path="profile" element={<ProsumerProfilePage />} />
            <Route path="*" element={<PlaceholderPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
