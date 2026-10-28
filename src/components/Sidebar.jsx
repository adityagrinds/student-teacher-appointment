import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  CalendarCheck,
  User,
  Clock,
  Users,
  GraduationCap,
  BookOpen,
  Activity,
  X,
} from 'lucide-react'
import { NAV_ITEMS } from '../utils/constants'
import Brand from './Brand'

const ICONS = { LayoutDashboard, Search, CalendarCheck, User, Clock, Users, GraduationCap, BookOpen, Activity }

export default function Sidebar({ role, open, onClose }) {
  return (
    <>
      {open && <div className="sidebar-scrim" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="brand">
          <Brand />
          <button type="button" className="icon-btn sidebar-close" aria-label="Close menu" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <p className="nav-caption">{role} portal</p>
        <nav aria-label="Main navigation">
          {NAV_ITEMS[role].map(({ to, label, icon }) => {
            const Icon = ICONS[icon]
            return (
              <NavLink key={to} to={to} className="nav-link" onClick={onClose}>
                <Icon size={17} aria-hidden="true" />
                {label}
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
