import { ref, query, orderByChild, limitToLast } from 'firebase/database'
import { db } from '../firebase'
import { useRealtime } from './useRealtime'

export const ACTIVITY_GROUPS = [
  { key: '', label: 'All', types: null },
  { key: 'reg', label: 'Registrations', types: ['REGISTRATION', 'ACCOUNT_DELETED'] },
  { key: 'book', label: 'Booking requests', types: ['BOOKING_REQUEST'] },
  { key: 'decision', label: 'Approvals / rejections', types: ['APPROVAL', 'REJECTION', 'COMPLETION'] },
  { key: 'cancel', label: 'Cancellations', types: ['CANCELLATION'] },
  { key: 'admin', label: 'Admin actions', types: ['ADMIN_ACTION', 'OFFICE_HOUR'] },
]

export function useActivity() {
  return useRealtime(() => query(ref(db, 'activityLogs'), orderByChild('createdAt'), limitToLast(200)), 'activity:200')
}
