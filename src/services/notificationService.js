import { ref, update } from 'firebase/database'
import { db } from '../firebase'

export async function markNotificationRead(id) {
  await update(ref(db), { [`notifications/${id}/read`]: true })
}

export async function markAllNotificationsRead(notifications) {
  const updates = {}
  notifications.filter((n) => !n.read).forEach((n) => {
    updates[`notifications/${n.id}/read`] = true
  })
  if (Object.keys(updates).length) await update(ref(db), updates)
}
