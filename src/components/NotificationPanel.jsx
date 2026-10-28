import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { ref, query, orderByChild, equalTo } from 'firebase/database'
import { db } from '../firebase'
import { useAuth, useToast } from '../hooks/useAuth'
import { useRealtime } from '../hooks/useRealtime'
import { markAllNotificationsRead, markNotificationRead } from '../services/notificationService'
import { friendlyError } from '../utils/errors'
import { timeAgo } from '../utils/dateTime'

export default function NotificationPanel() {
  const { userProfile } = useAuth()
  const toast = useToast()
  const uid = userProfile.uid
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  const { data } = useRealtime(
    () => query(ref(db, 'notifications'), orderByChild('userId'), equalTo(uid)),
    `notifications:${uid}`,
  )
  const items = [...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30)
  const unread = items.filter((n) => !n.read).length

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => !wrapRef.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const run = async (fn) => {
    try {
      await fn()
    } catch (err) {
      toast.error(friendlyError(err, 'Could not update notifications.'))
    }
  }

  return (
    <div className="dropdown" ref={wrapRef}>
      <button
        type="button"
        className="icon-btn bell"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={20} />
        {unread > 0 && <span className="bell-count">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="dropdown-panel notif-panel" role="dialog" aria-label="Notifications">
          <div className="notif-head">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button type="button" className="link-btn" onClick={() => run(() => markAllNotificationsRead(items))}>
                <CheckCheck size={14} aria-hidden="true" /> Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="muted pad">No notifications yet.</p>
          ) : (
            <ul className="notif-list">
              {items.map((n) => (
                <li key={n.id} className={n.read ? '' : 'unread'}>
                  <div>
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <small className="muted">{timeAgo(n.createdAt)}</small>
                  </div>
                  {!n.read && (
                    <button type="button" className="link-btn" onClick={() => run(() => markNotificationRead(n.id))}>
                      Mark read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
