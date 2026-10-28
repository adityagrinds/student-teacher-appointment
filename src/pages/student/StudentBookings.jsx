import { useMemo, useState } from 'react'
import { QrCode, XCircle } from 'lucide-react'
import { useAuth, useToast } from '../../hooks/useAuth'
import { useMyAppointments } from '../../hooks/useAppointments'
import { cancelAppointment, canCancel } from '../../services/appointmentService'
import { friendlyError } from '../../utils/errors'
import SearchInput from '../../components/SearchInput'
import AppointmentCard from '../../components/AppointmentCard'
import AppointmentPass from '../../components/AppointmentPass'
import ConfirmModal from '../../components/ConfirmModal'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED']

export default function StudentBookings() {
  const { userProfile } = useAuth()
  const toast = useToast()
  const { data, loading, error } = useMyAppointments()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [toCancel, setToCancel] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [pass, setPass] = useState(null)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data
      .filter((a) => !status || a.status === status)
      .filter((a) => !q || a.teacherName.toLowerCase().includes(q) || a.bookingId.toLowerCase().includes(q))
  }, [data, status, search])

  const confirmCancel = async () => {
    setCancelling(true)
    try {
      await cancelAppointment({ appointment: toCancel, actorProfile: userProfile, reason: 'Cancelled by the student.' })
      toast.success(`${toCancel.bookingId} was cancelled.`)
      setToCancel(null)
    } catch (err) {
      toast.error(friendlyError(err, 'Could not cancel this booking.'))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="stack">
      <div className="page-head">
        <h1>My bookings</h1>
      </div>
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search teacher or booking reference" label="Search bookings" />
        <div className="chip-filter" role="group" aria-label="Filter by status">
          {['', ...STATUSES].map((s) => (
            <button key={s || 'all'} type="button" className={status === s ? 'is-active' : ''} aria-pressed={status === s} onClick={() => setStatus(s)}>
              {s ? s.charAt(0) + s.slice(1).toLowerCase() : 'All'}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="skeleton skeleton-card" />
      ) : rows.length === 0 ? (
        <EmptyState title="No bookings found" message="Bookings you request will appear here." />
      ) : (
        <div className="card-grid">
          {rows.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              viewer="student"
              actions={
                <>
                  {a.status === 'APPROVED' && (
                    <button type="button" className="btn btn-secondary" onClick={() => setPass(a)}>
                      <QrCode size={16} aria-hidden="true" /> Show pass
                    </button>
                  )}
                  {canCancel(a) && (
                    <button type="button" className="btn btn-danger-outline" onClick={() => setToCancel(a)}>
                      <XCircle size={16} aria-hidden="true" /> Cancel
                    </button>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!toCancel}
        title="Cancel this booking?"
        message={toCancel ? `${toCancel.bookingId} with ${toCancel.teacherName} on ${toCancel.date} (${toCancel.timeSlot}) will be cancelled and the slot released.` : ''}
        confirmLabel="Cancel booking"
        danger
        loading={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => setToCancel(null)}
      />
      <AppointmentPass appointment={pass} onClose={() => setPass(null)} />
    </div>
  )
}
