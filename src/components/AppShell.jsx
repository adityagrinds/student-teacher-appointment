import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppShell() {
  const { userRole } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className={`shell role-${userRole}`}>
      <Sidebar role={userRole} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="shell-main">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="content" id="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
