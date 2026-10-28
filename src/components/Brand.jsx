/** "M" monogram with a small vermilion dot: the booked time slot between the two peaks. */
export function Logo({ size = 28, tone = 'dark' }) {
  const bg = tone === 'light' ? '#f4efe4' : '#1b1a17'
  const fg = tone === 'light' ? '#1b1a17' : '#f4efe4'
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" className="logo">
      <rect width="32" height="32" rx="7" fill={bg} />
      <path d="M7.5 23V9.5l8.5 8 8.5-8V23" fill="none" stroke={fg} strokeWidth="3" strokeLinejoin="miter" />
      <circle cx="16" cy="24.6" r="2.1" fill="#e8744f" />
    </svg>
  )
}

export default function Brand({ tone = 'dark', showUniversity = true }) {
  return (
    <span className={`brand-lock ${tone === 'light' ? 'brand-light' : ''}`}>
      <Logo tone={tone} />
      <span className="brand-text">
        <strong>MRU Connect</strong>
        {showUniversity && <small>Manav Rachna University</small>}
      </span>
    </span>
  )
}
