import { useMemo, useState } from 'react'
import { ref } from 'firebase/database'
import { Ban, CalendarCheck, Lock, Unlock } from 'lucide-react'
import { db } from '../../firebase'
import { useAuth, useToast } from '../../hooks/useAuth'
import { useRealtime } from '../../hooks/useRealtime'
import { setOfficeHourStatus } from '../../services/slotService'
import { friendlyError } from '../../utils/errors'
import { formatDate, formatRange } from '../../utils/dateTime'
import DataTable from '../../components/DataTable'
import SearchInput from '../../components/SearchInput'
import StatusBadge from '../../components/StatusBadge'
import ConfirmModal from '../../components/ConfirmModal'
import Modal from '../../components/Modal'
import ErrorState from '../../components/ErrorState'

export default function AdminOfficeHours() {
  const { userProfile: admin } = useAuth()
  const toast = useToast()
  const { data: slots, loading, error } = useRealtime(() => ref(db, 'availabilitySlots'), 'slots:all')
  const { data: appts } = useRealtime(() => ref(db, 'appointments'), 'appointments:all')
  const [search, setSearch] = useState('')
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('')
  const [related, setRelated] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [busy, setBusy] = useState(false)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return slots
      .filter((s) => !q || s.teacherName.toLowerCase().includes(q))
      .filter((s) => !date || s.date === date)
      .filter((s) => !status || s.status === status)
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime))
  }, [slots, search, date, status])

  const run = async (fn, okMessage) => {
    setBusy(true)
    try {
      await fn()
      toast.success(okMessage)
      setCancelling(null)
    } catch (err) {
      toast.error(friendlyError(err, 'That action failed.'))
    } finally {
      setBusy(false)
    }
  }

  const relatedAppts = related ? appts.filter((a) => a.slotId === related.id) : []

  const columns = [
    { key: 'teacher', header: 'Teacher', render: (s) => <strong>{s.teacherName}</strong> },
    { key: 'date', header: 'Date', render: (s) => formatDate(s.date) },
    { key: 'time', header: 'Time', render: (s) => `${formatRange(s.startTime, s.endTime)} (${s.slotDuration}m)` },
    { key: 'cabinNo', header: 'Location' },
    { key: 'bookings', header: 'Bookings', render: (s) => appts.filter((a) => a.slotId === s.id && ['PENDING', 'APPROVED', 'COMPLETED'].includes(a.status)).length },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <div className="row-gap">
          <button type="button" className="icon-btn" title="View appointments" aria-label="View related appointments" onClick={() => setRelated(s)}>
            <CalendarCheck size={16} />
          </button>
          {s.status === 'ACTIVE' && (
            <button type="button" className="icon-btn" title="Close" aria-label="Close office hours" onClick={() => run(() => setOfficeHourStatus(s, 'CLOSED', admin), 'Office hours closed.')}>
              <Lock size={16} />
            </button>
          )}
          {s.status === 'CLOSED' && (
            <button type="button" className="icon-btn" title="Reopen" aria-label="Reopen office hours" onClick={() => run(() => setOfficeHourStatus(s, 'ACTIVE', admin), 'Office hours reopened.')}>
              <Unlock size={16} />
            </button>
          )}
          {s.status !== 'CANCELLED' && (
            <button type="button" className="icon-btn icon-danger" title="Cancel" aria-label="Cancel office hours" onClick={() => setCancelling(s)}>
              <Ban size={16} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Office hours</h1>
      </div>
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by teacher" label="Search by teacher" />
        <label className="select-inline">
          <span className="sr-only">Filter by date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="select-inline">
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
      </div>
      {error ? <ErrorState message={error} /> : <DataTable columns={columns} rows={rows} loading={loading} emptyTitle="No office hours found" />}

      <Modal open={!!related} title="Related appointments" onClose={() => setRelated(null)} wide>
        {relatedAppts.length === 0 ? (
          <p className="muted">No appointments for this office hour.</p>
        ) : (
          <ul className="plain-list">
            {relatedAppts.map((a) => (
              <li key={a.id}>
                <strong>{a.bookingId}</strong> · {a.studentName} · {a.timeSlot} <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ConfirmModal
        open={!!cancelling}
        title="Cancel these office hours?"
        message="Connected pending and approved bookings will be cancelled and both parties notified."
        confirmLabel="Cancel office hours"
        danger
        loading={busy}
        onConfirm={() => run(() => setOfficeHourStatus(cancelling, 'CANCELLED', admin), 'Office hours cancelled.')}
        onCancel={() => setCancelling(null)}
      />
    </div>
  )
}
