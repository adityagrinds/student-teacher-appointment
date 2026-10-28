import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { useAuth, useToast } from '../hooks/useAuth'
import { friendlyError } from '../utils/errors'

export default function ProfileMenu() {
  const { userProfile, logout } = useAuth()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

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

  const onLogout = async () => {
    try {
      await logout()
    } catch (err) {
      toast.error(friendlyError(err, 'Could not log out.'))
    }
  }

  return (
    <div className="dropdown" ref={wrapRef}>
      <button type="button" className="profile-btn" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>
        <span className="avatar avatar-sm" aria-hidden="true">
          {userProfile.name.charAt(0).toUpperCase()}
        </span>
        <span className="profile-name">{userProfile.name}</span>
      </button>
      {open && (
        <div className="dropdown-panel" role="menu">
          <div className="pad menu-id">
            <strong>{userProfile.name}</strong>
            <small className="muted">{userProfile.email}</small>
            <small className="role-tag">{userProfile.role}</small>
          </div>
          {userProfile.role !== 'admin' && (
            <Link role="menuitem" to={`/${userProfile.role}/profile`} className="menu-item" onClick={() => setOpen(false)}>
              <User size={16} aria-hidden="true" /> My profile
            </Link>
          )}
          <button type="button" role="menuitem" className="menu-item" onClick={onLogout}>
            <LogOut size={16} aria-hidden="true" /> Log out
          </button>
        </div>
      )}
    </div>
  )
}
