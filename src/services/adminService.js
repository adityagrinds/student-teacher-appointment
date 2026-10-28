import { ref, update } from 'firebase/database'
import { db } from '../firebase'
import { addLog, actorOf } from './dbHelpers'
import { addCancellation, getStudentAppointments, getTeacherAppointments, isActiveStatus } from './appointmentService'
import { getTeacherSlots } from './slotService'

/**
 * Removes a user's profile and safely winds down their data in a single atomic update:
 *  - pending/approved appointments are cancelled (the other party is notified, slot locks released)
 *  - a teacher's office hours and public directory entry are removed
 *  - appointment records are kept as history, never silently deleted
 * Used for both admin deletion and self-service account deletion.
 * The Firebase Auth account itself can only be deleted by its owner from the client.
 */
export async function purgeUser({ uid, role, name, actorProfile }) {
  const actor = actorOf(actorProfile)
  const updates = {}
  const appointments = role === 'teacher' ? await getTeacherAppointments(uid) : await getStudentAppointments(uid)
  const reason = `The ${role} account was removed.`
  appointments.filter((a) => isActiveStatus(a.status)).forEach((a) => addCancellation(updates, a, actor, reason))
  if (role === 'teacher') {
    const slots = await getTeacherSlots(uid)
    slots.forEach((s) => {
      updates[`availabilitySlots/${s.id}`] = null
    })
    updates[`teachers/${uid}`] = null
  }
  updates[`users/${uid}`] = null
  addLog(
    updates,
    actor,
    actor.uid === uid ? 'ACCOUNT_DELETED' : 'ADMIN_ACTION',
    actor.uid === uid ? `${name} deleted their ${role} account` : `Admin deleted ${role} ${name}`,
  )
  await update(ref(db), updates)
}
