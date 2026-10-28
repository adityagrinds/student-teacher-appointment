import { CalendarDays, Clock, MapPin } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { formatDate } from '../utils/dateTime'

/** Shared appointment summary. `viewer` decides which counterpart is the headline. */
export default function AppointmentCard({ appointment: a, viewer, actions }) {
  return (
    <article className="card appt-card">
      <header className="appt-head">
        <div>
          <p className="appt-ref">{a.bookingId}</p>
          <h3>{viewer === 'student' ? a.teacherName : a.studentName}</h3>
          {viewer !== 'student' && a.studentRollNo && <p className="muted">Roll no. {a.studentRollNo}</p>}
          {viewer === 'admin' && <p className="muted">with {a.teacherName}</p>}
        </div>
        <StatusBadge status={a.status} />
      </header>
      <ul className="appt-meta">
        <li>
          <CalendarDays size={14} aria-hidden="true" /> {formatDate(a.date)}
        </li>
        <li>
          <Clock size={14} aria-hidden="true" /> {a.timeSlot}
        </li>
        {a.cabinNo && (
          <li>
            <MapPin size={14} aria-hidden="true" /> {a.cabinNo}
          </li>
        )}
      </ul>
      <p>
        <strong>{a.purposeCategory}</strong>
      </p>
      <p className="appt-reason">{a.reasonDetails}</p>
      {a.teacherNote && (
        <p className="note">
          <strong>Teacher note:</strong> {a.teacherNote}
        </p>
      )}
      {a.rejectionReason && (
        <p className="note note-danger">
          <strong>Rejection reason:</strong> {a.rejectionReason}
        </p>
      )}
      {a.cancellationReason && a.status === 'CANCELLED' && (
        <p className="note">
          <strong>Cancelled:</strong> {a.cancellationReason}
        </p>
      )}
      {a.adminNote && (
        <p className="note">
          <strong>Admin note:</strong> {a.adminNote}
        </p>
      )}
      {actions && <footer className="appt-actions">{actions}</footer>}
    </article>
  )
}
