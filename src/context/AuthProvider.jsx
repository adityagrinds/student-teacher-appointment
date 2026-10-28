import { useCallback, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { onValue, ref, get } from 'firebase/database'
import { auth, db } from '../firebase'
import { AuthContext } from './auth-context'
import {
  loginWithEmail,
  logoutUser,
  sendResetEmail,
  signUpWithProfile,
  deleteOwnAccount,
} from '../services/authService'

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  // profile state is keyed by uid so a stale profile is never shown for another user
  const [profileState, setProfileState] = useState({ uid: null, profile: null, error: null })
  const [signingUp, setSigningUp] = useState(false)

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        setCurrentUser(user)
        setAuthReady(true)
      }),
    [],
  )

  const uid = currentUser?.uid ?? null

  useEffect(() => {
    if (!uid) return undefined
    return onValue(
      ref(db, `users/${uid}`),
      (snap) => setProfileState({ uid, profile: snap.exists() ? snap.val() : null, error: null }),
      (error) => setProfileState({ uid, profile: null, error }),
    )
  }, [uid])

  const profileLoaded = uid ? profileState.uid === uid : true
  const userProfile = uid && profileState.uid === uid ? profileState.profile : null
  const loading = !authReady || !profileLoaded || signingUp

  const login = useCallback((email, password) => loginWithEmail(email, password), [])
  const logout = useCallback(() => logoutUser(), [])
  const resetPassword = useCallback((email) => sendResetEmail(email), [])

  const signup = useCallback(async (role, values) => {
    setSigningUp(true)
    try {
      return await signUpWithProfile(role, values)
    } finally {
      setSigningUp(false)
    }
  }, [])

  const deleteAccount = useCallback(
    (password) => deleteOwnAccount(userProfile, password),
    [userProfile],
  )

  const refreshUserProfile = useCallback(async () => {
    if (!uid) return null
    const snap = await get(ref(db, `users/${uid}`))
    return snap.exists() ? snap.val() : null
  }, [uid])

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      userRole: userProfile?.role ?? null,
      profileError: uid && profileState.uid === uid ? profileState.error : null,
      loading,
      initializing: !authReady,
      signingUp,
      login,
      signup,
      logout,
      resetPassword,
      deleteAccount,
      refreshUserProfile,
    }),
    [currentUser, userProfile, uid, profileState, loading, authReady, signingUp, login, signup, logout, resetPassword, deleteAccount, refreshUserProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
