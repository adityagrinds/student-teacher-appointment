import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth, useToast } from '../../hooks/useAuth'
import { friendlyError } from '../../utils/errors'
import { YEARS } from '../../utils/constants'
import { validateStudentProfile, validateTeacherProfile } from '../../utils/validation'
import FormField from '../../components/FormField'
import AuthLayout from './AuthLayout'

const EMPTY = {
  name: '',
  email: '',
  password: '',
  rollNo: '',
  branch: '',
  year: '',
  section: '',
  department: '',
  designation: '',
  cabinNo: '',
  subjects: '',
  bio: '',
}

export default function Signup() {
  const { signup } = useAuth()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const role = params.get('role') === 'teacher' ? 'teacher' : 'student'
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const found = (role === 'student' ? validateStudentProfile : validateTeacherProfile)(form, { withCredentials: true })
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length) return
    setSubmitting(true)
    try {
      await signup(role, form)
      toast.success('Account created. Welcome!')
    } catch (err) {
      setFormError(friendlyError(err, 'Could not create your account.'))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      footer={
        <>
          Already registered? <Link to="/login">Log in</Link>
        </>
      }
    >
      <div className="segmented" role="tablist" aria-label="Account type">
        {['student', 'teacher'].map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={role === r}
            className={role === r ? 'is-active' : ''}
            disabled={submitting}
            onClick={() => {
              setParams({ role: r })
              setErrors({})
            }}
          >
            {r === 'student' ? 'Student' : 'Teacher'}
          </button>
        ))}
      </div>
      <form onSubmit={submit} noValidate className="form-stack">
        {formError && (
          <p className="alert alert-error" role="alert">
            {formError}
          </p>
        )}
        <FormField label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
        <FormField label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          hint="At least 8 characters, with letters and numbers."
        />
        {role === 'student' ? (
          <div className="form-grid">
            <FormField label="Roll number" value={form.rollNo} onChange={set('rollNo')} error={errors.rollNo} />
            <FormField label="Branch" value={form.branch} onChange={set('branch')} error={errors.branch} />
            <FormField as="select" label="Year" value={form.year} onChange={set('year')} error={errors.year}>
              <option value="">Select year</option>
              {YEARS.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </FormField>
            <FormField label="Section" value={form.section} onChange={set('section')} error={errors.section} />
          </div>
        ) : (
          <>
            <div className="form-grid">
              <FormField label="Department" value={form.department} onChange={set('department')} error={errors.department} />
              <FormField label="Designation" value={form.designation} onChange={set('designation')} error={errors.designation} />
              <FormField label="Cabin number" value={form.cabinNo} onChange={set('cabinNo')} error={errors.cabinNo} />
              <FormField label="Subjects" value={form.subjects} onChange={set('subjects')} error={errors.subjects} hint="Comma separated, e.g. Data Structures, OS" />
            </div>
            <FormField as="textarea" rows={3} label="Short bio (optional)" value={form.bio} onChange={set('bio')} />
          </>
        )}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
