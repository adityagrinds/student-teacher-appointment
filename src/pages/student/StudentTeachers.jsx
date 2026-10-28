import { useMemo, useState } from 'react'
import { ref, query, orderByChild, equalTo } from 'firebase/database'
import { db } from '../../firebase'
import { useAuth } from '../../hooks/useAuth'
import { useRealtime, useSlotLocks } from '../../hooks/useRealtime'
import { useMyAppointments } from '../../hooks/useAppointments'
import { formatDate, todayString } from '../../utils/dateTime'
import SearchInput from '../../components/SearchInput'
import TeacherCard from '../../components/TeacherCard'
import AvailabilityCard from '../../components/AvailabilityCard'
import BookingModal from '../../components/BookingModal'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'

function TeacherAvailability({ teacher, student, onPick }) {
  const { data: slots, loading, error } = useRealtime(
    () => query(ref(db, 'availabilitySlots'), orderByChild('teacherId'), equalTo(teacher.id)),
    `slots:${teacher.id}`,
  )
  const { data: mine } = useMyAppointments()

  const open = useMemo(
    () =>
      slots
        .filter((s) => s.status === 'ACTIVE' && s.date >= todayString())
        .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
    [slots],
  )
  const locks = useSlotLocks(open.map((s) => s.id))

  const byDate = open.reduce((acc, s) => {
    ;(acc[s.date] ||= []).push(s)
    return acc
  }, {})

  const rejectedKeys = (slotId) =>
    new Set(mine.filter((a) => a.slotId === slotId && a.status === 'REJECTED').map((a) => a.timeKey))

  return (
    <section aria-label={`Availability of ${teacher.name}`} className="stack">
      <h2>{teacher.name}&apos;s office hours</h2>
      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="skeleton skeleton-card" />
      ) : open.length === 0 ? (
        <EmptyState title="No upcoming office hours" message="This teacher has not published any open office hours yet." />
      ) : (
        Object.entries(byDate).map(([date, list]) => (
          <div key={date} className="date-group">
            <h3>{formatDate(date)}</h3>
            {list.map((slot) => (
              <AvailabilityCard
                key={slot.id}
                slot={slot}
                locks={locks[slot.id]}
                myRejectedKeys={rejectedKeys(slot.id)}
                studentId={student.uid}
                onPick={onPick}
              />
            ))}
          </div>
        ))
      )}
    </section>
  )
}

export default function StudentTeachers() {
  const { userProfile } = useAuth()
  const { data, loading, error } = useRealtime(() => ref(db, 'teachers'), 'teachers')
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [selected, setSelected] = useState(null)
  const [pick, setPick] = useState(null)

  const teachers = useMemo(() => data.filter((t) => t.isActive !== false), [data])
  const departments = useMemo(() => [...new Set(teachers.map((t) => t.department))].sort(), [teachers])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return teachers
      .filter((t) => !department || t.department === department)
      .filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q) ||
          (t.subjects || []).some((s) => s.toLowerCase().includes(q)),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [teachers, search, department])

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Find a teacher</h1>
      </div>
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, department or subject" label="Search teachers" />
        <label className="select-inline">
          <span className="sr-only">Filter by department</span>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="split">
        <div className="stack">
          {error ? (
            <ErrorState message={error} />
          ) : loading ? (
            <>
              <div className="skeleton skeleton-card" />
              <div className="skeleton skeleton-card" />
            </>
          ) : filtered.length === 0 ? (
            <EmptyState title="No teachers found" message="Try a different search or department." />
          ) : (
            filtered.map((t) => (
              <TeacherCard key={t.id} teacher={t} selected={selected?.id === t.id} onSelect={setSelected} />
            ))
          )}
        </div>
        <div className="split-side">
          {selected ? (
            <TeacherAvailability teacher={selected} student={userProfile} onPick={(slot, timeSlot) => setPick({ slot, timeSlot })} />
          ) : (
            <EmptyState title="Select a teacher" message="Choose a teacher to see their available time slots." />
          )}
        </div>
      </div>

      <BookingModal pick={pick} student={userProfile} onClose={() => setPick(null)} />
    </div>
  )
}
