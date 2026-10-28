import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

// Web config values are public identifiers, not secrets. Access is enforced by
// Firebase Authentication and the Realtime Database rules (database.rules.json).
const firebaseConfig = {
  apiKey: 'AIzaSyDjiLJu1505_Zh260yr4v6yXmxV1d0R0X4',
  authDomain: 'student-teacher-booking-4f904.firebaseapp.com',
  databaseURL: 'https://student-teacher-booking-4f904-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'student-teacher-booking-4f904',
  storageBucket: 'student-teacher-booking-4f904.firebasestorage.app',
  messagingSenderId: '269910619139',
  appId: '1:269910619139:web:d4eab3f1ca1772d229ca36',
  measurementId: 'G-8MXLEV3XMC',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getDatabase(app)
export default app
