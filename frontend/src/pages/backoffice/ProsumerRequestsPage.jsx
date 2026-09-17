import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  UserCheck,
  UserMinus,
  UserX,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { prosumerService } from '../../services'

const TABS = ['Pending Activations', 'Deactivation Requests']

function ProsumerCard({ prosumer, actions, type }) {
  const initials = prosumer.fullName ? prosumer.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'PR'
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-base font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{prosumer.fullName}</p>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">NIC: {prosumer.nic} {prosumer.username ? `· @${prosumer.username}` : ''}</p>
            </div>
            {(prosumer.activationRequestedAt || prosumer.deactivationRequestedAt || prosumer.createdAt) && (
              <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                {new Date(type === 'activation' ? (prosumer.activationRequestedAt || prosumer.createdAt) : (prosumer.deactivationRequestedAt || prosumer.createdAt)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{prosumer.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{prosumer.phoneNumber}</span>
            </div>
          </div>

          {type === 'deactivation' && prosumer.deactivationReason && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-700/40 dark:bg-amber-400/5">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Reason given:</p>
              <p className="mt-0.5 text-sm text-amber-800 dark:text-amber-200 italic">"{prosumer.deactivationReason}"</p>
            </div>
          )}

          {/* Reject reason form */}
          <AnimatePresence>
            {showReject && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-3"
              >
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (optional)…"
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 resize-none"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex flex-wrap gap-2">
            {type === 'activation' && (
              <>
                <button
                  type="button"
                  onClick={() => actions.activate(prosumer.nic)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  <UserCheck className="h-4 w-4" /> Activate
                </button>
                {showReject ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { actions.reject(prosumer.nic, rejectReason); setShowReject(false) }}
                      className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                    >
                      <UserX className="h-4 w-4" /> Confirm Reject
                    </button>
                    <button type="button" onClick={() => setShowReject(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowReject(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-700/40 dark:bg-red-400/5 dark:text-red-400"
                  >
                    <UserX className="h-4 w-4" /> Reject
                  </button>
                )}
              </>
            )}
            {type === 'deactivation' && (
              <>
                <button
                  type="button"
                  onClick={() => actions.approveDeactivation(prosumer.nic)}
                  className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                >
                  <UserMinus className="h-4 w-4" /> Approve Deactivation
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function ProsumerRequestsPage() {
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [pending, setPending] = useState([])
  const [deactivation, setDeactivation] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [pendingRes, deactRes] = await Promise.allSettled([
        prosumerService.listPendingActivations(),
        prosumerService.listDeactivationRequests(),
      ])

      if (pendingRes.status === 'fulfilled') {
        setPending(pendingRes.value.items || [])
      }
      if (deactRes.status === 'fulfilled') {
        setDeactivation(deactRes.value.items || [])
      }
    } catch (err) {
      console.error('Failed to load prosumer requests:', err)
      setError(err.message || 'Failed to connect to prosumer service.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const actions = {
    activate: async (nic) => {
      try {
        await prosumerService.activateProsumer(nic)
        fetchRequests()
      } catch (err) {
        alert(err.message || 'Failed to activate prosumer.')
      }
    },
    reject: async (nic, reason) => {
      try {
        await prosumerService.rejectProsumerActivation(nic, reason)
        fetchRequests()
      } catch (err) {
        alert(err.message || 'Failed to reject prosumer activation.')
      }
    },
    approveDeactivation: async (nic) => {
      try {
        await prosumerService.approveDeactivation(nic)
        fetchRequests()
      } catch (err) {
        alert(err.message || 'Failed to approve deactivation.')
      }
    },
  }

  const items = activeTab === TABS[0] ? pending : deactivation
  const type = activeTab === TABS[0] ? 'activation' : 'deactivation'

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Prosumer Requests</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Review and action pending activation and deactivation requests.
        </p>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((tab) => {
          const count = tab === TABS[0] ? pending.length : deactivation.length
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition -mb-px ${
                activeTab === tab
                  ? 'border-amber-400 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab}
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === tab ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="space-y-4"
        >
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
              Loading requests…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 dark:border-slate-700 dark:bg-slate-900">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-3" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">All caught up!</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No pending {type === 'activation' ? 'activation' : 'deactivation'} requests.</p>
            </div>
          ) : (
            items.map((p) => (
              <ProsumerCard key={p.nic} prosumer={p} actions={actions} type={type} />
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
