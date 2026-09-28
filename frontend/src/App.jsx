/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Application Routing
File          : App.jsx
Description   : Declares every web route. Each role area (/backoffice,
                /operator, /prosumer) is wrapped in RequireRole so only
                users with that role can open its pages.
=====================================================
*/

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RequireRole } from './components/auth/RequireRole'
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
import { CreateProsumerPage } from './pages/backoffice/CreateProsumerPage'

// Shared account pages (Component 1)
import { AccountSettingsPage } from './pages/account/AccountSettingsPage'

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
import { OperatorNodesPage } from './pages/operator/OperatorNodesPage'
import { OperatorLayout } from './components/layout/OperatorLayout'
import { ProfilePage as GridOperatorProfilePage } from './pages/gridOperator/ProfilePage'
import { ProsumerListPage as GridOperatorProsumerListPage } from './pages/gridOperator/ProsumerListPage'

// Prosumer portal
import { ProsumerLayout } from './components/layout/ProsumerLayout'
import { ProfilePage as ProsumerProfilePage } from './pages/prosumer/ProfilePage'

import { HomePage } from './pages/HomePage'

// Root component: provides auth state and the role-protected route tree
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Backoffice (only Backoffice officers) ── */}
          <Route element={<RequireRole roles={['Backoffice']} />}>
          <Route path="/backoffice" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />

            {/* Account management */}
            <Route path="profile" element={<BackofficeProfilePage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="prosumers" element={<ProsumersPage />} />
            <Route path="prosumers/new" element={<CreateProsumerPage />} />
            <Route path="prosumers/requests" element={<ProsumerRequestsPage />} />
            <Route path="prosumers/:nic" element={<ProsumerDetailPage />} />
            <Route path="settings" element={<AccountSettingsPage />} />

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
          </Route>

          {/* ── Grid Operator (only Grid Operators) ── */}
          <Route element={<RequireRole roles={['GridOperator']} />}>
          <Route path="/operator" element={<OperatorLayout />}>
            <Route index element={<OperatorDashboard />} />

            {/* Microgrid Nodes */}
            <Route path="nodes" element={<OperatorNodesPage />} />
            <Route path="nodes/details" element={<OperatorNodesPage />} />

            {/* Energy Slots Management */}
            <Route path="energy-slots" element={<ManageEnergySlots operatorMode />} />
            <Route path="energy-slots/update" element={<ManageEnergySlots operatorMode />} />

            {/* Reservations */}
            <Route path="reservations" element={<EnergySlotReservations />} />
            <Route path="reservations/pending" element={<EnergySlotReservations />} />
            <Route path="reservations/today" element={<EnergySlotReservations />} />
            <Route path="reservations/:reservationId" element={<EnergySlotReservations />} />

            {/* Account management */}
            <Route path="profile" element={<GridOperatorProfilePage />} />
            <Route path="prosumers" element={<GridOperatorProsumerListPage />} />
            <Route path="settings" element={<AccountSettingsPage />} />

            <Route path="*" element={<PlaceholderPage />} />
          </Route>
          </Route>

          {/* ── Prosumer Portal (only Prosumers) ── */}
          <Route element={<RequireRole roles={['Prosumer']} />}>
          <Route path="/prosumer" element={<ProsumerLayout />}>
            <Route index element={<Navigate to="/prosumer/profile" replace />} />
            <Route path="profile" element={<ProsumerProfilePage />} />
            <Route path="account" element={<AccountSettingsPage />} />
            <Route path="*" element={<Navigate to="/prosumer/profile" replace />} />
          </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
