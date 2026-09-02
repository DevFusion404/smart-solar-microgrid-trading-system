import { Activity, BatteryCharging, CalendarClock, CheckCircle2, CircleAlert, Cpu, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const stats = [
  ['Today’s reservations', '18', CalendarClock, '6 pending review', 'amber'],
  ['Available energy slots', '42', BatteryCharging, 'Across 8 active slots', 'blue'],
  ['Assigned microgrid nodes', '4', Cpu, '3 online now', 'violet'],
  ['Energy delivered today', '1,284 kWh', Zap, '+8.4% from yesterday', 'emerald'],
]
const activity = [
  { time: '08:00', bookings: 4 },
  { time: '10:00', bookings: 7 },
  { time: '12:00', bookings: 11 },
  { time: '14:00', bookings: 8 },
  { time: '16:00', bookings: 14 },
  { time: '18:00', bookings: 10 },
]

function Status({ children, tone = 'green' }) {
  return <span className={tone === 'amber' ? 'rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-400/10 dark:text-amber-300' : 'rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'}>{children}</span>
}

export function OperatorDashboard() {
  return <div className="space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Good morning, Alex</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Operator dashboard</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Monitor today&apos;s bookings, slots, and assigned microgrid nodes.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, Icon, detail, color], index) => <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} whileHover={{ y: -3 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-500 dark:text-slate-400">{label}</p><p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">{value}</p></div><span className={`rounded-xl p-2.5 ${color === 'amber' ? 'bg-amber-100 text-amber-700' : color === 'blue' ? 'bg-blue-100 text-blue-700' : color === 'violet' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}><Icon className="h-5 w-5" /></span></div><p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{detail}</p></motion.div>)}</div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold text-slate-950 dark:text-white">Booking activity</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Reservations scheduled today</p></div><Activity className="h-5 w-5 text-blue-600" /></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={activity}><defs><linearGradient id="operatorFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} /><Tooltip /><Area type="monotone" dataKey="bookings" stroke="#3b82f6" fill="url(#operatorFill)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold text-slate-950 dark:text-white">Node status</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your assigned network</p></div><Cpu className="h-5 w-5 text-violet-600" /></div><div className="space-y-4">{[['Colombo Solar Hub', '84.2 kW', 'Online'], ['Kandy Energy Station', '71.8 kW', 'Online'], ['Galle Solar Hub', '0 kW', 'Maintenance']].map(([name, output, status]) => <div key={name} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800"><div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{name}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{output}</p></div><Status tone={status === 'Online' ? 'green' : 'amber'}>{status}</Status></div>)}</div></section>
    </div>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-slate-950 dark:text-white">Upcoming bookings</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Reservations requiring operator attention</p></div><button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</button></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800"><tr><th className="px-3 py-3">Reservation</th><th className="px-3 py-3">Prosumer</th><th className="px-3 py-3">Node</th><th className="px-3 py-3">Time</th><th className="px-3 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{[['R001', 'Kasun Silva', 'Colombo Solar Hub', '09:00 AM', 'Approved'], ['R002', 'Nimal Perera', 'Kandy Energy Station', '10:30 AM', 'Pending'], ['R003', 'Amal Fernando', 'Galle Solar Hub', '01:00 PM', 'Approved']].map(([id, person, node, time, status]) => <tr key={id}><td className="px-3 py-4 font-medium text-slate-800 dark:text-slate-200">{id}</td><td className="px-3 py-4 text-slate-600 dark:text-slate-400">{person}</td><td className="px-3 py-4 text-slate-600 dark:text-slate-400">{node}</td><td className="px-3 py-4 text-slate-600 dark:text-slate-400">{time}</td><td className="px-3 py-4"><Status tone={status === 'Pending' ? 'amber' : 'green'}>{status}</Status></td></tr>)}</tbody></table></div></section>
    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Network services are operating normally <CircleAlert className="ml-3 h-4 w-4 text-amber-500" /> 1 node needs attention</div>
  </div>
}
