// Dates are stored as YYYY-MM-DD, times as HH:mm, both in the local timezone.

const pad = (n) => String(n).padStart(2, '0')

export function toDateString(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const todayString = () => toDateString(new Date())

export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(total) {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

export function formatTime(time) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${pad(hour)}:${pad(m)} ${suffix}`
}

export const formatRange = (start, end) => `${formatTime(start)} - ${formatTime(end)}`

export function formatDate(dateStr, opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!dateStr) return ''
  return parseDate(dateStr).toLocaleDateString(undefined, opts)
}

export function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export const slotStartTimestamp = (dateStr, time) => {
  const d = parseDate(dateStr)
  d.setHours(0, timeToMinutes(time), 0, 0)
  return d.getTime()
}

export const isPastSlot = (dateStr, startTime) => slotStartTimestamp(dateStr, startTime) <= Date.now()

/** Splits [start, end) into consecutive slots; never emits a slot that overruns the end. */
export function generateTimeSlots(startTime, endTime, duration) {
  const slots = []
  const end = timeToMinutes(endTime)
  const step = Number(duration)
  if (!step || step <= 0) return slots
  for (let s = timeToMinutes(startTime); s + step <= end; s += step) {
    const startT = minutesToTime(s)
    const endT = minutesToTime(s + step)
    slots.push({
      startTime: startT,
      endTime: endT,
      key: `${startT.replace(':', '')}-${endT.replace(':', '')}`,
      label: formatRange(startT, endT),
    })
  }
  return slots
}

export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd)
}
