import { ref, get, update, runTransaction } from 'firebase/database'
import { db } from '../firebase'
import { addLog, addNotification, newKey, nowIso, fetchByChild, actorOf } from './dbHelpers'
import { AppError } from '../utils/errors'
import { ACTIVE_APPOINTMENT_STATUSES, SLOT_STATUS } from '../utils/constants'
import { formatDate, isPastSlot, slotStartTimestamp } from '../utils/dateTime'
import { validateBooking } from '../utils/validation'

const lockPath = (a) => `availabilityBookings/${a.slotId}/${a.timeKey}`
export const isActiveStatus = (status) => ACTIVE_APPOINTMENT_STATUSES.includes(status)

export const getTeacherAppointments = (teacherId) => fetchByChild('appointments', 'teacherId', teacherId)
export const getStudentAppointments = (studentId) => fetchByChild('appointments', 'studentId', studentId)

async function fetchAppointment(id) {
  const snap = await get(ref(db, `appointments/${id}`))
  if (!snap.exists()) throw new AppError('This appointment no longer exists.')
  return { id, ...snap.val() }
}

async function nextBookingId() {
  const result = await runTransaction(ref(db, 'counters/bookingSeq'), (n) => (n || 0) + 1)
  return `BK-${String(result.snapshot.val()).padStart(6, '0')}`
}

/**
 * Creates a PENDING booking. Double booking is prevented by an atomic transaction on the
 * deterministic lock availabilityBookings/{slotId}/{timeKey}: only one writer can claim it.
 */
export async function createBooking({ slot, timeSlot, student, purposeCategory, reasonDetails }) {
  const errors = validateBooking({
    purposeCategory,
    reasonDetails,
    date: slot.date,
    startTime: timeSlot.startTime,
  })
  const firstError = Object.values(errors)[0]
  if (firstError) throw new AppError(firstError)
  if (!student.isActive) throw new AppError('Your account is deactivated.')

  const slotSnap = await get(ref(db, `availabilitySlots/${slot.id}`))
  const fresh = slotSnap.val()
  if (!fresh || fresh.status !== SLOT_STATUS.ACTIVE) throw new AppError('This office hour is no longer available.')
  if (isPastSlot(fresh.date, timeSlot.startTime)) throw new AppError('This time slot is in the past.')

  const appointmentId = newKey('appointments')
  const bookingId = await nextBookingId()
  const stamp = nowIso()
  const lockRef = ref(db, `availabilityBookings/${slot.id}/${timeSlot.key}`)

  const justBooked = new AppError('This slot was just booked by another student.')
  let claim
  try {
    claim = await runTransaction(lockRef, (current) => {
      if (current) return undefined
      return {
        appointmentId,
        studentId: student.uid,
        teacherId: fresh.teacherId,
        status: 'PENDING',
        createdAt: stamp,
      }
    })
  } catch (err) {
    // A rival's lock can surface as permission-denied; if the lock now exists, that is the real cause.
    if ((await get(lockRef)).exists()) throw justBooked
    throw err
  }
  if (!claim.committed) throw justBooked

  const appointment = {
    bookingId,
    slotId: slot.id,
    teacherId: fresh.teacherId,
    studentId: student.uid,
    teacherName: fresh.teacherName,
    studentName: student.name,
    studentRollNo: student.rollNo || '',
    date: fresh.date,
    startTime: timeSlot.startTime,
    timeKey: timeSlot.key,
    timeSlot: timeSlot.label,
    cabinNo: fresh.cabinNo,
    purposeCategory,
    reasonDetails: reasonDetails.trim(),
    status: 'PENDING',
    teacherNote: '',
    slotStartAt: slotStartTimestamp(fresh.date, timeSlot.startTime),
    createdAt: stamp,
    updatedAt: stamp,
  }
  const updates = { [`appointments/${appointmentId}`]: appointment }
  addNotification(updates, {
    userId: fresh.teacherId,
    type: 'BOOKING_REQUEST',
    title: 'New booking request',
    message: `${student.name} requested ${formatDate(fresh.date)}, ${timeSlot.label}.`,
    appointmentId,
    createdBy: student.uid,
  })
  addLog(updates, actorOf(student), 'BOOKING_REQUEST', `${student.name} requested ${bookingId} with ${fresh.teacherName}`)

  try {
    await update(ref(db), updates)
  } catch (err) {
    // Release the lock so the slot does not stay blocked by a booking that was never saved.
    await update(ref(db), { [`availabilityBookings/${slot.id}/${timeSlot.key}`]: null }).catch((e) =>
      console.warn('Could not release slot lock', e),
    )
    throw err
  }
  return { id: appointmentId, ...appointment }
}

/** Teacher actions: APPROVED / REJECTED from PENDING, COMPLETED from APPROVED. */
export async function decideAppointment({ appointment, action, note = '', reason = '', teacher }) {
  const current = await fetchAppointment(appointment.id)
  if (current.teacherId !== teacher.uid) throw new AppError('This is not your appointment.')
  const allowedFrom = action === 'COMPLETED' ? 'APPROVED' : 'PENDING'
  if (current.status !== allowedFrom) {
    throw new AppError(`This request is already ${current.status.toLowerCase()}.`)
  }
  if (action === 'REJECTED' && !reason.trim()) throw new AppError('Please give a reason for rejecting.')

  const base = `appointments/${current.id}`
  const updates = {
    [`${base}/status`]: action,
    [`${base}/updatedAt`]: nowIso(),
    [`${base}/teacherNote`]: note.trim(),
  }
  if (action === 'REJECTED') {
    updates[`${base}/rejectionReason`] = reason.trim()
    updates[lockPath(current)] = null
  } else {
    updates[`${lockPath(current)}/status`] = action
  }
  const label = { APPROVED: 'approved', REJECTED: 'rejected', COMPLETED: 'marked completed' }[action]
  addNotification(updates, {
    userId: current.studentId,
    type: action,
    title: `Booking ${label}`,
    message: `${current.bookingId} with ${teacher.name} on ${formatDate(current.date)} was ${label}.${
      action === 'REJECTED' ? ` Reason: ${reason.trim()}` : ''
    }`,
    appointmentId: current.id,
    createdBy: teacher.uid,
  })
  const logType = { APPROVED: 'APPROVAL', REJECTED: 'REJECTION', COMPLETED: 'COMPLETION' }[action]
  addLog(updates, actorOf(teacher), logType, `${teacher.name} ${label} ${current.bookingId}`)
  await update(ref(db), updates)
}

/** Adds the writes that cancel one active appointment (status, lock release, notification). */
export function addCancellation(updates, appointment, actor, reason) {
  const base = `appointments/${appointment.id}`
  updates[`${base}/status`] = 'CANCELLED'
  updates[`${base}/cancellationReason`] = reason
  updates[`${base}/updatedAt`] = nowIso()
  updates[lockPath(appointment)] = null
  const recipients = [appointment.studentId, appointment.teacherId].filter((uid) => uid !== actor.uid)
  recipients.forEach((userId) =>
    addNotification(updates, {
      userId,
      type: 'CANCELLED',
      title: 'Booking cancelled',
      message: `${appointment.bookingId} on ${formatDate(appointment.date)} (${appointment.timeSlot}) was cancelled. ${reason}`,
      appointmentId: appointment.id,
      createdBy: actor.uid,
    }),
  )
}

export function canCancel(appointment) {
  return isActiveStatus(appointment.status) && !isPastSlot(appointment.date, appointment.startTime)
}

/** Cancels one booking on behalf of the signed-in student, teacher or admin. */
export async function cancelAppointment({ appointment, actorProfile, reason }) {
  const current = await fetchAppointment(appointment.id)
  if (!isActiveStatus(current.status)) throw new AppError(`This booking is already ${current.status.toLowerCase()}.`)
  const actor = actorOf(actorProfile)
  const updates = {}
  addCancellation(updates, current, actor, reason || `Cancelled by ${actor.role}.`)
  addLog(updates, actor, 'CANCELLATION', `${actor.name} cancelled ${current.bookingId}`)
  await update(ref(db), updates)
}

/** Admin override of any appointment's status. Keeps the slot lock consistent with the status. */
export async function adminSetAppointmentStatus({ appointment, status, adminNote, admin }) {
  const current = await fetchAppointment(appointment.id)
  const lockRef = ref(db, lockPath(current))
  const lock = (await get(lockRef)).val()
  const base = `appointments/${current.id}`
  const updates = {
    [`${base}/status`]: status,
    [`${base}/adminNote`]: (adminNote || '').trim(),
    [`${base}/updatedAt`]: nowIso(),
  }
  if (['PENDING', 'APPROVED', 'COMPLETED'].includes(status)) {
    if (lock && lock.appointmentId !== current.id) {
      throw new AppError('That time slot is now held by a different booking.')
    }
    updates[lockPath(current)] = {
      appointmentId: current.id,
      studentId: current.studentId,
      teacherId: current.teacherId,
      status,
      createdAt: lock?.createdAt || nowIso(),
    }
  } else if (lock && lock.appointmentId === current.id) {
    updates[lockPath(current)] = null
  }
  const actor = actorOf(admin)
  ;[current.studentId, current.teacherId].forEach((userId) =>
    addNotification(updates, {
      userId,
      type: 'ADMIN_UPDATE',
      title: 'Booking updated by admin',
      message: `${current.bookingId} is now ${status.toLowerCase()}.`,
      appointmentId: current.id,
      createdBy: actor.uid,
    }),
  )
  addLog(updates, actor, 'ADMIN_ACTION', `Admin set ${current.bookingId} to ${status}`)
  await update(ref(db), updates)
}
