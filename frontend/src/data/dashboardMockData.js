export const dashboardMetrics = [
  {
    label: 'Total energy traded',
    value: '24,892',
    unit: 'kWh',
    change: '+12.8%',
    trend: 'up',
    icon: 'energy',
    accent: 'amber',
  },
  {
    label: 'Active prosumers',
    value: '1,284',
    unit: '',
    change: '+8.4%',
    trend: 'up',
    icon: 'users',
    accent: 'blue',
  },
  {
    label: 'Nodes online',
    value: '42',
    unit: '',
    change: '+3.2%',
    trend: 'up',
    icon: 'nodes',
    accent: 'violet',
  },
  {
    label: 'Reservation utilization',
    value: '78%',
    unit: '',
    change: '+6.1%',
    trend: 'up',
    icon: 'calendar',
    accent: 'emerald',
  },
  {
    label: 'Average settlement',
    value: '2.4',
    unit: 'hrs',
    change: '-8.3%',
    trend: 'down',
    icon: 'clock',
    accent: 'rose',
  },
  {
    label: 'Pending actions',
    value: '18',
    unit: '',
    change: '-4.6%',
    trend: 'down',
    icon: 'alert',
    accent: 'slate',
  },
]

export const pendingProsumerActions = [
  { prosumer: 'Alicia Gomez', request: 'Reactivation', node: 'North Ridge', value: '$920.00', status: 'Needs review', time: '12 min ago' },
  { prosumer: 'Daniel Park', request: 'Meter update', node: 'Lakeview', value: '$240.00', status: 'Approved', time: '28 min ago' },
  { prosumer: 'Imran Yusuf', request: 'Capacity increase', node: 'Cedar Heights', value: '$1,470.00', status: 'Pending', time: '54 min ago' },
  { prosumer: 'Priya Nair', request: 'KYC review', node: 'Green Valley', value: '$410.00', status: 'Escalated', time: '1 hr ago' },
  { prosumer: 'Noah Smith', request: 'Profile update', node: 'Sunset View', value: '$180.00', status: 'Approved', time: '2 hrs ago' },
]

export const reservationStatus = [
  { name: 'Approved', value: 54, color: '#10b981' },
  { name: 'Pending', value: 26, color: '#3b82f6' },
  { name: 'Needs review', value: 12, color: '#f59e0b' },
  { name: 'Cancelled', value: 8, color: '#f87171' },
]

export const reservationActivity = [
  { day: 'Mon', approved: 18, pending: 11, cancelled: 4 },
  { day: 'Tue', approved: 22, pending: 9, cancelled: 5 },
  { day: 'Wed', approved: 20, pending: 13, cancelled: 3 },
  { day: 'Thu', approved: 24, pending: 12, cancelled: 7 },
  { day: 'Fri', approved: 26, pending: 10, cancelled: 4 },
  { day: 'Sat', approved: 28, pending: 16, cancelled: 6 },
  { day: 'Sun', approved: 25, pending: 14, cancelled: 5 },
]

export const recentReservations = [
  { id: 'RES-1284', prosumer: 'Liam Anderson', node: 'North Ridge', slot: '12:00–14:00', value: '420 kWh', status: 'Confirmed', date: 'Today, 10:42 AM' },
  { id: 'RES-1283', prosumer: 'Maya Fernando', node: 'Lakeview', slot: '09:00–11:00', value: '280 kWh', status: 'Pending', date: 'Today, 09:16 AM' },
  { id: 'RES-1282', prosumer: 'Noah Williams', node: 'Cedar Heights', slot: '16:00–18:00', value: '650 kWh', status: 'Review', date: 'Yesterday, 04:35 PM' },
  { id: 'RES-1281', prosumer: 'Sofia Perera', node: 'Green Valley', slot: '11:00–13:00', value: '190 kWh', status: 'Confirmed', date: 'Yesterday, 01:08 PM' },
  { id: 'RES-1280', prosumer: 'Ethan Brown', node: 'Sunset View', slot: '14:00–16:00', value: '510 kWh', status: 'Pending', date: 'Jun 12, 11:22 AM' },
]

export const nodeOverview = [
  { name: 'North Ridge', id: 'NODE-0042', output: '84.2 kW', health: 94, status: 'Healthy', color: 'bg-emerald-500' },
  { name: 'Lakeview Estate', id: 'NODE-0038', output: '71.8 kW', health: 89, status: 'Healthy', color: 'bg-emerald-500' },
  { name: 'Green Valley', id: 'NODE-0031', output: '0 kW', health: 72, status: 'Maintenance', color: 'bg-amber-500' },
  { name: 'Cedar Heights', id: 'NODE-0027', output: '63.4 kW', health: 91, status: 'Healthy', color: 'bg-emerald-500' },
]

export const quickActions = [
  { label: 'Review requests', detail: '3 prosumer actions waiting', icon: 'user', to: '/backoffice/prosumers/requests', color: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300' },
  { label: 'Add new node', detail: 'Connect a solar resource', icon: 'plus', to: '/backoffice/nodes/new', color: 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300' },
  { label: 'Create energy slot', detail: 'Publish available capacity', icon: 'calendar', to: '/backoffice/energy-slots', color: 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300' },
  { label: 'Approve reservations', detail: '8 waiting for review', icon: 'check', to: '/backoffice/reservations/pending', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' },
  { label: 'Export report', detail: 'Download weekly snapshot', icon: 'download', to: '/backoffice/reports', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' },
]

export const energyOverview = [
  { day: 'Mon', generated: 3900, consumed: 3100 },
  { day: 'Tue', generated: 4300, consumed: 3500 },
  { day: 'Wed', generated: 3700, consumed: 3000 },
  { day: 'Thu', generated: 5100, consumed: 4100 },
  { day: 'Fri', generated: 4700, consumed: 3800 },
  { day: 'Sat', generated: 5800, consumed: 4500 },
  { day: 'Sun', generated: 5400, consumed: 4200 },
]

export const recentTransactions = [
  { id: '#TRX-8421', prosumer: 'Liam Anderson', type: 'Energy sale', amount: '420 kWh', value: '$58.80', date: 'Today, 10:42 AM', status: 'Completed', initials: 'LA', color: 'bg-blue-100 text-blue-700' },
  { id: '#TRX-8420', prosumer: 'Maya Fernando', type: 'Energy purchase', amount: '280 kWh', value: '$39.20', date: 'Today, 09:16 AM', status: 'Completed', initials: 'MF', color: 'bg-amber-100 text-amber-700' },
  { id: '#TRX-8419', prosumer: 'Noah Williams', type: 'Energy sale', amount: '650 kWh', value: '$91.00', date: 'Yesterday, 04:35 PM', status: 'Processing', initials: 'NW', color: 'bg-violet-100 text-violet-700' },
  { id: '#TRX-8418', prosumer: 'Sofia Perera', type: 'Energy sale', amount: '190 kWh', value: '$26.60', date: 'Yesterday, 01:08 PM', status: 'Completed', initials: 'SP', color: 'bg-emerald-100 text-emerald-700' },
  { id: '#TRX-8417', prosumer: 'Ethan Brown', type: 'Energy purchase', amount: '510 kWh', value: '$71.40', date: 'Jun 12, 11:22 AM', status: 'Pending', initials: 'EB', color: 'bg-rose-100 text-rose-700' },
]

export const nodeStatus = [
  { name: 'North Ridge', id: 'NODE-0042', output: '84.2 kW', health: 98, status: 'Online', color: 'bg-emerald-500' },
  { name: 'Lakeview Estate', id: 'NODE-0038', output: '71.8 kW', health: 94, status: 'Online', color: 'bg-emerald-500' },
  { name: 'Green Valley', id: 'NODE-0031', output: '0 kW', health: 72, status: 'Maintenance', color: 'bg-amber-500' },
  { name: 'Cedar Heights', id: 'NODE-0027', output: '63.4 kW', health: 91, status: 'Online', color: 'bg-emerald-500' },
]

export const dashboardAlerts = [
  { title: '3 reactivation requests', detail: 'Review pending prosumer accounts', type: 'warning', action: 'Review requests', to: '/backoffice/prosumers/requests' },
  { title: 'Node NODE-0031 is offline', detail: 'Scheduled maintenance in progress', type: 'info', action: 'View node', to: '/backoffice/nodes' },
]

export const dashboardActivity = [
  { title: 'New prosumer registered', detail: 'Olivia Martin joined the network', time: '12 min ago', icon: 'user' },
  { title: 'Reservation approved', detail: 'RES-1293 for North Ridge node', time: '38 min ago', icon: 'check' },
  { title: 'Energy slot published', detail: 'Solar surplus · 500 kWh available', time: '1 hr ago', icon: 'bolt' },
]
