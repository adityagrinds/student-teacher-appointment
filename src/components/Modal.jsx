import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'

/** Accessible dialog: Escape closes, focus is trapped and restored, backdrop click closes. */
export default function Modal({ open, title, onClose, children, footer, wide = false, busy = false }) {
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    const dialog = dialogRef.current
    const first = dialog.querySelector('[data-autofocus]') || dialog.querySelector(FOCUSABLE)
    first?.focus()
    document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCloseRef.current()
      if (e.key !== 'Tab') return
      const items = [...dialog.querySelectorAll(FOCUSABLE)]
      if (!items.length) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [open, busy])

  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div
        ref={dialogRef}
        className={`modal ${wide ? 'modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close dialog" onClick={onClose} disabled={busy}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
