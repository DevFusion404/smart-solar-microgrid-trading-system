import { ArrowRight, Cpu, Gauge, MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { nodeOverview } from '../../data/dashboardMockData'
import { IconButton } from '../common/IconButton'
import { Panel, SectionHeading } from '../common/Panel'
import { StatusBadge } from '../common/StatusBadge'

export function NodeOverview() {
  return (
    <Panel className="p-5 md:p-6">
      <SectionHeading
        title="Node overview"
        description="Live health of the microgrid network"
        action={<Link to="/backoffice/nodes" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">View all <ArrowRight className="h-3.5 w-3.5" /></Link>}
      />
      <div className="mt-5 space-y-4">
        {nodeOverview.map((node) => (
          <div key={node.id} className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><Cpu className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{node.name}</p>
                <StatusBadge status={node.status} />
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full ${node.health > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${node.health}%` }} />
                </div>
                <span className="text-[11px] text-slate-400">{node.health}%</span>
                <span className="hidden text-[11px] text-slate-400 sm:inline">· {node.output}</span>
              </div>
            </div>
            <IconButton label={`More options for ${node.name}`}><MoreHorizontal className="h-4 w-4" /></IconButton>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400"><Gauge className="h-4 w-4 text-emerald-500" /> Average network health <strong className="text-slate-700 dark:text-slate-200">90.4%</strong></div>
    </Panel>
  )
}

export function NodeStatus() {
  return <NodeOverview />
}
