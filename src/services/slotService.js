import { ref, update } from 'firebase/database'
import { db } from '../firebase'
import { addLog, newKey, nowIso, fetchByChild, actorOf } from './dbHelpers'
import { addCancellation, getTeacherAppointments, isActiveStatus } from './appointmentService'
import { AppError } from '../utils/errors'
import { validateOfficeHour } from '../utils/validation'
import { formatDate, formatRange } from '../utils/dateTime'

export const getTeacherSlots = (teacherId) => fetchByChild('availabilitySlots', 'teacherId', teacherId)

const describe = (s) => `${formatDate(s.date)} ${formatRange(s.startTime, s.endTime)}`

/** Appointments that still depend on this office hour (pending, approved or completed). */
export const connectedAppointments = (slotId, appointments) =>
  appointments.filter((a) => a.slotId === slotId && ['PENDING', 'APPROVED', 'COMPLETED'].includes(a.status))

export async function publishOfficeHour(teacher, form) {
  const existing = await getTeacherSlots(teacher.uid)
  const errors = validateOfficeHour(form, existing)
  const first = Object.values(errors)[0]
  if (first) throw new AppError(first)
  const id = newKey('availabilitySlots')
  const stamp = nowIso()
  const slot = {
    teacherId: teacher.uid,
    teacherName: teacher.name,
    date: form.date,
    startTime: form.startTime,
    endTime: form.endTime,
    slotDuration: Number(form.slotDuration),
    cabinNo: form.cabinNo.trim(),
    instructions: (form.instructions || '').trim(),
    status: 'ACTIVE',
    createdAt: stamp,
    updatedAt: stamp,
  }
  const updates = { [`availabilitySlots/${id}`]: slot }
  addLog(updates, actorOf(teacher), 'OFFICE_HOUR', `${teacher.name} published office hours ${describe(slot)}`)
  await update(ref(db), updates)
  return { id, ...slot }
}

/** Time/duration can only change while no appointment depends on the office hour. */
export async function editOfficeHour(slot, form, actor) {
  const appointments = await getTeacherAppointments(slot.teacherId)
  const locked = connectedAppointments(slot.id, appointments).length > 0
  const next = locked ? { ...slot, cabinNo: form.cabinNo, instructions: form.instructions } : { ...slot, ...form }
  if (!locked) {
    const existing = await getTeacherSlots(slot.teacherId)
    const errors = validateOfficeHour(next, existing, slot.id)
    const first = Object.values(errors)[0]
    if (first) throw new AppError(first)
  } else if (!String(next.cabinNo || '').trim()) {
    throw new AppError('Location is required.')
  }
  const updates = {
    [`availabilitySlots/${slot.id}/cabinNo`]: next.cabinNo.trim(),
    [`availabilitySlots/${slot.id}/instructions`]: (next.instructions || '').trim(),
    [`availabilitySlots/${slot.id}/updatedAt`]: nowIso(),
  }
  if (!locked) {
    updates[`availabilitySlots/${slot.id}/date`] = next.date
    updates[`availabilitySlots/${slot.id}/startTime`] = next.startTime
    updates[`availabilitySlots/${slot.id}/endTime`] = next.endTime
    updates[`availabilitySlots/${slot.id}/slotDuration`] = Number(next.slotDuration)
  }
  addLog(updates, actor, 'OFFICE_HOUR', `${actor.name} edited office hours ${describe(next)}`)
  await update(ref(db), updates)
}

/** CLOSED stops new bookings; CANCELLED/delete also cancel connected pending/approved bookings. */
export async function setOfficeHourStatus(slot, status, actorProfile) {
  const actor = actorOf(actorProfile)
  const updates = {
    [`availabilitySlots/${slot.id}/status`]: status,
    [`availabilitySlots/${slot.id}/updatedAt`]: nowIso(),
  }
  if (status === 'CANCELLED') {
    const appointments = await getTeacherAppointments(slot.teacherId)
    appointments
      .filter((a) => a.slotId === slot.id && isActiveStatus(a.status))
      .forEach((a) => addCancellation(updates, a, actor, 'The office hour was cancelled.'))
  }
  addLog(updates, actor, 'OFFICE_HOUR', `${actor.name} set office hours ${describe(slot)} to ${status}`)
  await update(ref(db), updates)
}

export async function deleteOfficeHour(slot, actorProfile) {
  const actor = actorOf(actorProfile)
  const updates = { [`availabilitySlots/${slot.id}`]: null }
  const appointments = await getTeacherAppointments(slot.teacherId)
  appointments
    .filter((a) => a.slotId === slot.id && isActiveStatus(a.status))
    .forEach((a) => addCancellation(updates, a, actor, 'The office hour was deleted.'))
  addLog(updates, actor, 'OFFICE_HOUR', `${actor.name} deleted office hours ${describe(slot)}`)
  await update(ref(db), updates)
}
