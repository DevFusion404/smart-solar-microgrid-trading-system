import { ArrowRight, Cpu, Gauge, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Panel, SectionHeading } from '../common/Panel'
import { StatusBadge } from '../common/StatusBadge'

export function NodeOverview({ stations = [], loading = false }) {
  const activeCount = stations.filter((s) => s.status === 'Active').length
  const totalStations = stations.length
  const healthPercent = totalStations > 0 ? Math.round((activeCount / totalStations) * 100) : 0
  const totalCapacity = stations.reduce((acc, s) => acc + (s.energyCapacity || 0), 0)

  return (
    <Panel className="p-5 md:p-6">
      <SectionHeading
        title="Node overview"
        description="Live status of the microgrid network"
        action={
          <Link
            to="/backoffice/nodes"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <div className="mt-5 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">
            <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin opacity-50" />
            Loading microgrid nodes…
          </div>
        ) : totalStations === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No microgrid stations registered yet.
          </div>
        ) : (
          stations.slice(0, 4).map((node) => {
            const isActive = node.status === 'Active'
            return (
              <div key={node.id || node.stationId} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <Cpu className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {node.stationName || node.stationId}
                    </p>
                    <StatusBadge status={node.status || 'Active'} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: isActive ? '100%' : '20%' }}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{node.stationId}</span>
                    <span className="hidden text-[11px] text-slate-400 sm:inline">
                      · {node.energyCapacity || 0} kW cap.
                    </span>
                  </div>
                </div>
                <Link
                  to="/backoffice/nodes"
                  title="View node details"
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )
          })
        )}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <Gauge className="h-4 w-4 text-emerald-500" />
          Active online: <strong className="text-slate-700 dark:text-slate-200">{activeCount} of {totalStations} ({healthPercent}%)</strong>
        </span>
        <span className="text-slate-400">
          {totalCapacity.toLocaleString()} kW grid capacity
        </span>
      </div>
    </Panel>
  )
}

export function NodeStatus(props) {
  return <NodeOverview {...props} />
}
