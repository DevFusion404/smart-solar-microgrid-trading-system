import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Filter,
  Mail,
  Phone,
  Plus,
  Save,
  Search,
  Shield,
  UserMinus,
  Users,
  RefreshCw,
  X,
} from 'lucide-react'
import { useState } from 'react'

// Mock data matching GET /api/web-users response
const mockUsers = [
  { username: 'jordan.davis', fullName: 'Jordan Davis', email: 'jordan@solargrid.lk', phoneNumber: '+94 77 100 2001', role: 'Backoffice', status: 'Active', createdAt: '2024-01-15T08:00:00Z', lastLoginAt: '2026-09-14T17:00:00Z' },
  { username: 'alex.ops', fullName: 'Alex Fernando', email: 'alex@solargrid.lk', phoneNumber: '+94 77 200 3002', role: 'GridOperator', status: 'Active', createdAt: '2024-02-20T08:00:00Z', lastLoginAt: '2026-09-14T13:00:00Z' },
  { username: 'priya.admin', fullName: 'Priya Ranatunga', email: 'priya@solargrid.lk', phoneNumber: '+94 77 300 4003', role: 'Backoffice', status: 'Active', createdAt: '2024-03-10T08:00:00Z', lastLoginAt: '2026-09-13T10:00:00Z' },
  { username: 'sam.grid', fullName: 'Samanthe Herath', email: 'sam@solargrid.lk', phoneNumber: '+94 71 400 5004', role: 'GridOperator', status: 'Deactivated', createdAt: '2023-11-05T08:00:00Z', lastLoginAt: '2025-12-01T09:00:00Z' },
  { username: 'rahul.ops', fullName: 'Rahul Jayasena', email: 'rahul@solargrid.lk', phoneNumber: '+94 76 500 6005', role: 'GridOperator', status: 'Active', createdAt: '2025-01-10T08:00:00Z', lastLoginAt: '2026-09-12T15:00:00Z' },
]

const ROLE_TABS = ['All', 'Backoffice', 'GridOperator']
const STATUS_TABS = ['All', 'Active', 'Deactivated']
const PAGE_SIZE = 5

const roleStyle = {
  Backoffice: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  GridOperator: 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
}
const statusStyle = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  Deactivated: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
}

function RoleBadge({ role }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyle[role] ?? ''}`}><Shield className="h-3 w-3" />{role}</span>
}
function StatusBadge({ status }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[status] ?? ''}`}>{status}</span>
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  )
}

export function UserManagementPage() {
  const [users, setUsers] = useState(mockUsers)
  const [roleTab, setRoleTab] = useState('All')
  const [statusTab, setStatusTab] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null) // 'create' | 'edit' | 'deactivate' | 'view'
  const [selected, setSelected] = useState(null)
  const [deactivateReason, setDeactivateReason] = useState('')
  const [newUser, setNewUser] = useState({ fullName: '', email: '', username: '', phoneNumber: '', role: 'GridOperator', password: '' })
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const filtered = users.filter((u) => {
    const matchRole = roleTab === 'All' || u.role === roleTab
    const matchStatus = statusTab === 'All' || u.status === statusTab
    const q = search.toLowerCase()
    const matchSearch = !q || [u.fullName, u.username, u.email].some((v) => v.toLowerCase().includes(q))
    return matchRole && matchStatus && matchSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    setUsers((prev) => [...prev, { ...newUser, status: 'Active', createdAt: new Date().toISOString(), lastLoginAt: null }])
    setNewUser({ fullName: '', email: '', username: '', phoneNumber: '', role: 'GridOperator', password: '' })
    setSaving(false)
    setModal(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    setUsers((prev) => prev.map((u) => u.username === selected.username ? { ...u, ...editForm } : u))
    setSaving(false)
    setModal(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleDeactivate = () => {
    setUsers((prev) => prev.map((u) => u.username === selected.username ? { ...u, status: 'Deactivated' } : u))
    setDeactivateReason('')
    setModal(null)
  }

  const handleReactivate = (username) => {
    setUsers((prev) => prev.map((u) => u.username === username ? { ...u, status: 'Active' } : u))
  }

  const openEdit = (user) => {
    setSelected(user)
    setEditForm({ fullName: user.fullName, email: user.email, phoneNumber: user.phoneNumber })
    setModal('edit')
  }

  const counts = {
    All: users.length,
    Backoffice: users.filter((u) => u.role === 'Backoffice').length,
    GridOperator: users.filter((u) => u.role === 'GridOperator').length,
    Active: users.filter((u) => u.status === 'Active').length,
    Deactivated: users.filter((u) => u.status === 'Deactivated').length,
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">User Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage Backoffice officers and Grid Operators.</p>
        </div>
        <button type="button" onClick={() => setModal('create')} className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
          <Plus className="h-4 w-4" /> Create User
        </button>
      </motion.div>

      {saved && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-400/10 dark:text-emerald-300">
          ✓ Changes saved successfully.
        </motion.div>
      )}

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Users', value: counts.All, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Backoffice', value: counts.Backoffice, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Grid Operators', value: counts.GridOperator, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Active', value: counts.Active, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </motion.div>

      {/* Table card */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 w-full sm:w-72">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input type="text" placeholder="Search by name, username, email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-200" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            {ROLE_TABS.map((tab) => (
              <button key={tab} type="button" onClick={() => { setRoleTab(tab); setPage(1) }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${roleTab === tab ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
                {tab} ({counts[tab] ?? 0})
              </button>
            ))}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            {STATUS_TABS.map((tab) => (
              <button key={tab} type="button" onClick={() => { setStatusTab(tab); setPage(1) }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${statusTab === tab ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="border-b border-slate-100 dark:border-slate-800">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Username</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Last Login</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />No users found.
                  </td>
                </tr>
              ) : (
                paginated.map((u, i) => (
                  <motion.tr key={u.username} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${u.role === 'Backoffice' ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300'}`}>
                          {u.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </span>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{u.fullName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">@{u.username}</td>
                    <td className="px-5 py-4"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-4"><StatusBadge status={u.status} /></td>
                    <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-GB') : 'Never'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button type="button" onClick={() => openEdit(u)} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </button>
                        {u.status === 'Active' ? (
                          <button type="button" onClick={() => { setSelected(u); setModal('deactivate') }} className="flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-600">
                            <UserMinus className="h-3.5 w-3.5" /> Deactivate
                          </button>
                        ) : (
                          <button type="button" onClick={() => handleReactivate(u.username)} className="flex items-center gap-1 rounded-lg bg-blue-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-600">
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
            <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"><ChevronLeft className="h-4 w-4" /></button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} type="button" onClick={() => setPage(i + 1)} className={`h-7 w-7 rounded-lg text-xs font-semibold transition ${page === i + 1 ? 'bg-amber-400 text-slate-950' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{i + 1}</button>
            ))}
            <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'create' && (
          <Modal title="Create Web User" onClose={() => setModal(null)}>
            <form onSubmit={handleCreate} className="space-y-4">
              {[['Full Name', 'fullName', 'text'], ['Email', 'email', 'email'], ['Username', 'username', 'text'], ['Phone Number', 'phoneNumber', 'tel'], ['Password', 'password', 'password']].map(([label, key, type]) => (
                <label key={key} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {label}
                  <input type={type} value={newUser[key]} onChange={(e) => setNewUser((f) => ({ ...f, [key]: e.target.value }))} required className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </label>
              ))}
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Role
                <select value={newUser.role} onChange={(e) => setNewUser((f) => ({ ...f, role: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <option value="GridOperator">Grid Operator</option>
                  <option value="Backoffice">Backoffice</option>
                </select>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Creating…' : 'Create User'}</button>
                <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
              </div>
            </form>
          </Modal>
        )}
        {modal === 'edit' && selected && (
          <Modal title={`Edit — ${selected.fullName}`} onClose={() => setModal(null)}>
            <form onSubmit={handleEdit} className="space-y-4">
              {[['Full Name', 'fullName', 'text'], ['Email', 'email', 'email'], ['Phone Number', 'phoneNumber', 'tel']].map(([label, key, type]) => (
                <label key={key} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {label}
                  <input type={type} value={editForm[key] ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))} required className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </label>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save Changes'}</button>
                <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
              </div>
            </form>
          </Modal>
        )}
        {modal === 'deactivate' && selected && (
          <Modal title={`Deactivate — ${selected.fullName}`} onClose={() => setModal(null)}>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Provide a mandatory reason for this deactivation.</p>
            <textarea value={deactivateReason} onChange={(e) => setDeactivateReason(e.target.value)} placeholder="Reason for deactivation…" rows={3} required className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 resize-none" />
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={handleDeactivate} className="flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600"><UserMinus className="h-4 w-4" /> Deactivate</button>
              <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
