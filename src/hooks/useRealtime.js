import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db } from '../firebase'
import { snapToList } from '../services/dbHelpers'
import { friendlyError } from '../utils/errors'

const EMPTY = []

/**
 * Live subscription to a Realtime Database ref or query.
 * `factory` builds the ref/query; it is re-run only when `key` changes. A null key disables it.
 * Lists come back as arrays of `{ id, ...value }`.
 */
export function useRealtime(factory, key, { list = true } = {}) {
  const [state, setState] = useState({ key: undefined, data: null, error: null })

  useEffect(() => {
    if (key === null) return undefined
    return onValue(
      factory(),
      (snap) => setState({ key, data: list ? snapToList(snap) : snap.val(), error: null }),
      (err) => setState({ key, data: null, error: friendlyError(err, 'Could not load data.') }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const current = state.key === key
  return {
    data: current && state.data ? state.data : list ? EMPTY : null,
    loading: key !== null && !current,
    error: current ? state.error : null,
  }
}

/** Live map of slotId -> { timeKey -> lock } for the given office-hour ids. */
export function useSlotLocks(slotIds) {
  const [locks, setLocks] = useState({})
  const key = slotIds.join(',')

  useEffect(() => {
    const unsubs = key
      ? key.split(',').map((id) =>
          onValue(
            ref(db, `availabilityBookings/${id}`),
            (snap) => setLocks((prev) => ({ ...prev, [id]: snap.val() || {} })),
            (err) => console.warn('Could not read slot bookings', err),
          ),
        )
      : []
    return () => unsubs.forEach((u) => u())
  }, [key])

  return locks
}
