import { useState } from 'react'
import Modal from './Modal'
import FormField from './FormField'
import { useToast } from '../hooks/useAuth'
import { createBooking } from '../services/appointmentService'
import { friendlyError } from '../utils/errors'
import { PURPOSES, LIMITS } from '../utils/constants'
import { formatDate } from '../utils/dateTime'
import { validateBooking } from '../utils/validation'

export default function BookingModal({ pick, student, onClose }) {
  // `pick` is { slot, timeSlot } or null; the inner form remounts per pick so its state starts clean
  return (
    <Modal open={!!pick} title="Request an appointment" onClose={onClose}>
      {pick && <BookingForm key={`${pick.slot.id}-${pick.timeSlot.key}`} pick={pick} student={student} onClose={onClose} />}
    </Modal>
  )
}

function BookingForm({ pick: { slot, timeSlot }, student, onClose }) {
  const toast = useToast()
  const [purposeCategory, setPurpose] = useState('')
  const [reasonDetails, setReason] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const found = validateBooking({ purposeCategory, reasonDetails, date: slot.date, startTime: timeSlot.startTime })
    setErrors(found)
    if (Object.keys(found).length) return
    setSubmitting(true)
    try {
      const appt = await createBooking({ slot, timeSlot, student, purposeCategory, reasonDetails })
      toast.success(`Request sent (${appt.bookingId}). You will be notified when the teacher responds.`)
      onClose()
    } catch (err) {
      toast.error(friendlyError(err, 'Could not send your booking request.'))
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="form-stack">
      <dl className="summary">
        <dt>Teacher</dt>
        <dd>{slot.teacherName}</dd>
        <dt>Date</dt>
        <dd>{formatDate(slot.date)}</dd>
        <dt>Time</dt>
        <dd>{timeSlot.label}</dd>
        <dt>Location</dt>
        <dd>{slot.cabinNo}</dd>
      </dl>
      {errors.slot && <p className="field-error" role="alert">{errors.slot}</p>}
      <FormField as="select" label="Purpose" value={purposeCategory} onChange={(e) => setPurpose(e.target.value)} error={errors.purposeCategory} data-autofocus>
        <option value="">Select a purpose</option>
        {PURPOSES.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </FormField>
      <FormField
        as="textarea"
        label="Reason for the meeting"
        rows={4}
        maxLength={LIMITS.reasonMax}
        value={reasonDetails}
        onChange={(e) => setReason(e.target.value)}
        error={errors.reasonDetails}
        hint={`${reasonDetails.trim().length}/${LIMITS.reasonMax} (minimum ${LIMITS.reasonMin} characters)`}
      />
      <div className="modal-footer-inline">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Sending...' : 'Submit request'}
        </button>
      </div>
    </form>
  )
}
