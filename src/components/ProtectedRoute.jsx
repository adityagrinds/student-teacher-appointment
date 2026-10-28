import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingScreen from './LoadingScreen'
import AccountProblem from './AccountProblem'

/** Blocks everything until auth + profile have loaded, then requires a signed-in, active user with a profile. */
export default function ProtectedRoute() {
  const { currentUser, userProfile, loading, profileError } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen label="Checking your session..." />
  if (!currentUser) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (profileError) return <AccountProblem kind="error" />
  if (!userProfile) return <AccountProblem kind="missing" />
  if (userProfile.isActive === false) return <AccountProblem kind="inactive" />
  return <Outlet />
}
