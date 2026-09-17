import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Search,
  Shield,
  Users,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { prosumerService } from '../../services'

const STATUS_TABS = ['All', 'Active', 'PendingActivation', 'Deactivated']
const PAGE_SIZE = 10

const statusStyle = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  PendingActivation: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  PendingDeactivation: 'bg-orange-100 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300',
  Deactivated: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
}
const statusLabel = { PendingActivation: 'Pending', PendingDeactivation: 'Pend. Deactivation' }

function StatusBadge({ status }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[status] ?? ''}`}>{statusLabel[status] ?? status}</span>
}

export function ProsumerListPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [prosumers, setProsumers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchProsumers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const statusParam = activeTab === 'All' ? undefined : activeTab
      let data
      if (search.trim()) {
        data = await prosumerService.searchProsumers({ q: search, status: statusParam, page, pageSize: PAGE_SIZE })
      } else {
        data = await prosumerService.listProsumers({ status: statusParam, page, pageSize: PAGE_SIZE })
      }
      setProsumers(data.items || [])
      setTotalCount(data.totalCount || (data.items ? data.items.length : 0))
    } catch (err) {
      console.error('Failed to load prosumers:', err)
      setError(err.message || 'Failed to connect to prosumer directory service.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, search, page])

  useEffect(() => {
    fetchProsumers()
  }, [fetchProsumers])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Prosumer Directory</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Browse and look up registered prosumer accounts. Read-only view.
        </p>
      </motion.div>

      {/* Info notice */}
      <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-700/40 dark:bg-blue-400/10 dark:text-blue-300">
        <Shield className="h-4 w-4 shrink-0" />
        As a Grid Operator, you have read-only access to prosumer account information.
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table card */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 w-full sm:w-72">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input type="text" placeholder="Search by name, NIC, email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-200" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            {STATUS_TABS.map((tab) => (
              <button key={tab} type="button" onClick={() => { setActiveTab(tab); setPage(1) }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeTab === tab ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
                {statusLabel[tab] ?? tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 dark:border-slate-800">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3.5">Prosumer</th>
                <th className="px-5 py-3.5">NIC</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
                    Loading directory…
                  </td>
                </tr>
              ) : prosumers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />No prosumers found.
                  </td>
                </tr>
              ) : (
                prosumers.map((p, i) => (
                  <motion.tr key={p.nic} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {p.fullName ? p.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'PR'}
                        </span>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{p.fullName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{p.nic}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{p.phoneNumber}</td>
                    <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : '-'}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Page {page} of {totalPages} ({totalCount} total)
          </p>
          <div className="flex items-center gap-1">
            <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
