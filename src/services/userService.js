import { ref, get, update } from 'firebase/database'
import { db } from '../firebase'
import { addLog, nowIso, actorOf } from './dbHelpers'
import { parseSubjects } from '../utils/validation'

const TEACHER_PUBLIC_FIELDS = ['name', 'department', 'designation', 'cabinNo', 'subjects', 'bio']

export async function getUserProfile(uid) {
  const snap = await get(ref(db, `users/${uid}`))
  return snap.exists() ? snap.val() : null
}

/** Private profile lives in users/{uid}; teachers also get a public directory entry in teachers/{uid}. */
function buildProfile(uid, role, email, v) {
  const base = { uid, email, role, name: v.name.trim(), isActive: true }
  if (role === 'student') {
    return {
      ...base,
      rollNo: v.rollNo.trim(),
      branch: v.branch.trim(),
      year: v.year,
      section: v.section.trim(),
    }
  }
  return {
    ...base,
    department: v.department.trim(),
    designation: v.designation.trim(),
    cabinNo: v.cabinNo.trim(),
    subjects: parseSubjects(v.subjects),
    bio: (v.bio || '').trim(),
  }
}

export async function createProfile(uid, role, email, values) {
  const stamp = nowIso()
  const profile = { ...buildProfile(uid, role, email, values), createdAt: stamp, updatedAt: stamp }
  // users/{uid} must exist first: the teachers/{uid} rule checks the role stored there.
  await update(ref(db, `users/${uid}`), profile)
  const updates = {}
  if (role === 'teacher') {
    updates[`teachers/${uid}`] = Object.fromEntries(
      [...TEACHER_PUBLIC_FIELDS, 'isActive', 'createdAt', 'updatedAt'].map((k) => [k, profile[k]]),
    )
  }
  addLog(updates, actorOf(profile), 'REGISTRATION', `${profile.name} registered as ${role}`)
  await update(ref(db), updates)
  return profile
}

export async function updateProfile(profile, values) {
  const fields = buildProfile(profile.uid, profile.role, profile.email, values)
  delete fields.uid
  delete fields.email
  delete fields.role
  delete fields.isActive
  const stamp = nowIso()
  const updates = {}
  Object.entries(fields).forEach(([k, v]) => {
    updates[`users/${profile.uid}/${k}`] = v
    if (profile.role === 'teacher' && TEACHER_PUBLIC_FIELDS.includes(k)) updates[`teachers/${profile.uid}/${k}`] = v
  })
  updates[`users/${profile.uid}/updatedAt`] = stamp
  if (profile.role === 'teacher') updates[`teachers/${profile.uid}/updatedAt`] = stamp
  await update(ref(db), updates)
}

/** Admin only. */
export async function setUserActive(user, isActive, admin) {
  const stamp = nowIso()
  const updates = {
    [`users/${user.id}/isActive`]: isActive,
    [`users/${user.id}/updatedAt`]: stamp,
  }
  if (user.role === 'teacher') {
    updates[`teachers/${user.id}/isActive`] = isActive
    updates[`teachers/${user.id}/updatedAt`] = stamp
  }
  addLog(updates, actorOf(admin), 'ADMIN_ACTION', `${isActive ? 'Activated' : 'Deactivated'} ${user.role} ${user.name}`)
  await update(ref(db), updates)
}
