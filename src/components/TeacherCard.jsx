import { MapPin, Briefcase, CalendarDays } from 'lucide-react'

export default function TeacherCard({ teacher, selected, onSelect }) {
  return (
    <article className={`card teacher-card ${selected ? 'is-selected' : ''}`}>
      <div className="avatar" aria-hidden="true">
        {teacher.name.charAt(0).toUpperCase()}
      </div>
      <div className="teacher-main">
        <h3>{teacher.name}</h3>
        <p className="muted">
          <Briefcase size={14} aria-hidden="true" /> {teacher.designation} · {teacher.department}
        </p>
        <p className="muted">
          <MapPin size={14} aria-hidden="true" /> Cabin {teacher.cabinNo}
        </p>
        <div className="chips">
          {(teacher.subjects || []).map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
        {teacher.bio && <p className="teacher-bio">{teacher.bio}</p>}
      </div>
      <button type="button" className="btn btn-primary" onClick={() => onSelect(teacher)} aria-pressed={selected}>
        <CalendarDays size={16} aria-hidden="true" /> View availability
      </button>
    </article>
  )
}
