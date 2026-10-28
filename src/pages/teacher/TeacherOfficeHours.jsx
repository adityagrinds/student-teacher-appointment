import { useMemo, useState } from 'react'
import { ref, query, orderByChild, equalTo } from 'firebase/database'
import { Pencil, Lock, Unlock, Ban, Trash2, Clock, MapPin } from 'lucide-react'
import { db } from '../../firebase'
import { useAuth, useToast } from '../../hooks/useAuth'
import { useRealtime } from '../../hooks/useRealtime'
import { useMyAppointments } from '../../hooks/useAppointments'
import { connectedAppointments, deleteOfficeHour, editOfficeHour, publishOfficeHour, setOfficeHourStatus } from '../../services/slotService'
import { actorOf } from '../../services/dbHelpers'
import { friendlyError } from '../../utils/errors'
import { formatDate, formatRange, generateTimeSlots, isPastSlot, todayString } from '../../utils/dateTime'
import StatusBadge from '../../components/StatusBadge'
import OfficeHourForm from '../../components/OfficeHourForm'
import ConfirmModal from '../../components/ConfirmModal'
import Modal from '../../components/Modal'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'

export default function TeacherOfficeHours() {
  const { userProfile } = useAuth()
  const toast = useToast()
  const { data: slots, loading, error } = useRealtime(
    () => query(ref(db, 'availabilitySlots'), orderByChild('teacherId'), equalTo(userProfile.uid)),
    `slots:${userProfile.uid}`,
  )
  const { data: appts } = useMyAppointments()
  const [tab, setTab] = useState('upcoming')
  const [editing, setEditing] = useState(null)
  const [pending, setPending] = useState(null) // { kind: 'cancel' | 'delete', slot }
  const [busy, setBusy] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const { upcoming, past } = useMemo(() => {
    const sorted = [...slots].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    return {
      upcoming: sorted.filter((s) => !isPastSlot(s.date, s.endTime)),
      past: sorted.filter((s) => isPastSlot(s.date, s.endTime)).reverse(),
    }
  }, [slots])
  const list = tab === 'upcoming' ? upcoming : past

  const empty = {
    date: todayString(),
    startTime: '',
    endTime: '',
    slotDuration: 15,
    cabinNo: userProfile.cabinNo || '',
    instructions: '',
  }

  const publish = async (values) => {
    try {
      await publishOfficeHour(userProfile, values)
      toast.success('Office hours published.')
      setFormKey((k) => k + 1)
    } catch (err) {
      toast.error(friendlyError(err, 'Could not publish office hours.'))
    }
  }

  const save = async (values) => {
    try {
      await editOfficeHour(editing, values, actorOf(userProfile))
      toast.success('Office hours updated.')
      setEditing(null)
    } catch (err) {
      toast.error(friendlyError(err, 'Could not update office hours.'))
    }
  }

  const toggleStatus = async (slot, status) => {
    try {
      await setOfficeHourStatus(slot, status, userProfile)
      toast.success(status === 'CLOSED' ? 'Office hours closed to new bookings.' : 'Office hours reopened.')
    } catch (err) {
      toast.error(friendlyError(err, 'Could not update office hours.'))
    }
  }

  const confirmPending = async () => {
    setBusy(true)
    try {
      if (pending.kind === 'cancel') await setOfficeHourStatus(pending.slot, 'CANCELLED', userProfile)
      else await deleteOfficeHour(pending.slot, userProfile)
      toast.success(pending.kind === 'cancel' ? 'Office hours cancelled.' : 'Office hours deleted.')
      setPending(null)
    } catch (err) {
      toast.error(friendlyError(err, 'That action failed.'))
    } finally {
      setBusy(false)
    }
  }

  const activeCount = pending ? appts.filter((a) => a.slotId === pending.slot.id && ['PENDING', 'APPROVED'].includes(a.status)).length : 0

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Office hours</h1>
      </div>
      <div className="split">
        <section className="card">
          <h2>Publish office hours</h2>
          <OfficeHourForm key={formKey} initial={empty} existing={slots} onSubmit={publish} submitLabel="Publish" />
        </section>

        <section className="stack">
          <div className="segmented" role="tablist" aria-label="Schedule filter">
            {[
              ['upcoming', `Upcoming (${upcoming.length})`],
              ['past', `Past (${past.length})`],
            ].map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>
                {label}
              </button>
            ))}
          </div>
          {error ? (
            <ErrorState message={error} />
          ) : loading ? (
            <div className="skeleton skeleton-card" />
          ) : list.length === 0 ? (
            <EmptyState title={`No ${tab} office hours`} message={tab === 'upcoming' ? 'Publish your first schedule using the form.' : undefined} />
          ) : (
            list.map((s) => {
              const connected = connectedAppointments(s.id, appts).length
              const isPast = isPastSlot(s.date, s.endTime)
              return (
                <article key={s.id} className="card">
                  <header className="appt-head">
                    <div>
                      <h3>{formatDate(s.date)}</h3>
                      <p className="muted">
                        <Clock size={14} aria-hidden="true" /> {formatRange(s.startTime, s.endTime)} · {s.slotDuration} min ·{' '}
                        {generateTimeSlots(s.startTime, s.endTime, s.slotDuration).length} slots
                      </p>
                      <p className="muted">
                        <MapPin size={14} aria-hidden="true" /> {s.cabinNo} · {connected} booking{connected === 1 ? '' : 's'}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </header>
                  {s.instructions && <p className="note">{s.instructions}</p>}
                  <footer className="appt-actions">
                    {!isPast && s.status !== 'CANCELLED' && (
                      <button type="button" className="btn btn-secondary" onClick={() => setEditing(s)}>
                        <Pencil size={16} aria-hidden="true" /> Edit
                      </button>
                    )}
                    {!isPast && s.status === 'ACTIVE' && (
                      <button type="button" className="btn btn-secondary" onClick={() => toggleStatus(s, 'CLOSED')}>
                        <Lock size={16} aria-hidden="true" /> Close
                      </button>
                    )}
                    {!isPast && s.status === 'CLOSED' && (
                      <button type="button" className="btn btn-secondary" onClick={() => toggleStatus(s, 'ACTIVE')}>
                        <Unlock size={16} aria-hidden="true" /> Reopen
                      </button>
                    )}
                    {!isPast && s.status !== 'CANCELLED' && (
                      <button type="button" className="btn btn-danger-outline" onClick={() => setPending({ kind: 'cancel', slot: s })}>
                        <Ban size={16} aria-hidden="true" /> Cancel
                      </button>
                    )}
                    <button type="button" className="btn btn-danger-outline" onClick={() => setPending({ kind: 'delete', slot: s })}>
                      <Trash2 size={16} aria-hidden="true" /> Delete
                    </button>
                  </footer>
                </article>
              )
            })
          )}
        </section>
      </div>

      <Modal open={!!editing} title="Edit office hours" onClose={() => setEditing(null)}>
        {editing && (
          <OfficeHourForm
            key={editing.id}
            initial={{ ...editing, instructions: editing.instructions || '' }}
            existing={slots}
            ignoreId={editing.id}
            lockTimes={connectedAppointments(editing.id, appts).length > 0}
            onSubmit={save}
            submitLabel="Save changes"
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmModal
        open={!!pending}
        title={pending?.kind === 'cancel' ? 'Cancel these office hours?' : 'Delete these office hours?'}
        message={
          activeCount > 0
            ? `${activeCount} pending or approved booking${activeCount === 1 ? ' is' : 's are'} connected. They will be cancelled and the students notified.`
            : pending?.kind === 'delete'
              ? 'This removes the office hours permanently.'
              : 'Students will no longer be able to book this schedule.'
        }
        confirmLabel={pending?.kind === 'cancel' ? 'Cancel office hours' : 'Delete'}
        danger
        loading={busy}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
