import { useMemo, useState } from 'react'
import { ref } from 'firebase/database'
import { Eye } from 'lucide-react'
import { db } from '../../firebase'
import { useAuth, useToast } from '../../hooks/useAuth'
import { useRealtime } from '../../hooks/useRealtime'
import { adminSetAppointmentStatus } from '../../services/appointmentService'
import { friendlyError } from '../../utils/errors'
import { APPOINTMENT_STATUS, LIMITS } from '../../utils/constants'
import { formatDate, formatDateTime } from '../../utils/dateTime'
import DataTable from '../../components/DataTable'
import SearchInput from '../../components/SearchInput'
import StatusBadge from '../../components/StatusBadge'
import ConfirmModal from '../../components/ConfirmModal'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import ErrorState from '../../components/ErrorState'

const STATUSES = Object.values(APPOINTMENT_STATUS)

export default function AdminAppointments() {
  const { userProfile: admin } = useAuth()
  const toast = useToast()
  const { data, loading, error } = useRealtime(() => ref(db, 'appointments'), 'appointments:all')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data
      .filter((a) => !status || a.status === status)
      .filter((a) => !q || [a.bookingId, a.studentName, a.studentRollNo, a.teacherName].some((v) => (v || '').toLowerCase().includes(q)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [data, search, status])

  // read from live data so the dialog reflects changes as they happen
  const selected = data.find((a) => a.id === selectedId) || null

  const open = (a) => {
    setSelectedId(a.id)
    setNewStatus(a.status)
    setAdminNote(a.adminNote || '')
  }

  const apply = async () => {
    setBusy(true)
    try {
      await adminSetAppointmentStatus({ appointment: selected, status: newStatus, adminNote, admin })
      toast.success(`${selected.bookingId} updated to ${newStatus.toLowerCase()}.`)
      setConfirming(false)
      setSelectedId(null)
    } catch (err) {
      toast.error(friendlyError(err, 'Could not update the appointment.'))
      setConfirming(false)
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    { key: 'bookingId', header: 'Reference', render: (a) => <strong>{a.bookingId}</strong> },
    { key: 'student', header: 'Student', render: (a) => `${a.studentName} (${a.studentRollNo || '-'})` },
    { key: 'teacherName', header: 'Teacher' },
    { key: 'when', header: 'When', render: (a) => `${formatDate(a.date)}, ${a.timeSlot}` },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (a) => (
        <button type="button" className="icon-btn" aria-label={`View ${a.bookingId}`} title="View details" onClick={() => open(a)}>
          <Eye size={16} />
        </button>
      ),
    },
  ]

  const changed = selected && (newStatus !== selected.status || adminNote.trim() !== (selected.adminNote || ''))

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Appointments</h1>
      </div>
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search reference, student or teacher" label="Search appointments" />
        <label className="select-inline">
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? <ErrorState message={error} /> : <DataTable columns={columns} rows={rows} loading={loading} emptyTitle="No appointments found" />}

      <Modal open={!!selected && !confirming} title={selected?.bookingId || ''} onClose={() => setSelectedId(null)} wide>
        {selected && (
          <div className="form-stack">
            <dl className="summary">
              {[
                ['Student', `${selected.studentName} (${selected.studentRollNo || '-'})`],
                ['Teacher', selected.teacherName],
                ['Date', formatDate(selected.date)],
                ['Time', selected.timeSlot],
                ['Location', selected.cabinNo],
                ['Purpose', selected.purposeCategory],
                ['Reason', selected.reasonDetails],
                ['Teacher note', selected.teacherNote],
                ['Rejection reason', selected.rejectionReason],
                ['Cancellation', selected.cancellationReason],
                ['Requested', formatDateTime(selected.createdAt)],
                ['Last update', formatDateTime(selected.updatedAt)],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="summary-row">
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              <div className="summary-row">
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={selected.status} />
                </dd>
              </div>
            </dl>
            <FormField as="select" label="Change status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </FormField>
            <FormField as="textarea" rows={2} label="Admin note" maxLength={LIMITS.noteMax} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
            <div className="modal-footer-inline">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedId(null)}>
                Close
              </button>
              <button type="button" className="btn btn-primary" disabled={!changed} onClick={() => setConfirming(true)}>
                Save changes
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={confirming}
        title="Apply these changes?"
        message={selected ? `${selected.bookingId} will be set to ${newStatus.toLowerCase()}. The student and teacher will be notified.` : ''}
        confirmLabel="Apply"
        loading={busy}
        onConfirm={apply}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}
