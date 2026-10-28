import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { dashboardPath } from '../utils/constants'
import LoadingScreen from './LoadingScreen'
import AccountProblem from './AccountProblem'

/**
 * Login/signup pages. Only the very first session check shows a loading screen; after that the form
 * stays mounted (so errors and typed values survive) until the profile is ready and we redirect.
 * A signed-in login with no profile gets the recovery screen instead of waiting forever.
 */
export default function PublicRoute() {
  const { initializing, loading, currentUser, userProfile, profileError } = useAuth()
  if (initializing) return <LoadingScreen />
  if (userProfile) return <Navigate to={dashboardPath(userProfile.role)} replace />
  if (currentUser && !loading) return <AccountProblem kind={profileError ? 'error' : 'missing'} />
  return <Outlet />
}
