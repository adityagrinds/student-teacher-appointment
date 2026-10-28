import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext } from './auth-context'
import Toast from '../components/Toast'

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback(
    (type, message) => {
      const id = ++idRef.current
      setToasts((t) => [...t.slice(-3), { id, type, message }])
      setTimeout(() => dismiss(id), type === 'error' ? 6000 : 4000)
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}
