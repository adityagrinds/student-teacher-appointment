import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/** Label + control + inline error. `as` can be input (default), textarea or select. Password inputs get a show/hide toggle. */
export default function FormField({ label, error, as: Tag = 'input', hint, children, type, ...props }) {
  const id = useId()
  const [shown, setShown] = useState(false)
  const isPassword = Tag === 'input' && type === 'password'
  const control = (
    <Tag
      id={id}
      type={isPassword && shown ? 'text' : type}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-err` : undefined}
      {...props}
    >
      {children}
    </Tag>
  )
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {isPassword ? (
        <div className="password-wrap">
          {control}
          <button
            type="button"
            className="password-toggle"
            aria-label={shown ? 'Hide password' : 'Show password'}
            aria-pressed={shown}
            onClick={() => setShown((s) => !s)}
          >
            {shown ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      ) : (
        control
      )}
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && (
        <p id={`${id}-err`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
