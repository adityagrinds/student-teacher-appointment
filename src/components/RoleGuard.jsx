import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { dashboardPath } from '../utils/constants'

/** Sends users who open another role's URL back to their own dashboard. UI guard only; rules enforce access. */
export default function RoleGuard({ role }) {
  const { userRole } = useAuth()
  if (userRole !== role) return <Navigate to={dashboardPath(userRole)} replace />
  return <Outlet />
}
