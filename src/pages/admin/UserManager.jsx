import { useMemo, useState } from 'react'
import { ref } from 'firebase/database'
import { Eye, Trash2, UserCheck, UserX } from 'lucide-react'
import { db } from '../../firebase'
import { useAuth, useToast } from '../../hooks/useAuth'
import { useRealtime } from '../../hooks/useRealtime'
import { setUserActive } from '../../services/userService'
import { purgeUser } from '../../services/adminService'
import { friendlyError } from '../../utils/errors'
import { formatDateTime } from '../../utils/dateTime'
import DataTable from '../../components/DataTable'
import SearchInput from '../../components/SearchInput'
import StatusBadge from '../../components/StatusBadge'
import ConfirmModal from '../../components/ConfirmModal'
import Modal from '../../components/Modal'
import ErrorState from '../../components/ErrorState'

const TITLES = { all: 'All users', teacher: 'Teachers', student: 'Students' }

const DETAIL_FIELDS = [
  ['email', 'Email'],
  ['role', 'Role'],
  ['rollNo', 'Roll number'],
  ['branch', 'Branch'],
  ['year', 'Year'],
  ['section', 'Section'],
  ['department', 'Department'],
  ['designation', 'Designation'],
  ['cabinNo', 'Cabin'],
  ['bio', 'Bio'],
]

export default function UserManager({ role = 'all' }) {
  const { userProfile: admin } = useAuth()
  const toast = useToast()
  const { data, loading, error } = useRealtime(() => ref(db, 'users'), 'users')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [viewing, setViewing] = useState(null)
  const [action, setAction] = useState(null) // { kind: 'toggle' | 'delete', user }
  const [busy, setBusy] = useState(false)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data
      .filter((u) => (role === 'all' ? !roleFilter || u.role === roleFilter : u.role === role))
      .filter((u) => !q || [u.name, u.email, u.rollNo, u.department].some((v) => (v || '').toLowerCase().includes(q)))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  }, [data, role, roleFilter, search])

  const confirm = async () => {
    const { kind, user } = action
    setBusy(true)
    try {
      if (kind === 'toggle') {
        await setUserActive(user, user.isActive === false, admin)
        toast.success(`${user.name} ${user.isActive === false ? 'activated' : 'deactivated'}.`)
      } else {
        await purgeUser({ uid: user.id, role: user.role, name: user.name, actorProfile: admin })
        toast.success(`${user.name} was deleted.`)
      }
      setAction(null)
    } catch (err) {
      toast.error(friendlyError(err, 'That action failed.'))
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    { key: 'name', header: 'Name', render: (u) => <strong>{u.name}</strong> },
    { key: 'email', header: 'Email' },
    ...(role === 'all' ? [{ key: 'role', header: 'Role', render: (u) => <span className="role-tag">{u.role}</span> }] : []),
    {
      key: 'detail',
      header: 'Details',
      render: (u) => (u.role === 'student' ? `${u.rollNo} · ${u.branch}` : u.role === 'teacher' ? `${u.department} · ${u.designation}` : '-'),
    },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.isActive === false ? 'INACTIVE' : 'ACTIVE'} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (u) => (
        <div className="row-gap">
          <button type="button" className="icon-btn" aria-label={`View ${u.name}`} title="View" onClick={() => setViewing(u)}>
            <Eye size={16} />
          </button>
          {u.role !== 'admin' && (
            <>
              <button
                type="button"
                className="icon-btn"
                aria-label={`${u.isActive === false ? 'Activate' : 'Deactivate'} ${u.name}`}
                title={u.isActive === false ? 'Activate' : 'Deactivate'}
                onClick={() => setAction({ kind: 'toggle', user: u })}
              >
                {u.isActive === false ? <UserCheck size={16} /> : <UserX size={16} />}
              </button>
              <button type="button" className="icon-btn icon-danger" aria-label={`Delete ${u.name}`} title="Delete" onClick={() => setAction({ kind: 'delete', user: u })}>
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  const target = action?.user
  return (
    <div className="stack">
      <div className="page-head">
        <h1>{TITLES[role]}</h1>
      </div>
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, roll number or department" label="Search users" />
        {role === 'all' && (
          <label className="select-inline">
            <span className="sr-only">Filter by role</span>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
            </select>
          </label>
        )}
      </div>
      {error ? <ErrorState message={error} /> : <DataTable columns={columns} rows={rows} loading={loading} emptyTitle="No users found" />}

      <Modal open={!!viewing} title={viewing?.name || ''} onClose={() => setViewing(null)}>
        {viewing && (
          <dl className="summary">
            {DETAIL_FIELDS.filter(([k]) => viewing[k]).map(([k, label]) => (
              <div key={k} className="summary-row">
                <dt>{label}</dt>
                <dd>{viewing[k]}</dd>
              </div>
            ))}
            {viewing.subjects?.length > 0 && (
              <div className="summary-row">
                <dt>Subjects</dt>
                <dd>{viewing.subjects.join(', ')}</dd>
              </div>
            )}
            <div className="summary-row">
              <dt>Status</dt>
              <dd>{viewing.isActive === false ? 'Inactive' : 'Active'}</dd>
            </div>
            <div className="summary-row">
              <dt>Joined</dt>
              <dd>{formatDateTime(viewing.createdAt)}</dd>
            </div>
          </dl>
        )}
      </Modal>

      <ConfirmModal
        open={!!action}
        title={action?.kind === 'delete' ? `Delete ${target?.name}?` : `${target?.isActive === false ? 'Activate' : 'Deactivate'} ${target?.name}?`}
        message={
          action?.kind === 'delete'
            ? `This removes the ${target?.role} profile${target?.role === 'teacher' ? ' and all their office hours' : ''}. Pending and approved bookings are cancelled and the other party notified; booking records are kept. The login itself remains in Firebase Authentication.`
            : target?.isActive === false
              ? 'They will be able to use the platform again.'
              : 'They will be blocked from using the platform' + (target?.role === 'teacher' ? ' and hidden from students.' : '.')
        }
        confirmLabel={action?.kind === 'delete' ? 'Delete' : target?.isActive === false ? 'Activate' : 'Deactivate'}
        danger={action?.kind === 'delete' || target?.isActive !== false}
        loading={busy}
        onConfirm={confirm}
        onCancel={() => setAction(null)}
      />
    </div>
  )
}
