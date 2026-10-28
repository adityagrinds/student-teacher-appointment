import { Link, Navigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { dashboardPath } from '../../utils/constants'
import Brand from '../../components/Brand'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const HOURS = ['09', '10', '11', '12', '13']

// col/row are 1-based grid lines inside the timetable body
const BLOCKS = [
  { col: 1, row: 2, span: 2, label: 'Dr. Rao', kind: 'open' },
  { col: 2, row: 1, span: 1, label: 'Booked', kind: 'taken' },
  { col: 2, row: 3, span: 2, label: 'Dr. Iyer', kind: 'open' },
  { col: 3, row: 1, span: 2, label: 'Your slot', kind: 'mine' },
  { col: 4, row: 2, span: 1, label: 'Pending', kind: 'pending' },
  { col: 4, row: 4, span: 1, label: 'Dr. Rao', kind: 'open' },
  { col: 5, row: 1, span: 2, label: 'Booked', kind: 'taken' },
  { col: 5, row: 4, span: 2, label: 'Dr. Khan', kind: 'open' },
]

const STEPS = [
  ['01', 'Find a teacher', 'Search by name, department or subject, and open their published office hours.'],
  ['02', 'Choose a slot', 'Pick an exact time, say why you want to meet, and send the request.'],
  ['03', 'Get confirmed', 'The teacher approves or declines. You get a notification and an appointment pass.'],
]

const POINTS = [
  ['Atomic booking', 'Each time slot is claimed in a single transaction, so two students can never hold the same one.'],
  ['Live updates', 'Approvals, rejections and cancellations appear on both sides the moment they happen.'],
  ['Rules, not trust', 'Access is enforced by database security rules, not just by what the interface hides.'],
  ['One record', 'Every request keeps its history. Nothing is silently deleted.'],
]

const ROLES = [
  { name: 'Students', text: 'Discover teachers, book a slot, track every request.', to: '/signup?role=student', cta: 'Create student account' },
  { name: 'Teachers', text: 'Publish office hours and decide on requests in one queue.', to: '/signup?role=teacher', cta: 'Create teacher account' },
  { name: 'Administrators', text: 'Accounts are issued by the platform owner. Sign in as usual.', to: '/login', cta: 'Log in' },
]

export default function Landing() {
  const { userProfile, loading } = useAuth()
  if (!loading && userProfile) return <Navigate to={dashboardPath(userProfile.role)} replace />

  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="wordmark">
          <Brand />
        </span>
        <nav aria-label="Account" className="landing-links">
          <Link to="/login" className="text-link">
            Log in
          </Link>
          <Link to="/signup" className="btn btn-primary">
            Get started
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="kicker">Manav Rachna University</p>
            <h1>
              Time with your faculty, <em>booked</em> properly.
            </h1>
            <p className="lede">
              Students find a teacher and reserve an exact slot. Teachers publish when they are free and answer requests
              from one queue. No more waiting outside a cabin.
            </p>
            <div className="row-gap">
              <Link to="/signup?role=student" className="btn btn-primary btn-lg">
                I&apos;m a student <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/signup?role=teacher" className="btn btn-secondary btn-lg">
                I&apos;m a teacher
              </Link>
            </div>
          </div>

          <figure className="timetable" aria-hidden="true">
            <figcaption>
              <span>This week</span>
              <span className="mono">15 min slots</span>
            </figcaption>
            <div className="tt-grid">
              <div className="tt-corner" />
              {DAYS.map((d) => (
                <div key={d} className="tt-day">
                  {d}
                </div>
              ))}
              <div className="tt-hours">
                {HOURS.map((h) => (
                  <span key={h} className="mono">
                    {h}:00
                  </span>
                ))}
              </div>
              <div className="tt-body">
                {BLOCKS.map((b) => (
                  <div
                    key={`${b.col}-${b.row}`}
                    className={`tt-block tt-${b.kind}`}
                    style={{ gridColumn: b.col, gridRow: `${b.row} / span ${b.span}` }}
                  >
                    {b.label}
                  </div>
                ))}
              </div>
            </div>
            <ul className="tt-legend">
              <li><i className="tt-open" /> Open</li>
              <li><i className="tt-pending" /> Pending</li>
              <li><i className="tt-mine" /> Approved</li>
              <li><i className="tt-taken" /> Taken</li>
            </ul>
          </figure>
        </section>

        <section className="section" aria-labelledby="how-title">
          <h2 id="how-title" className="section-h">
            How it works
          </h2>
          <ol className="steps">
            {STEPS.map(([n, title, text]) => (
              <li key={n} className="step">
                <span className="step-num">{n}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" aria-labelledby="why-title">
          <h2 id="why-title" className="section-h">
            Built carefully
          </h2>
          <dl className="points">
            {POINTS.map(([t, d]) => (
              <div key={t} className="point">
                <dt>{t}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="section" aria-labelledby="who-title">
          <h2 id="who-title" className="section-h">
            Who it&apos;s for
          </h2>
          <ul className="role-list">
            {ROLES.map((r) => (
              <li key={r.name}>
                <Link to={r.to} className="role-row">
                  <span className="role-name">{r.name}</span>
                  <span className="role-text">{r.text}</span>
                  <span className="role-cta">
                    {r.cta} <ArrowUpRight size={16} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="landing-foot">
        <span className="wordmark">
          <Brand />
        </span>
        <small>Faculty appointment portal · Manav Rachna University</small>
      </footer>
    </div>
  )
}
