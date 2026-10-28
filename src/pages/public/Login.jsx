import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { friendlyError } from '../../utils/errors'
import { isValidEmail } from '../../utils/validation'
import FormField from '../../components/FormField'
import AuthLayout from './AuthLayout'

export default function Login() {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const found = {}
    if (!isValidEmail(form.email)) found.email = 'Enter a valid email address.'
    if (!form.password) found.password = 'Enter your password.'
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length) return
    setSubmitting(true)
    try {
      await login(form.email, form.password)
    } catch (err) {
      setFormError(friendlyError(err, 'Could not log in.'))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in as a student, teacher or administrator."
      footer={
        <>
          New here? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="form-stack">
        {formError && (
          <p className="alert alert-error" role="alert">
            {formError}
          </p>
        )}
        <FormField label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <FormField label="Password" type="password" autoComplete="current-password" value={form.password} onChange={set('password')} error={errors.password} />
        <Link to="/forgot-password" className="link-right">
          Forgot password?
        </Link>
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  )
}
