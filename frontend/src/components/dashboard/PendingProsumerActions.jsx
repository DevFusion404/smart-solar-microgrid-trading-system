import { ArrowRight, MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { pendingProsumerActions } from '../../data/dashboardMockData'
import { IconButton } from '../common/IconButton'
import { Panel, SectionHeading } from '../common/Panel'
import { StatusBadge } from '../common/StatusBadge'

export function PendingProsumerActions() {
  return (
    <Panel className="overflow-hidden">
      <div className="p-5 pb-3 md:p-6 md:pb-4">
        <SectionHeading
          title="Pending prosumer actions"
          description="Action items awaiting review from operations"
          action={<Link to="/backoffice/prosumers/requests" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">View all <ArrowRight className="h-3.5 w-3.5" /></Link>}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-y border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:bg-slate-950/40">
            <tr>
              <th className="px-5 py-3 font-medium md:px-6">Prosumer</th>
              <th className="px-3 py-3 font-medium">Request</th>
              <th className="px-3 py-3 font-medium">Node</th>
              <th className="px-3 py-3 font-medium">Value</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium md:px-6"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingProsumerActions.map((request) => (
              <tr key={`${request.prosumer}-${request.request}`} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="px-5 py-3.5 md:px-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                      {request.prosumer.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                    </span>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{request.prosumer}</p>
                      <p className="text-xs text-slate-400">{request.time}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5 text-slate-700 dark:text-slate-200">{request.request}</td>
                <td className="px-3 py-3.5 text-slate-600 dark:text-slate-300">{request.node}</td>
                <td className="px-3 py-3.5 font-medium text-slate-800 dark:text-slate-100">{request.value}</td>
                <td className="px-3 py-3.5"><StatusBadge status={request.status} /></td>
                <td className="px-5 py-3.5 text-right md:px-6"><IconButton label={`Open ${request.prosumer}`}><MoreHorizontal className="h-4 w-4" /></IconButton></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
