import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
} from 'firebase/auth'
import { auth } from '../firebase'
import { createProfile } from './userService'
import { purgeUser } from './adminService'
import { AppError } from '../utils/errors'
import { passwordError } from '../utils/validation'

export const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth, email.trim(), password)

export const logoutUser = () => signOut(auth)

export const sendResetEmail = (email) => sendPasswordResetEmail(auth, email.trim())

/** Public signup is limited to students and teachers; admins are provisioned manually (see README). */
export async function signUpWithProfile(role, values) {
  if (role !== 'student' && role !== 'teacher') throw new AppError('Invalid account type.')
  const email = values.email.trim()
  const cred = await createUserWithEmailAndPassword(auth, email, values.password)
  try {
    return await createProfile(cred.user.uid, role, email, values)
  } catch (err) {
    // Do not leave a half-created account (auth user without a profile).
    await deleteUser(cred.user).catch((e) => console.warn('Cleanup after failed signup failed', e))
    throw err
  }
}

async function reauthenticate(user, currentPassword) {
  if (!currentPassword) throw new AppError('Enter your current password to continue.')
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword))
}

export async function changePassword(currentPassword, newPassword) {
  const user = auth.currentUser
  if (!user) throw new AppError('Your session has expired. Please log in again.')
  const err = passwordError(newPassword)
  if (err) throw new AppError(err)
  await reauthenticate(user, currentPassword)
  await updatePassword(user, newPassword)
}

export async function deleteOwnAccount(profile, currentPassword) {
  const user = auth.currentUser
  if (!user) throw new AppError('Your session has expired. Please log in again.')
  await reauthenticate(user, currentPassword)
  await purgeUser({ uid: profile.uid, role: profile.role, name: profile.name, actorProfile: profile })
  await deleteUser(user)
}

/** For accounts that exist in Auth but have no database profile. */
export async function deleteAuthOnlyAccount(currentPassword) {
  const user = auth.currentUser
  if (!user) throw new AppError('Your session has expired. Please log in again.')
  await reauthenticate(user, currentPassword)
  await deleteUser(user)
}
