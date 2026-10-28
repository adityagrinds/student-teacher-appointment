import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { dashboardPath } from '../../utils/constants'

export default function NotFound() {
  const { userProfile } = useAuth()
  return (
    <main className="center-screen">
      <div className="card center-card">
        <h1>Page not found</h1>
        <p className="muted">The page you are looking for does not exist or you do not have access to it.</p>
        <Link to={userProfile ? dashboardPath(userProfile.role) : '/'} className="btn btn-primary">
          Go home
        </Link>
      </div>
    </main>
  )
}
