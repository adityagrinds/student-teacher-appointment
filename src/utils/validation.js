import { LIMITS } from './constants'
import { todayString, timeToMinutes, rangesOverlap, isPastSlot } from './dateTime'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const isValidEmail = (v) => EMAIL_RE.test((v || '').trim())

export function passwordError(pw) {
  if (!pw || pw.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password must contain letters and numbers.'
  return ''
}

export const parseSubjects = (v) =>
  Array.isArray(v)
    ? v
    : (v || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

const required = (errors, obj, fields) => {
  fields.forEach(([key, label]) => {
    if (!String(obj[key] ?? '').trim()) errors[key] = `${label} is required.`
  })
}

function credentialErrors(errors, v) {
  if (!isValidEmail(v.email)) errors.email = 'Enter a valid email address.'
  const pe = passwordError(v.password)
  if (pe) errors.password = pe
}

export function validateStudentProfile(v, { withCredentials = false } = {}) {
  const errors = {}
  required(errors, v, [
    ['name', 'Name'],
    ['rollNo', 'Roll number'],
    ['branch', 'Branch'],
    ['year', 'Year'],
    ['section', 'Section'],
  ])
  if (withCredentials) credentialErrors(errors, v)
  return errors
}

export function validateTeacherProfile(v, { withCredentials = false } = {}) {
  const errors = {}
  required(errors, v, [
    ['name', 'Name'],
    ['department', 'Department'],
    ['designation', 'Designation'],
    ['cabinNo', 'Cabin number'],
  ])
  if (parseSubjects(v.subjects).length === 0) errors.subjects = 'Add at least one subject.'
  if (withCredentials) credentialErrors(errors, v)
  return errors
}

export function validateBooking({ purposeCategory, reasonDetails, date, startTime }) {
  const errors = {}
  if (!purposeCategory) errors.purposeCategory = 'Select a purpose.'
  const reason = (reasonDetails || '').trim()
  if (!reason) errors.reasonDetails = 'Please describe the reason.'
  else if (reason.length < LIMITS.reasonMin) errors.reasonDetails = `Reason must be at least ${LIMITS.reasonMin} characters.`
  else if (reason.length > LIMITS.reasonMax) errors.reasonDetails = `Reason must be at most ${LIMITS.reasonMax} characters.`
  if (!date || !startTime) errors.slot = 'Select a date and time.'
  else if (isPastSlot(date, startTime)) errors.slot = 'This time slot is in the past.'
  return errors
}

export function validateOfficeHour(v, existing = [], ignoreId = null) {
  const errors = {}
  required(errors, v, [
    ['date', 'Date'],
    ['startTime', 'Start time'],
    ['endTime', 'End time'],
    ['cabinNo', 'Location'],
  ])
  if (!v.slotDuration || Number(v.slotDuration) <= 0) errors.slotDuration = 'Choose a valid slot duration.'
  if (v.date && v.date < todayString()) errors.date = 'Date cannot be in the past.'
  if (v.startTime && v.endTime) {
    if (timeToMinutes(v.endTime) <= timeToMinutes(v.startTime)) errors.endTime = 'End time must be after start time.'
    else if (Number(v.slotDuration) > timeToMinutes(v.endTime) - timeToMinutes(v.startTime)) {
      errors.slotDuration = 'Slot duration is longer than the office hour.'
    }
  }
  if (!errors.date && v.date === todayString() && v.endTime && !errors.endTime && isPastSlot(v.date, v.endTime)) {
    errors.endTime = 'This time has already passed today.'
  }
  if ((v.instructions || '').length > LIMITS.instructionsMax) errors.instructions = 'Instructions are too long.'
  if (!errors.date && !errors.startTime && !errors.endTime) {
    const clash = existing.find(
      (s) =>
        s.id !== ignoreId &&
        s.status !== 'CANCELLED' &&
        s.date === v.date &&
        rangesOverlap(v.startTime, v.endTime, s.startTime, s.endTime),
    )
    if (clash) errors.startTime = 'This overlaps with another office hour on the same day.'
  }
  return errors
}
