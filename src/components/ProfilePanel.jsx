import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useAuth, useToast } from '../hooks/useAuth'
import { updateProfile } from '../services/userService'
import { changePassword } from '../services/authService'
import { friendlyError } from '../utils/errors'
import { YEARS } from '../utils/constants'
import { parseSubjects, passwordError, validateStudentProfile, validateTeacherProfile } from '../utils/validation'
import FormField from './FormField'
import ConfirmModal from './ConfirmModal'

function ProfileForm({ profile }) {
  const toast = useToast()
  const [values, setValues] = useState({
    name: profile.name,
    rollNo: profile.rollNo || '',
    branch: profile.branch || '',
    year: profile.year || '',
    section: profile.section || '',
    department: profile.department || '',
    designation: profile.designation || '',
    cabinNo: profile.cabinNo || '',
    subjects: (profile.subjects || []).join(', '),
    bio: profile.bio || '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }))
  const isStudent = profile.role === 'student'

  const submit = async (e) => {
    e.preventDefault()
    if (saving) return
    const found = isStudent ? validateStudentProfile(values) : validateTeacherProfile(values)
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    try {
      await updateProfile(profile, { ...values, subjects: parseSubjects(values.subjects) })
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(friendlyError(err, 'Could not update your profile.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="card form-stack">
      <h2>Profile details</h2>
      <p className="muted">{profile.email}</p>
      <FormField label="Full name" value={values.name} onChange={set('name')} error={errors.name} />
      {isStudent ? (
        <div className="form-grid">
          <FormField label="Roll number" value={values.rollNo} onChange={set('rollNo')} error={errors.rollNo} />
          <FormField label="Branch" value={values.branch} onChange={set('branch')} error={errors.branch} />
          <FormField as="select" label="Year" value={values.year} onChange={set('year')} error={errors.year}>
            <option value="">Select year</option>
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </FormField>
          <FormField label="Section" value={values.section} onChange={set('section')} error={errors.section} />
        </div>
      ) : (
        <>
          <div className="form-grid">
            <FormField label="Department" value={values.department} onChange={set('department')} error={errors.department} />
            <FormField label="Designation" value={values.designation} onChange={set('designation')} error={errors.designation} />
            <FormField label="Cabin number" value={values.cabinNo} onChange={set('cabinNo')} error={errors.cabinNo} />
            <FormField label="Subjects" value={values.subjects} onChange={set('subjects')} error={errors.subjects} hint="Comma separated" />
          </div>
          <FormField as="textarea" rows={3} label="Bio" value={values.bio} onChange={set('bio')} />
        </>
      )}
      <div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

function PasswordForm() {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (saving) return
    const pe = passwordError(next)
    setError(pe)
    if (pe) return
    setSaving(true)
    try {
      await changePassword(current, next)
      toast.success('Password changed.')
      setCurrent('')
      setNext('')
    } catch (err) {
      toast.error(friendlyError(err, 'Could not change your password.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="card form-stack">
      <h2>Change password</h2>
      <FormField label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      <FormField label="New password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={error} />
      <div>
        <button type="submit" className="btn btn-secondary" disabled={saving || !current || !next}>
          {saving ? 'Updating...' : 'Update password'}
        </button>
      </div>
    </form>
  )
}

function DeleteAccount() {
  const { deleteAccount } = useAuth()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await deleteAccount(password)
      toast.success('Your account was deleted.')
    } catch (err) {
      toast.error(friendlyError(err, 'Could not delete your account.'))
      setBusy(false)
    }
  }

  return (
    <section className="card danger-zone">
      <h2>Delete account</h2>
      <p className="muted">
        Permanently deletes your login and profile. Your pending and approved bookings are cancelled and the other party is notified.
      </p>
      <button type="button" className="btn btn-danger" onClick={() => setOpen(true)}>
        <Trash2 size={16} aria-hidden="true" /> Delete my account
      </button>
      <ConfirmModal
        open={open}
        title="Delete your account?"
        message="This cannot be undone. Enter your password to confirm."
        confirmLabel="Delete account"
        danger
        loading={busy}
        confirmDisabled={!password}
        onConfirm={confirm}
        onCancel={() => {
          setOpen(false)
          setPassword('')
        }}
      >
        <FormField label="Current password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </ConfirmModal>
    </section>
  )
}

export default function ProfilePanel() {
  const { userProfile } = useAuth()
  return (
    <div className="stack">
      <ProfileForm profile={userProfile} />
      <PasswordForm />
      <DeleteAccount />
    </div>
  )
}
