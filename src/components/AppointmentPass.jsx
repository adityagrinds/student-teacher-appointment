import { Printer } from 'lucide-react'
import Modal from './Modal'
import { formatDate } from '../utils/dateTime'

export default function AppointmentPass({ appointment: a, onClose }) {
  return (
    <Modal
      open={!!a}
      title="Appointment pass"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} aria-hidden="true" /> Print
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      {a && (
        <div className="pass">
          <p className="pass-ref">{a.bookingId}</p>
          <dl>
            <dt>Student</dt>
            <dd>
              {a.studentName} {a.studentRollNo && `(${a.studentRollNo})`}
            </dd>
            <dt>Teacher</dt>
            <dd>{a.teacherName}</dd>
            <dt>Date</dt>
            <dd>{formatDate(a.date)}</dd>
            <dt>Time</dt>
            <dd>{a.timeSlot}</dd>
            <dt>Location</dt>
            <dd>{a.cabinNo || '-'}</dd>
            <dt>Purpose</dt>
            <dd>{a.purposeCategory}</dd>
          </dl>
          <p className="pass-status">APPROVED</p>
        </div>
      )}
    </Modal>
  )
}
