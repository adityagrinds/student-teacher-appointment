import { Clock, MapPin, Info } from 'lucide-react'
import { formatRange, generateTimeSlots } from '../utils/dateTime'
import { SLOT_STATE_LABEL as STATE_LABEL, slotState } from '../utils/slotState'

/** One office hour, expanded into individual bookable time slots. */
export default function AvailabilityCard({ slot, locks = {}, myRejectedKeys, studentId, onPick }) {
  const timeSlots = generateTimeSlots(slot.startTime, slot.endTime, slot.slotDuration)
  return (
    <section className="card avail-card" aria-label={`Office hour ${formatRange(slot.startTime, slot.endTime)}`}>
      <header>
        <h4>
          <Clock size={16} aria-hidden="true" /> {formatRange(slot.startTime, slot.endTime)}
        </h4>
        <span className="muted">
          <MapPin size={14} aria-hidden="true" /> {slot.cabinNo} · {slot.slotDuration} min slots
        </span>
      </header>
      {slot.instructions && (
        <p className="note">
          <Info size={14} aria-hidden="true" /> {slot.instructions}
        </p>
      )}
      <div className="slot-grid">
        {timeSlots.map((ts) => {
          const state = slotState(slot, ts, locks[ts.key], myRejectedKeys, studentId)
          const available = state === 'AVAILABLE'
          return (
            <button
              key={ts.key}
              type="button"
              className={`slot-btn slot-${state.toLowerCase()}`}
              disabled={!available}
              onClick={() => onPick(slot, ts)}
              aria-label={`${ts.label}, ${STATE_LABEL[state]}`}
            >
              <span>{ts.label}</span>
              <small>{STATE_LABEL[state]}</small>
            </button>
          )
        })}
      </div>
    </section>
  )
}
