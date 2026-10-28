import { useState } from 'react'
import { AlertTriangle, ShieldOff, UserX } from 'lucide-react'
import { useAuth, useToast } from '../hooks/useAuth'
import { deleteAuthOnlyAccount } from '../services/authService'
import { friendlyError } from '../utils/errors'
import ConfirmModal from './ConfirmModal'
import FormField from './FormField'

const COPY = {
  missing: {
    icon: UserX,
    title: 'Profile not found',
    text: 'Your login works, but there is no profile for it in the database. It may have been removed by an administrator, or signup did not finish.',
  },
  inactive: {
    icon: ShieldOff,
    title: 'Account deactivated',
    text: 'An administrator has deactivated this account. Contact your institution if you think this is a mistake.',
  },
  error: {
    icon: AlertTriangle,
    title: 'Could not load your profile',
    text: 'We could not read your profile. Check your connection or permissions and try again.',
  },
}

export default function AccountProblem({ kind }) {
  const { logout } = useAuth()
  const toast = useToast()
  const { icon: Icon, title, text } = COPY[kind]
  const [confirming, setConfirming] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const removeLogin = async () => {
    setBusy(true)
    try {
      await deleteAuthOnlyAccount(password)
      toast.success('Login removed. You can sign up again.')
    } catch (err) {
      toast.error(friendlyError(err))
      setBusy(false)
    }
  }

  return (
    <main className="center-screen">
      <div className="card center-card">
        <Icon size={40} aria-hidden="true" />
        <h1>{title}</h1>
        <p className="muted">{text}</p>
        <div className="row-gap">
          <button type="button" className="btn btn-primary" onClick={logout}>
            Log out
          </button>
          {kind === 'missing' && (
            <button type="button" className="btn btn-secondary" onClick={() => setConfirming(true)}>
              Remove this login
            </button>
          )}
          {kind === 'error' && (
            <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>
              Reload
            </button>
          )}
        </div>
      </div>
      <ConfirmModal
        open={confirming}
        title="Remove this login?"
        message="This deletes your login so you can register again with the same email."
        confirmLabel="Remove login"
        danger
        loading={busy}
        confirmDisabled={!password}
        onConfirm={removeLogin}
        onCancel={() => setConfirming(false)}
      >
        <FormField
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </ConfirmModal>
    </main>
  )
}
