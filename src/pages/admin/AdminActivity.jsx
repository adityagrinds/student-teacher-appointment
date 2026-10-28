import { useState } from 'react'
import { ACTIVITY_GROUPS, useActivity } from '../../hooks/useActivity'
import ActivityList from '../../components/ActivityList'
import ErrorState from '../../components/ErrorState'

export default function AdminActivity() {
  const { data, loading, error } = useActivity()
  const [group, setGroup] = useState('')
  const types = ACTIVITY_GROUPS.find((g) => g.key === group).types
  const items = [...data].filter((l) => !types || types.includes(l.type)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Activity</h1>
      </div>
      <div className="chip-filter" role="group" aria-label="Filter activity">
        {ACTIVITY_GROUPS.map((g) => (
          <button key={g.key || 'all'} type="button" className={group === g.key ? 'is-active' : ''} aria-pressed={group === g.key} onClick={() => setGroup(g.key)}>
            {g.label}
          </button>
        ))}
      </div>
      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="skeleton skeleton-card" />
      ) : (
        <div className="card">
          <ActivityList items={items} />
        </div>
      )}
    </div>
  )
}
