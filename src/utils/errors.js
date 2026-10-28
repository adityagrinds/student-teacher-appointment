/** Error whose message is safe to show to users as-is. */
export class AppError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AppError'
  }
}

const AUTH_MESSAGES = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-login-credentials': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
  'auth/weak-password': 'Password is too weak. Use at least 8 characters with letters and numbers.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your internet connection and try again.',
  'auth/requires-recent-login': 'For security, please log in again and retry.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-token-expired': 'Your session has expired. Please log in again.',
}

export function friendlyError(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback
  if (err instanceof AppError) return err.message
  if (err.code && AUTH_MESSAGES[err.code]) return AUTH_MESSAGES[err.code]
  const text = `${err.code || ''} ${err.message || ''}`.toLowerCase()
  if (text.includes('permission_denied') || text.includes('permission denied')) {
    return 'You do not have permission to do that, or the data changed. Please refresh and try again.'
  }
  if (text.includes('network') || text.includes('offline') || text.includes('unavailable')) {
    return 'Network unavailable. Check your connection and try again.'
  }
  console.error(err)
  return fallback
}
