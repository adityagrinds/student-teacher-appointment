import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { friendlyError } from '../../utils/errors'
import { isValidEmail } from '../../utils/validation'
import FormField from '../../components/FormField'
import AuthLayout from './AuthLayout'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(friendlyError(err, 'Could not send the reset email.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We will email you a link to choose a new password."
      footer={<Link to="/login">Back to log in</Link>}
    >
      {sent ? (
        <p className="alert alert-success" role="status">
          If an account exists for {email}, a reset link is on its way. Check your inbox and spam folder.
        </p>
      ) : (
        <form onSubmit={submit} noValidate className="form-stack">
          <FormField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
