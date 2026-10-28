import { Link } from 'react-router-dom'
import Brand from '../../components/Brand'

const NOTES = [
  ['01', 'Pick a teacher and an open slot.'],
  ['02', 'Send a short reason for the meeting.'],
  ['03', 'Get an approval and a pass.'],
]

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="auth-page">
      <aside className="auth-aside" aria-hidden="true">
        <Link to="/" className="wordmark" tabIndex={-1}>
          <Brand tone="light" />
        </Link>
        <div className="auth-aside-copy">
          <h2>
            Meet your faculty, <em>without</em> the back-and-forth.
          </h2>
          <ol>
            {NOTES.map(([n, text]) => (
              <li key={n}>
                <span className="mono">{n}</span>
                {text}
              </li>
            ))}
          </ol>
        </div>
        <p className="auth-aside-foot">Faculty appointments · Manav Rachna University</p>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          <Link to="/" className="wordmark auth-wordmark">
            <Brand />
          </Link>
          <div className="auth-heading">
            <h1>{title}</h1>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          {children}
          {footer && <p className="auth-footer">{footer}</p>}
        </div>
      </section>
    </main>
  )
}
