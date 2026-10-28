export default function LoadingScreen({ label = 'Loading...' }) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}
