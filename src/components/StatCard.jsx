export default function StatCard({ label, value, icon: Icon, tone = 'primary', loading }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <p className="stat-label">
        <span className="stat-mark" aria-hidden="true" />
        {label}
      </p>
      <p className="stat-value">{loading ? <span className="skeleton skeleton-sm" /> : value}</p>
      {Icon && <Icon className="stat-icon" size={18} aria-hidden="true" />}
    </div>
  )
}
