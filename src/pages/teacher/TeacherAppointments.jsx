import { useMemo, useState } from 'react'
import { Check, X, CheckCheck, Ban } from 'lucide-react'
import { useAuth, useToast } from '../../hooks/useAuth'
import { useMyAppointments } from '../../hooks/useAppointments'
import { cancelAppointment, decideAppointment } from '../../services/appointmentService'
import { friendlyError } from '../../utils/errors'
import { LIMITS } from '../../utils/constants'
import SearchInput from '../../components/SearchInput'
import AppointmentCard from '../../components/AppointmentCard'
import ConfirmModal from '../../components/ConfirmModal'
import FormField from '../../components/FormField'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'

const TABS = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED']

const ACTION_COPY = {
  APPROVED: { title: 'Approve this request?', label: 'Approve', danger: false },
  REJECTED: { title: 'Reject this request?', label: 'Reject', danger: true },
  COMPLETED: { title: 'Mark as completed?', label: 'Mark completed', danger: false },
  CANCEL: { title: 'Cancel this appointment?', label: 'Cancel appointment', danger: true },
}

export default function TeacherAppointments() {
  const { userProfile } = useAuth()
  const toast = useToast()
  const { data, loading, error } = useMyAppointments()
  const [tab, setTab] = useState('PENDING')
  const [search, setSearch] = useState('')
  const [date, setDate] = useState('')
  const [action, setAction] = useState(null) // { type, appointment }
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [busy, setBusy] = useState(false)

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t, data.filter((a) => a.status === t).length])), [data])
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data
      .filter((a) => a.status === tab)
      .filter((a) => !date || a.date === date)
      .filter((a) => !q || a.studentName.toLowerCase().includes(q) || (a.studentRollNo || '').toLowerCase().includes(q))
  }, [data, tab, search, date])

  const openAction = (type, appointment) => {
    setAction({ type, appointment })
    setNote('')
    setReason('')
    setReasonError('')
  }

  const confirm = async () => {
    const { type, appointment } = action
    if (type === 'REJECTED' && !reason.trim()) {
      setReasonError('Please give a reason for rejecting.')
      return
    }
    setBusy(true)
    try {
      if (type === 'CANCEL') {
        await cancelAppointment({ appointment, actorProfile: userProfile, reason: reason.trim() || 'Cancelled by the teacher.' })
      } else {
        await decideAppointment({ appointment, action: type, note, reason, teacher: userProfile })
      }
      toast.success(`${appointment.bookingId}: done.`)
      setAction(null)
    } catch (err) {
      toast.error(friendlyError(err, 'Could not update this appointment.'))
    } finally {
      setBusy(false)
    }
  }

  const copy = action ? ACTION_COPY[action.type] : null

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Appointments</h1>
      </div>
      <div className="segmented segmented-scroll" role="tablist" aria-label="Appointment status">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>
            {t.charAt(0) + t.slice(1).toLowerCase()} ({counts[t]})
          </button>
        ))}
      </div>
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search student name or roll number" label="Search appointments" />
        <label className="select-inline">
          <span className="sr-only">Filter by date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        {date && (
          <button type="button" className="btn btn-secondary" onClick={() => setDate('')}>
            Clear date
          </button>
        )}
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="skeleton skeleton-card" />
      ) : rows.length === 0 ? (
        <EmptyState title={`No ${tab.toLowerCase()} appointments`} />
      ) : (
        <div className="card-grid">
          {rows.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              viewer="teacher"
              actions={
                <>
                  {a.status === 'PENDING' && (
                    <>
                      <button type="button" className="btn btn-success" onClick={() => openAction('APPROVED', a)}>
                        <Check size={16} aria-hidden="true" /> Approve
                      </button>
                      <button type="button" className="btn btn-danger-outline" onClick={() => openAction('REJECTED', a)}>
                        <X size={16} aria-hidden="true" /> Reject
                      </button>
                    </>
                  )}
                  {a.status === 'APPROVED' && (
                    <>
                      <button type="button" className="btn btn-primary" onClick={() => openAction('COMPLETED', a)}>
                        <CheckCheck size={16} aria-hidden="true" /> Mark completed
                      </button>
                      <button type="button" className="btn btn-danger-outline" onClick={() => openAction('CANCEL', a)}>
                        <Ban size={16} aria-hidden="true" /> Cancel
                      </button>
                    </>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!action}
        title={copy?.title || ''}
        message={action ? `${action.appointment.bookingId} · ${action.appointment.studentName} · ${action.appointment.timeSlot}` : ''}
        confirmLabel={copy?.label}
        danger={copy?.danger}
        loading={busy}
        onConfirm={confirm}
        onCancel={() => setAction(null)}
      >
        <div className="form-stack">
          {action?.type === 'REJECTED' && (
            <FormField as="textarea" rows={2} label="Rejection reason (shown to the student)" maxLength={LIMITS.noteMax} value={reason} onChange={(e) => setReason(e.target.value)} error={reasonError} data-autofocus />
          )}
          {action?.type === 'CANCEL' && (
            <FormField as="textarea" rows={2} label="Reason (optional)" maxLength={LIMITS.noteMax} value={reason} onChange={(e) => setReason(e.target.value)} />
          )}
          {action && action.type !== 'CANCEL' && (
            <FormField as="textarea" rows={2} label="Note for the student (optional)" maxLength={LIMITS.noteMax} value={note} onChange={(e) => setNote(e.target.value)} />
          )}
        </div>
      </ConfirmModal>
    </div>
  )
}
