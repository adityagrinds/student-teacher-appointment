import { Link } from 'react-router-dom'
import { Hourglass, CheckCircle2, CalendarClock, CalendarCheck, Search } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useMyAppointments } from '../../hooks/useAppointments'
import { isPastSlot } from '../../utils/dateTime'
import StatCard from '../../components/StatCard'
import AppointmentCard from '../../components/AppointmentCard'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'

export default function StudentDashboard() {
  const { userProfile } = useAuth()
  const { data, loading, error } = useMyAppointments()

  const upcoming = data
    .filter((a) => ['PENDING', 'APPROVED'].includes(a.status) && !isPastSlot(a.date, a.startTime))
    .sort((a, b) => a.slotStartAt - b.slotStartAt)
  const count = (s) => data.filter((a) => a.status === s).length
  const upcomingApproved = upcoming.filter((a) => a.status === 'APPROVED').length

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Hello, {userProfile.name.split(' ')[0]}</h1>
          <p className="muted">
            {userProfile.branch} · {userProfile.year} · Section {userProfile.section}
          </p>
        </div>
        <Link to="/student/teachers" className="btn btn-primary">
          <Search size={16} aria-hidden="true" /> Find a teacher
        </Link>
      </div>

      <section className="stat-grid" aria-label="Booking overview">
        <StatCard label="Pending bookings" value={count('PENDING')} icon={Hourglass} tone="amber" loading={loading} />
        <StatCard label="Approved bookings" value={count('APPROVED')} icon={CheckCircle2} tone="green" loading={loading} />
        <StatCard label="Upcoming appointments" value={upcomingApproved} icon={CalendarClock} tone="primary" loading={loading} />
        <StatCard label="Completed" value={count('COMPLETED')} icon={CalendarCheck} tone="blue" loading={loading} />
      </section>

      <section>
        <div className="section-head">
          <h2>Upcoming</h2>
          <Link to="/student/bookings">All bookings</Link>
        </div>
        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <div className="skeleton skeleton-card" />
        ) : upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming appointments"
            message="Find a teacher and book an office-hour slot."
            action={
              <Link to="/student/teachers" className="btn btn-primary">
                Find teachers
              </Link>
            }
          />
        ) : (
          <div className="card-grid">
            {upcoming.slice(0, 4).map((a) => (
              <AppointmentCard key={a.id} appointment={a} viewer="student" />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
