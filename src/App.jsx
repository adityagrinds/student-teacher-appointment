import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import RoleGuard from './components/RoleGuard'
import AppShell from './components/AppShell'
import Landing from './pages/public/Landing'
import Login from './pages/public/Login'
import Signup from './pages/public/Signup'
import ForgotPassword from './pages/public/ForgotPassword'
import NotFound from './pages/public/NotFound'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentTeachers from './pages/student/StudentTeachers'
import StudentBookings from './pages/student/StudentBookings'
import StudentProfile from './pages/student/StudentProfile'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherOfficeHours from './pages/teacher/TeacherOfficeHours'
import TeacherAppointments from './pages/teacher/TeacherAppointments'
import TeacherProfile from './pages/teacher/TeacherProfile'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminTeachers from './pages/admin/AdminTeachers'
import AdminStudents from './pages/admin/AdminStudents'
import AdminOfficeHours from './pages/admin/AdminOfficeHours'
import AdminAppointments from './pages/admin/AdminAppointments'
import AdminActivity from './pages/admin/AdminActivity'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleGuard role="student" />}>
          <Route path="/student" element={<AppShell />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="teachers" element={<StudentTeachers />} />
            <Route path="bookings" element={<StudentBookings />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
        </Route>

        <Route element={<RoleGuard role="teacher" />}>
          <Route path="/teacher" element={<AppShell />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="office-hours" element={<TeacherOfficeHours />} />
            <Route path="appointments" element={<TeacherAppointments />} />
            <Route path="profile" element={<TeacherProfile />} />
          </Route>
        </Route>

        <Route element={<RoleGuard role="admin" />}>
          <Route path="/admin" element={<AppShell />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="teachers" element={<AdminTeachers />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="office-hours" element={<AdminOfficeHours />} />
            <Route path="appointments" element={<AdminAppointments />} />
            <Route path="activity" element={<AdminActivity />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
