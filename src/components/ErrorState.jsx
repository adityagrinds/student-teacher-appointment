import { AlertTriangle } from 'lucide-react'

export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="empty-state error-state" role="alert">
      <AlertTriangle size={36} aria-hidden="true" />
      <h3>Could not load data</h3>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
