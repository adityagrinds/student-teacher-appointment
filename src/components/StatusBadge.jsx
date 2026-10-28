const LABELS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
  AVAILABLE: 'Available',
  BOOKED: 'Booked',
  PAST: 'Past',
  INACTIVE: 'Inactive',
}

export default function StatusBadge({ status }) {
  const key = String(status || '').toUpperCase()
  return <span className={`badge badge-${key.toLowerCase()}`}>{LABELS[key] || status}</span>
}
