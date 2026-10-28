import { isPastSlot } from './dateTime'

export const SLOT_STATE_LABEL = {
  AVAILABLE: 'Available',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  BOOKED: 'Booked',
  REJECTED: 'Rejected',
  PAST: 'Past',
}

/** State of one time slot from the viewing student's perspective. */
export function slotState(slot, timeSlot, lock, myRejectedKeys, studentId) {
  if (isPastSlot(slot.date, timeSlot.startTime)) return 'PAST'
  if (lock) {
    if (lock.studentId !== studentId) return 'BOOKED'
    return lock.status === 'PENDING' ? 'PENDING' : 'APPROVED'
  }
  if (myRejectedKeys.has(timeSlot.key)) return 'REJECTED'
  return 'AVAILABLE'
}
