import { formatDateTime } from '../utils/dateTime'
import EmptyState from './EmptyState'

export default function ActivityList({ items }) {
  if (items.length === 0) return <EmptyState title="No activity yet" />
  return (
    <ul className="activity-list">
      {items.map((l) => (
        <li key={l.id}>
          <span className={`dot dot-${l.type.toLowerCase()}`} aria-hidden="true" />
          <div>
            <p>{l.message}</p>
            <small className="muted">
              {formatDateTime(l.createdAt)} · {l.actorRole}
            </small>
          </div>
        </li>
      ))}
    </ul>
  )
}
