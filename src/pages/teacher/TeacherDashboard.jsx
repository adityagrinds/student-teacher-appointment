import { Link } from 'react-router-dom'
import { ref, query, orderByChild, equalTo } from 'firebase/database'
import { CalendarDays, Hourglass, CalendarClock, CalendarCheck, Clock, Plus } from 'lucide-react'
import { db } from '../../firebase'
import { useAuth } from '../../hooks/useAuth'
import { useRealtime } from '../../hooks/useRealtime'
import { useMyAppointments } from '../../hooks/useAppointments'
import { isPastSlot, todayString } from '../../utils/dateTime'
import StatCard from '../../components/StatCard'
import AppointmentCard from '../../components/AppointmentCard'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'

export default function TeacherDashboard() {
  const { userProfile } = useAuth()
  const { data: appts, loading, error } = useMyAppointments()
  const { data: slots, loading: slotsLoading } = useRealtime(
    () => query(ref(db, 'availabilitySlots'), orderByChild('teacherId'), equalTo(userProfile.uid)),
    `slots:${userProfile.uid}`,
  )

  const today = todayString()
  const todays = appts.filter((a) => a.status === 'APPROVED' && a.date === today)
  const pending = appts.filter((a) => a.status === 'PENDING')
  const upcoming = appts.filter((a) => a.status === 'APPROVED' && !isPastSlot(a.date, a.startTime))
  const completed = appts.filter((a) => a.status === 'COMPLETED')

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Welcome, {userProfile.name}</h1>
          <p className="muted">
            {userProfile.designation} · {userProfile.department}
          </p>
        </div>
        <Link to="/teacher/office-hours" className="btn btn-primary">
          <Plus size={16} aria-hidden="true" /> Publish office hours
        </Link>
      </div>

      <section className="stat-grid" aria-label="Statistics">
        <StatCard label="Today's appointments" value={todays.length} icon={CalendarDays} tone="primary" loading={loading} />
        <StatCard label="Pending requests" value={pending.length} icon={Hourglass} tone="amber" loading={loading} />
        <StatCard label="Upcoming appointments" value={upcoming.length} icon={CalendarClock} tone="green" loading={loading} />
        <StatCard label="Completed" value={completed.length} icon={CalendarCheck} tone="blue" loading={loading} />
        <StatCard label="Office-hour schedules" value={slots.length} icon={Clock} tone="purple" loading={slotsLoading} />
      </section>

      <section>
        <div className="section-head">
          <h2>Pending requests</h2>
          <Link to="/teacher/appointments">Manage all</Link>
        </div>
        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <div className="skeleton skeleton-card" />
        ) : pending.length === 0 ? (
          <EmptyState title="No pending requests" message="New booking requests will show up here." />
        ) : (
          <div className="card-grid">
            {pending.slice(0, 4).map((a) => (
              <AppointmentCard key={a.id} appointment={a} viewer="teacher" />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Today</h2>
        {todays.length === 0 ? (
          <EmptyState title="Nothing scheduled today" />
        ) : (
          <div className="card-grid">
            {todays.map((a) => (
              <AppointmentCard key={a.id} appointment={a} viewer="teacher" />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
