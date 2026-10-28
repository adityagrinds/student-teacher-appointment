import Modal from './Modal'

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
  confirmDisabled = false,
  children,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      busy={loading}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
      {children}
    </Modal>
  )
}
