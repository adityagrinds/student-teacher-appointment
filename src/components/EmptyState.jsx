import { Inbox } from 'lucide-react'

export default function EmptyState({ title, message, icon: Icon = Inbox, action }) {
  return (
    <div className="empty-state">
      <Icon size={36} aria-hidden="true" />
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  )
}
