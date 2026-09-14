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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

// Mock pending activations — GET /api/prosumers/pending-activations
const mockPending = [
  {
    nic: '875432109V', fullName: 'Nimal Perera', email: 'nimal@example.com',
    phoneNumber: '+94 77 333 4444', address: 'Kandy', username: 'nimal.perera',
    activationRequestedAt: '2026-09-10T10:00:00Z', createdAt: '2026-09-10T09:55:00Z',
  },
  {
    nic: '320875432V', fullName: 'Dinesh Rajapaksa', email: 'dinesh@example.com',
    phoneNumber: '+94 77 456 1230', address: 'Jaffna', username: 'dinesh.r',
    activationRequestedAt: '2026-09-12T10:00:00Z', createdAt: '2026-09-12T09:50:00Z',
  },
  {
    nic: '190764210V', fullName: 'Thilini Mendis', email: 'thilini@example.com',
    phoneNumber: '+94 71 234 5678', address: 'Anuradhapura', username: 'thilini.m',
    activationRequestedAt: '2026-09-13T14:00:00Z', createdAt: '2026-09-13T13:55:00Z',
  },
]

// Mock deactivation requests — GET /api/prosumers/deactivation-requests
const mockDeactivation = [
  {
    nic: '541097654V', fullName: 'Ruwan Bandara', email: 'ruwan@example.com',
    phoneNumber: '+94 72 999 0000', address: 'Kurunegala', username: 'ruwan.b',
    deactivationRequestedAt: '2026-09-11T09:00:00Z',
    deactivationReason: 'Moving to another energy provider in my area.',
  },
  {
    nic: '980123456V', fullName: 'Hiruni Senanayake', email: 'hiruni@example.com',
    phoneNumber: '+94 76 543 2109', address: 'Badulla', username: 'hiruni.s',
    deactivationRequestedAt: '2026-09-14T08:00:00Z',
    deactivationReason: 'Personal reasons, no longer need the service.',
  },
]

const TABS = ['Pending Activations', 'Deactivation Requests']

function ProsumerCard({ prosumer, actions, type }) {
  const initials = prosumer.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)
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
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">NIC: {prosumer.nic} · @{prosumer.username}</p>
            </div>
            <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              {new Date(type === 'activation' ? prosumer.activationRequestedAt : prosumer.deactivationRequestedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
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
                <button
                  type="button"
                  onClick={() => actions.dismiss(prosumer.nic)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Dismiss
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
  const [pending, setPending] = useState(mockPending)
  const [deactivation, setDeactivation] = useState(mockDeactivation)

  const actions = {
    activate: (nic) => setPending((prev) => prev.filter((p) => p.nic !== nic)),
    reject: (nic) => setPending((prev) => prev.filter((p) => p.nic !== nic)),
    approveDeactivation: (nic) => setDeactivation((prev) => prev.filter((p) => p.nic !== nic)),
    dismiss: (nic) => setDeactivation((prev) => prev.filter((p) => p.nic !== nic)),
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
          {items.length === 0 ? (
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
