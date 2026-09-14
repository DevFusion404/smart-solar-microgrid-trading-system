import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  UserCheck,
  UserMinus,
  UserX,
  RefreshCw,
  Eye,
  Filter,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Mock data matching GET /api/prosumers response shape
const mockProsumers = [
  { nic: '981234567V', fullName: 'Kasun Silva', email: 'kasun@example.com', phoneNumber: '+94 77 111 2222', status: 'Active', address: 'Colombo 05', createdAt: '2024-03-01T08:00:00Z', activatedAt: '2024-03-05T09:00:00Z' },
  { nic: '875432109V', fullName: 'Nimal Perera', email: 'nimal@example.com', phoneNumber: '+94 77 333 4444', status: 'PendingActivation', address: 'Kandy', createdAt: '2026-09-10T10:00:00Z', activatedAt: null },
  { nic: '763219876V', fullName: 'Amal Fernando', email: 'amal@example.com', phoneNumber: '+94 71 555 6666', status: 'Active', address: 'Galle', createdAt: '2024-06-15T08:00:00Z', activatedAt: '2024-06-20T11:00:00Z' },
  { nic: '652108765V', fullName: 'Sanduni Wijesinghe', email: 'sanduni@example.com', phoneNumber: '+94 76 777 8888', status: 'Deactivated', address: 'Matara', createdAt: '2023-11-01T08:00:00Z', activatedAt: '2023-11-05T09:00:00Z' },
  { nic: '541097654V', fullName: 'Ruwan Bandara', email: 'ruwan@example.com', phoneNumber: '+94 72 999 0000', status: 'PendingDeactivation', address: 'Kurunegala', createdAt: '2024-01-20T08:00:00Z', activatedAt: '2024-01-25T10:00:00Z' },
  { nic: '430986543V', fullName: 'Chamari Jayasuriya', email: 'chamari@example.com', phoneNumber: '+94 78 123 7890', status: 'Active', address: 'Negombo', createdAt: '2025-02-10T08:00:00Z', activatedAt: '2025-02-15T09:00:00Z' },
  { nic: '320875432V', fullName: 'Dinesh Rajapaksa', email: 'dinesh@example.com', phoneNumber: '+94 77 456 1230', status: 'PendingActivation', address: 'Jaffna', createdAt: '2026-09-12T10:00:00Z', activatedAt: null },
  { nic: '210764321V', fullName: 'Priya Kumari', email: 'priya@example.com', phoneNumber: '+94 71 789 4560', status: 'Active', address: 'Ratnapura', createdAt: '2024-08-05T08:00:00Z', activatedAt: '2024-08-10T09:00:00Z' },
]

const STATUS_TABS = ['All', 'Active', 'PendingActivation', 'PendingDeactivation', 'Deactivated']

const statusStyle = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  PendingActivation: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  PendingDeactivation: 'bg-orange-100 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300',
  Deactivated: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
}

const statusLabel = {
  PendingActivation: 'Pending Activation',
  PendingDeactivation: 'Pending Deactivation',
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[status] ?? ''}`}>
      {statusLabel[status] ?? status}
    </span>
  )
}

function ConfirmDialog({ title, description, confirmLabel, confirmClass, onConfirm, onCancel, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        {children}
        <div className="mt-5 flex items-center justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export function ProsumersPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState(null) // { type, prosumer, reason? }
  const [rejectReason, setRejectReason] = useState('')
  const [deactivateReason, setDeactivateReason] = useState('')
  const [prosumers, setProsumers] = useState(mockProsumers)

  const PAGE_SIZE = 6

  const filtered = prosumers.filter((p) => {
    const matchTab = activeTab === 'All' || p.status === activeTab
    const q = search.toLowerCase()
    const matchSearch = !q || [p.fullName, p.nic, p.email, p.phoneNumber].some((v) => v.toLowerCase().includes(q))
    return matchTab && matchSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleAction = (type, prosumer) => {
    setRejectReason('')
    setDeactivateReason('')
    setDialog({ type, prosumer })
  }

  const confirmAction = () => {
    const { type, prosumer } = dialog
    setProsumers((prev) =>
      prev.map((p) => {
        if (p.nic !== prosumer.nic) return p
        if (type === 'activate') return { ...p, status: 'Active' }
        if (type === 'reject') return { ...p, status: 'Deactivated' }
        if (type === 'deactivate') return { ...p, status: 'Deactivated' }
        if (type === 'reactivate') return { ...p, status: 'Active' }
        return p
      })
    )
    setDialog(null)
  }

  const tabCounts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab] = tab === 'All' ? prosumers.length : prosumers.filter((p) => p.status === tab).length
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Prosumer Management</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage all prosumer accounts — activate, reject, deactivate, or reactivate.
        </p>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[
          { label: 'Total Prosumers', value: prosumers.length, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Active', value: tabCounts.Active, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Pending Activation', value: tabCounts.PendingActivation, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Deactivated', value: tabCounts.Deactivated, color: 'text-red-600 dark:text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Search + Tab bar */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 w-full sm:w-80">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, NIC, email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-200"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setPage(1) }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === tab
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {statusLabel[tab] ?? tab}
                <span className="ml-1.5 opacity-60">({tabCounts[tab]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-slate-100 dark:border-slate-800">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3.5">Prosumer</th>
                <th className="px-5 py-3.5">NIC</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Registered</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No prosumers found.
                  </td>
                </tr>
              ) : (
                paginated.map((p, i) => (
                  <motion.tr
                    key={p.nic}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                          {p.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </span>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{p.fullName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{p.nic}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{p.phoneNumber}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(p.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          title="View details"
                          onClick={() => navigate(`/backoffice/prosumers/${p.nic}`)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        {p.status === 'PendingActivation' && (
                          <>
                            <button type="button" onClick={() => handleAction('activate', p)} className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600">
                              <UserCheck className="h-3.5 w-3.5" /> Activate
                            </button>
                            <button type="button" onClick={() => handleAction('reject', p)} className="flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600">
                              <UserX className="h-3.5 w-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {p.status === 'Active' && (
                          <button type="button" onClick={() => handleAction('deactivate', p)} className="flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600">
                            <UserMinus className="h-3.5 w-3.5" /> Deactivate
                          </button>
                        )}
                        {(p.status === 'Deactivated' || p.status === 'PendingDeactivation') && (
                          <button type="button" onClick={() => handleAction('reactivate', p)} className="flex items-center gap-1 rounded-lg bg-blue-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600">
                            <RefreshCw className="h-3.5 w-3.5" /> Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} type="button" onClick={() => setPage(i + 1)} className={`h-7 w-7 rounded-lg text-xs font-semibold transition ${page === i + 1 ? 'bg-amber-400 text-slate-950' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                {i + 1}
              </button>
            ))}
            <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Dialogs */}
      <AnimatePresence>
        {dialog?.type === 'activate' && (
          <ConfirmDialog
            title={`Activate ${dialog.prosumer.fullName}?`}
            description="This will approve their registration and grant them access to the platform."
            confirmLabel="Activate Account"
            confirmClass="bg-emerald-500 text-white hover:bg-emerald-600"
            onConfirm={confirmAction}
            onCancel={() => setDialog(null)}
          />
        )}
        {dialog?.type === 'reject' && (
          <ConfirmDialog
            title={`Reject ${dialog.prosumer.fullName}'s activation?`}
            description="Provide a reason for rejection (optional)."
            confirmLabel="Reject Activation"
            confirmClass="bg-red-500 text-white hover:bg-red-600"
            onConfirm={confirmAction}
            onCancel={() => setDialog(null)}
          >
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection…"
              rows={3}
              className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 resize-none"
            />
          </ConfirmDialog>
        )}
        {dialog?.type === 'deactivate' && (
          <ConfirmDialog
            title={`Deactivate ${dialog.prosumer.fullName}?`}
            description="Provide a mandatory reason for this deactivation."
            confirmLabel="Deactivate Account"
            confirmClass="bg-red-500 text-white hover:bg-red-600"
            onConfirm={confirmAction}
            onCancel={() => setDialog(null)}
          >
            <textarea
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              placeholder="Reason for deactivation…"
              rows={3}
              required
              className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 resize-none"
            />
          </ConfirmDialog>
        )}
        {dialog?.type === 'reactivate' && (
          <ConfirmDialog
            title={`Reactivate ${dialog.prosumer.fullName}?`}
            description="This will restore their account access."
            confirmLabel="Reactivate Account"
            confirmClass="bg-blue-500 text-white hover:bg-blue-600"
            onConfirm={confirmAction}
            onCancel={() => setDialog(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
