import { ref, query, orderByChild, equalTo } from 'firebase/database'
import { db } from '../firebase'
import { useAuth } from './useAuth'
import { useRealtime } from './useRealtime'

/** Live appointments for the signed-in student or teacher (the only queries the rules allow). */
export function useMyAppointments() {
  const { userProfile } = useAuth()
  const field = userProfile.role === 'teacher' ? 'teacherId' : 'studentId'
  const result = useRealtime(
    () => query(ref(db, 'appointments'), orderByChild(field), equalTo(userProfile.uid)),
    `appointments:${field}:${userProfile.uid}`,
  )
  const sorted = [...result.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { ...result, data: sorted }
}
