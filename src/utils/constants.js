export const ROLES = { STUDENT: 'student', TEACHER: 'teacher', ADMIN: 'admin' }

export const PURPOSES = [
  'Doubt Clearing',
  'Project Discussion',
  'Career Guidance',
  'Personal Meeting',
  'Other',
]

export const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']

export const SLOT_DURATIONS = [10, 15, 20, 30, 45, 60]

export const APPOINTMENT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
}

export const ACTIVE_APPOINTMENT_STATUSES = ['PENDING', 'APPROVED']

export const SLOT_STATUS = { ACTIVE: 'ACTIVE', CLOSED: 'CLOSED', CANCELLED: 'CANCELLED' }

export const LIMITS = { reasonMin: 10, reasonMax: 500, noteMax: 300, instructionsMax: 300 }

export const dashboardPath = (role) => `/${role}/dashboard`

export const NAV_ITEMS = {
  student: [
    { to: '/student/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { to: '/student/teachers', label: 'Find Teachers', icon: 'Search' },
    { to: '/student/bookings', label: 'My Bookings', icon: 'CalendarCheck' },
    { to: '/student/profile', label: 'Profile', icon: 'User' },
  ],
  teacher: [
    { to: '/teacher/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { to: '/teacher/office-hours', label: 'Office Hours', icon: 'Clock' },
    { to: '/teacher/appointments', label: 'Appointments', icon: 'CalendarCheck' },
    { to: '/teacher/profile', label: 'Profile', icon: 'User' },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { to: '/admin/users', label: 'All Users', icon: 'Users' },
    { to: '/admin/teachers', label: 'Teachers', icon: 'GraduationCap' },
    { to: '/admin/students', label: 'Students', icon: 'BookOpen' },
    { to: '/admin/office-hours', label: 'Office Hours', icon: 'Clock' },
    { to: '/admin/appointments', label: 'Appointments', icon: 'CalendarCheck' },
    { to: '/admin/activity', label: 'Activity', icon: 'Activity' },
  ],
}
