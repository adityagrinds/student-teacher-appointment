import { Link } from 'react-router-dom'
import { ref } from 'firebase/database'
import { BookOpen, GraduationCap, Clock, CalendarCheck, Hourglass, CheckCircle2, XCircle, Ban } from 'lucide-react'
import { db } from '../../firebase'
import { useRealtime } from '../../hooks/useRealtime'
import StatCard from '../../components/StatCard'
import ErrorState from '../../components/ErrorState'
import ActivityList from '../../components/ActivityList'
import { useActivity } from '../../hooks/useActivity'

export default function AdminDashboard() {
  const users = useRealtime(() => ref(db, 'users'), 'users')
  const slots = useRealtime(() => ref(db, 'availabilitySlots'), 'slots:all')
  const appts = useRealtime(() => ref(db, 'appointments'), 'appointments:all')
  const activity = useActivity()

  const loading = users.loading || slots.loading || appts.loading
  const error = users.error || slots.error || appts.error
  const count = (s) => appts.data.filter((a) => a.status === s).length
  const recent = [...activity.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Admin overview</h1>
      </div>
      {error ? (
        <ErrorState message={error} />
      ) : (
        <section className="stat-grid" aria-label="Platform statistics">
          <StatCard label="Students" value={users.data.filter((u) => u.role === 'student').length} icon={BookOpen} tone="green" loading={loading} />
          <StatCard label="Teachers" value={users.data.filter((u) => u.role === 'teacher').length} icon={GraduationCap} tone="blue" loading={loading} />
          <StatCard label="Office hours" value={slots.data.length} icon={Clock} tone="purple" loading={loading} />
          <StatCard label="Total bookings" value={appts.data.length} icon={CalendarCheck} tone="primary" loading={loading} />
          <StatCard label="Pending" value={count('PENDING')} icon={Hourglass} tone="amber" loading={loading} />
          <StatCard label="Approved" value={count('APPROVED')} icon={CheckCircle2} tone="green" loading={loading} />
          <StatCard label="Rejected" value={count('REJECTED')} icon={XCircle} tone="red" loading={loading} />
          <StatCard label="Cancelled" value={count('CANCELLED')} icon={Ban} tone="gray" loading={loading} />
        </section>
      )}
      <section className="card">
        <div className="section-head">
          <h2>Recent activity</h2>
          <Link to="/admin/activity">View all</Link>
        </div>
        <ActivityList items={recent} />
      </section>
    </div>
  )
}
