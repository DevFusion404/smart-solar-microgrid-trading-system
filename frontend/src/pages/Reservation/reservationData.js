function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createDateDetails(offset = 0) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offset)

  return {
    key: toDateKey(date),
    label: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date),
    fullLabel: new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }).format(date),
  }
}

const today = createDateDetails()
const yesterday = createDateDetails(-1)
const twoDaysAgo = createDateDetails(-2)
const tomorrow = createDateDetails(1)

export const DEFAULT_RESERVATION_DATE = today.key
export const TODAY_FULL_LABEL = today.fullLabel

export const reservationRows = [
  { id: 'RES-2048', nic: '199845612V', prosumer: 'Ayesha Perera', node: 'Colombo Solar Hub', dateKey: today.key, date: today.label, time: '09:00 - 10:00', status: 'Pending', energy: '420 kWh', created: `${yesterday.label}, 4:42 PM` },
  { id: 'RES-2047', nic: '200176543V', prosumer: 'Kasun Silva', node: 'Kandy Energy Station', dateKey: today.key, date: today.label, time: '10:30 - 11:30', status: 'Approved', energy: '280 kWh', created: `${yesterday.label}, 3:18 PM` },
  { id: 'RES-2043', nic: '199601204V', prosumer: 'Maya Fernando', node: 'Colombo Solar Hub', dateKey: today.key, date: today.label, time: '03:00 - 04:00', status: 'Approved', energy: '180 kWh', created: `${yesterday.label}, 1:05 PM` },
  { id: 'RES-2042', nic: '198887654V', prosumer: 'Dilan Wickramasinghe', node: 'Galle Solar Hub', dateKey: today.key, date: today.label, time: '05:00 - 06:00', status: 'Pending', energy: '310 kWh', created: `${yesterday.label}, 11:24 AM` },
  { id: 'RES-2046', nic: '198934218V', prosumer: 'Nimal Perera', node: 'Galle Solar Hub', dateKey: yesterday.key, date: yesterday.label, time: '01:00 - 02:00', status: 'Completed', energy: '350 kWh', created: `${twoDaysAgo.label}, 6:06 PM` },
  { id: 'RES-2045', nic: '200245876V', prosumer: 'Sofia Fernando', node: 'Colombo Solar Hub', dateKey: tomorrow.key, date: tomorrow.label, time: '02:30 - 03:30', status: 'Approved', energy: '500 kWh', created: `${yesterday.label}, 2:24 PM` },
  { id: 'RES-2044', nic: '199756103V', prosumer: 'Ruwan Jayasinghe', node: 'Jaffna Microgrid', dateKey: tomorrow.key, date: tomorrow.label, time: '04:00 - 05:00', status: 'Cancelled', energy: '220 kWh', created: `${yesterday.label}, 10:11 AM` },
]

export const energySlotRows = [
  { id: 'SLT-018', node: 'Colombo Solar Hub', date: today.label, time: '09:00 - 10:00', capacity: '420 kWh', reserved: '210 kWh', reservedCount: 2, remaining: '210 kWh', utilization: 50, source: 'Solar surplus', created: `${yesterday.label}, 7:15 AM`, status: 'Available' },
  { id: 'SLT-019', node: 'Kandy Energy Station', date: today.label, time: '10:30 - 11:30', capacity: '280 kWh', reserved: '280 kWh', reservedCount: 4, remaining: '0 kWh', utilization: 100, source: 'Solar + battery', created: `${yesterday.label}, 7:02 AM`, status: 'Booked' },
  { id: 'SLT-020', node: 'Galle Solar Hub', date: today.label, time: '01:00 - 02:00', capacity: '350 kWh', reserved: '140 kWh', reservedCount: 2, remaining: '210 kWh', utilization: 40, source: 'Solar surplus', created: `${yesterday.label}, 6:48 AM`, status: 'Available' },
  { id: 'SLT-021', node: 'Colombo Solar Hub', date: tomorrow.label, time: '02:30 - 03:30', capacity: '500 kWh', reserved: '500 kWh', reservedCount: 5, remaining: '0 kWh', utilization: 100, source: 'Solar surplus', created: `${yesterday.label}, 6:25 AM`, status: 'Booked' },
  { id: 'SLT-022', node: 'Jaffna Microgrid', date: tomorrow.label, time: '04:00 - 05:00', capacity: '220 kWh', reserved: '0 kWh', reservedCount: 0, remaining: '220 kWh', utilization: 0, source: 'Wind + solar', created: `${yesterday.label}, 6:12 AM`, status: 'Available' },
]
