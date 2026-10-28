import { ref, push, get, query, orderByChild, equalTo } from 'firebase/database'
import { db } from '../firebase'

export const nowIso = () => new Date().toISOString()

export const newKey = (path) => push(ref(db, path)).key

export const snapToList = (snap) => {
  const rows = []
  snap.forEach((child) => {
    rows.push({ id: child.key, ...child.val() })
  })
  return rows
}

export async function fetchByChild(path, child, value) {
  const snap = await get(query(ref(db, path), orderByChild(child), equalTo(value)))
  return snapToList(snap)
}

/** Adds a notification write to a multi-path `updates` object. */
export function addNotification(updates, { userId, type, title, message, appointmentId = null, createdBy }) {
  const id = newKey('notifications')
  updates[`notifications/${id}`] = {
    userId,
    type,
    title,
    message,
    appointmentId,
    read: false,
    createdBy,
    createdAt: nowIso(),
  }
}

/** Adds an activity-log write to a multi-path `updates` object. */
export function addLog(updates, actor, type, message) {
  const id = newKey('activityLogs')
  updates[`activityLogs/${id}`] = {
    type,
    message,
    actorId: actor.uid,
    actorName: actor.name,
    actorRole: actor.role,
    createdAt: nowIso(),
  }
}

export const actorOf = (profile) => ({ uid: profile.uid, name: profile.name, role: profile.role })
