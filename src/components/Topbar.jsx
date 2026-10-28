import { Menu } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import NotificationPanel from './NotificationPanel'
import ProfileMenu from './ProfileMenu'

export default function Topbar({ onMenu }) {
  const { userProfile: p } = useAuth()
  const subtitle =
    p.role === 'student'
      ? `Roll no. ${p.rollNo}`
      : p.role === 'teacher'
        ? `${p.department} · Cabin ${p.cabinNo}`
        : 'Administrator'
  return (
    <header className="topbar">
      <button type="button" className="icon-btn menu-btn" aria-label="Open menu" onClick={onMenu}>
        <Menu size={22} />
      </button>
      <div className="topbar-id">
        <strong>{p.name}</strong>
        <span className="muted">{subtitle}</span>
      </div>
      <div className="topbar-actions">
        <NotificationPanel />
        <ProfileMenu />
      </div>
    </header>
  )
}
