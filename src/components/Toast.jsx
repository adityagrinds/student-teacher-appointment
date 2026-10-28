import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info }

export default function Toast({ toasts, onDismiss }) {
  return (
    <div className="toast-region" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.type]
        return (
          <div key={t.id} className={`toast toast-${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
            <Icon size={18} aria-hidden="true" />
            <span>{t.message}</span>
            <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => onDismiss(t.id)}>
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
