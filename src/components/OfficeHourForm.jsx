import { useState } from 'react'
import FormField from './FormField'
import { SLOT_DURATIONS, LIMITS } from '../utils/constants'
import { generateTimeSlots, todayString } from '../utils/dateTime'
import { validateOfficeHour } from '../utils/validation'

/**
 * Office-hour fields. `onSubmit(values)` must return a promise; the button is disabled while it runs
 * so double submissions are impossible. `lockTimes` limits edits to location/instructions.
 */
export default function OfficeHourForm({ initial, existing, ignoreId, onSubmit, submitLabel, lockTimes = false, onCancel }) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))
  const preview = !lockTimes && values.startTime && values.endTime ? generateTimeSlots(values.startTime, values.endTime, values.slotDuration) : []

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!lockTimes) {
      const found = validateOfficeHour(values, existing, ignoreId)
      setErrors(found)
      if (Object.keys(found).length) return
    } else if (!values.cabinNo.trim()) {
      setErrors({ cabinNo: 'Location is required.' })
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="form-stack">
      <div className="form-grid">
        <FormField label="Date" type="date" min={todayString()} value={values.date} onChange={set('date')} error={errors.date} disabled={lockTimes} />
        <FormField label="Slot duration" as="select" value={values.slotDuration} onChange={set('slotDuration')} error={errors.slotDuration} disabled={lockTimes}>
          {SLOT_DURATIONS.map((d) => (
            <option key={d} value={d}>
              {d} minutes
            </option>
          ))}
        </FormField>
        <FormField label="Start time" type="time" value={values.startTime} onChange={set('startTime')} error={errors.startTime} disabled={lockTimes} />
        <FormField label="End time" type="time" value={values.endTime} onChange={set('endTime')} error={errors.endTime} disabled={lockTimes} />
      </div>
      <FormField label="Location / cabin" value={values.cabinNo} onChange={set('cabinNo')} error={errors.cabinNo} />
      <FormField
        as="textarea"
        label="Instructions (optional)"
        rows={3}
        maxLength={LIMITS.instructionsMax}
        value={values.instructions}
        onChange={set('instructions')}
        error={errors.instructions}
      />
      {lockTimes && <p className="note">Date and times are locked because students have bookings on this office hour.</p>}
      {preview.length > 0 && (
        <p className="muted">
          This creates {preview.length} bookable slot{preview.length === 1 ? '' : 's'}: {preview[0].label}
          {preview.length > 1 ? ` ... ${preview[preview.length - 1].label}` : ''}
        </p>
      )}
      <div className="modal-footer-inline">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
