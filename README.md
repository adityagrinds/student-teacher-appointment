# MRU Connect - Faculty Appointment Portal

Built for Manav Rachna University. Students book office-hour slots with faculty; teachers and admins manage them.

A college/university appointment platform built with **React + Vite**, **Firebase Authentication** and **Firebase Realtime Database** (no Firestore, no custom backend).

- **Students** discover teachers, see office-hour time slots, and request appointments.
- **Teachers** publish office hours and approve / reject / complete requests.
- **Admins** monitor and manage users, office hours and appointments.

## Features

| Area | Highlights |
| --- | --- |
| Auth | Email/password signup & login, logout, password reset, change password, account deletion (with re-authentication), session persistence, protected + role-guarded routes, missing-profile and deactivated-account screens |
| Student | Overview cards, teacher search (name / department / subject) and department filter, availability grouped by date with generated time slots and per-slot states (Available, Pending, Approved, Booked, Rejected, Past), booking form with validation, My Bookings (filter, search, cancel, appointment pass), profile editing |
| Teacher | Stats, publish office hours (overlap / past-date / time validation), edit / close / reopen / cancel / delete (with warnings about connected bookings), requests by status tab with search and date filter, approve / reject (reason) / complete, notifications, profile editing |
| Admin | Platform statistics, user management (search, view, activate/deactivate, delete), office-hour management, appointment management (status change with confirmation + admin note), activity feed |
| Quality | Toasts instead of `alert()`, confirmation modals for every destructive action, double-submit protection, loading skeletons, empty/error states, responsive layout, focus styles, accessible modals |

### Double-booking prevention

Booking never "checks then writes". Each bookable time slot has a deterministic lock at
`availabilityBookings/{slotId}/{startHHmm-endHHmm}`.

1. A student claims the lock with a Realtime Database **`runTransaction`**; it commits only if the lock is empty.
2. Only after the lock is held, the appointment, notification and activity log are written in one atomic multi-path `update`.
3. The security rules also require that the lock exists and belongs to the student before an appointment can be created.
4. If the lock is taken, the student sees *"This slot was just booked by another student."* Rejection or cancellation deletes the lock so the slot becomes available again.

## Technology stack

React 19, Vite, React Router, Firebase Auth, Firebase Realtime Database, lucide-react, plain CSS.

## Folder structure

```
src/
  firebase.js            Firebase init (reads VITE_FIREBASE_* env vars)
  App.jsx, main.jsx      Routes and providers
  context/               AuthProvider (currentUser, userProfile, userRole, loading, login, signup,
                         logout, resetPassword, deleteAccount, refreshUserProfile), ToastProvider
  hooks/                 useAuth/useToast, useRealtime (live DB subscriptions), useAppointments, useActivity
  services/              authService, userService, slotService, appointmentService,
                         notificationService, adminService, dbHelpers
  utils/                 constants, dateTime, validation, errors, slotState
  components/            AppShell, Sidebar, Topbar, ProtectedRoute, RoleGuard, LoadingScreen, EmptyState,
                         ErrorState, Toast, ConfirmModal, Modal, StatusBadge, StatCard, SearchInput,
                         TeacherCard, AvailabilityCard, AppointmentCard, BookingModal, NotificationPanel,
                         ProfileMenu, DataTable, ...
  pages/public|student|teacher|admin
database.rules.json      Realtime Database security rules
firebase.json            Firebase CLI config (rules + optional hosting)
.env.example             Required environment variables
```

## Firebase setup

> **Only the project owner should have access to the Firebase Console and project settings.**
> The web config values (API key, project ID, ...) are *public identifiers*, not secrets, and ship inside every web build.
> What protects your data is Authentication plus the security rules below. Never put a service-account JSON
> or any private key in this repository or in frontend code.

1. Copy `.env.example` to `.env.local` and fill in the values from Firebase Console → Project settings → Your apps → Web app.
   (`.env.local` is git-ignored. If it already exists in your checkout, it holds the project's web config.)
2. **Authentication**: Console → Build → Authentication → Sign-in method → enable **Email/Password**.
   For password reset emails, review Authentication → Templates. Add your deploy domain under Settings → Authorized domains.
3. **Realtime Database**: Console → Build → Realtime Database → Create database (this project uses the
   `asia-southeast1` instance in `VITE_FIREBASE_DATABASE_URL`). Start in **locked mode**, then deploy the rules below.

## Realtime Database structure

```
users/{uid}                     private profile: uid, name, email, role (student|teacher|admin), isActive,
                                createdAt, updatedAt + role fields
                                  student: rollNo, branch, year, section
                                  teacher: department, designation, cabinNo, subjects[], bio
                                  admin:   adminId, department
teachers/{uid}                  public teacher directory (name, department, designation, cabinNo, subjects, bio,
                                isActive) - readable by signed-in users; contains no email
availabilitySlots/{slotId}      teacherId, teacherName, date (YYYY-MM-DD), startTime/endTime (HH:mm),
                                slotDuration, cabinNo, instructions, status ACTIVE|CLOSED|CANCELLED
availabilityBookings/{slotId}/{timeKey}
                                the atomic booking lock: appointmentId, studentId, teacherId, status
appointments/{appointmentId}    bookingId (BK-000001), slotId, teacherId, studentId, names, roll no, date, timeSlot,
                                purposeCategory, reasonDetails, status PENDING|APPROVED|REJECTED|CANCELLED|COMPLETED,
                                teacherNote, rejectionReason, cancellationReason, adminNote, slotStartAt, timestamps
notifications/{id}              userId, type, title, message, read, createdBy, createdAt
activityLogs/{id}               type, message, actorId, actorName, actorRole, createdAt (admin-readable only)
counters/bookingSeq             sequence used for booking references
```

Student data is stored once, in `users/{uid}` (no duplicate `students/` collection to keep in sync). Only teachers get a
second, public entry in `teachers/{uid}` so students can browse them without reading private user records.

## Security rules deployment

Rules live in `database.rules.json`. Either:

- **Console**: Realtime Database → Rules → paste the file's contents → Publish; or
- **CLI**:
  ```bash
  npm i -g firebase-tools
  firebase login
  firebase use <your-project-id>
  firebase deploy --only database
  ```

The rules: deny everything by default; users read/update only their own profile and cannot change their own `role` or
`isActive`; self-registration is limited to `student`/`teacher`; teachers write only their own slots and appointments;
students can create appointments only for themselves (status `PENDING`, on an active slot, holding the booking lock) and can
only cancel their own; appointment identity fields are immutable; admins can manage all data; activity logs are admin-readable.

## How to create the first admin

Public signup only creates students and teachers, and the rules reject self-created admin profiles. To bootstrap the first admin:

1. Sign up normally in the app (as a student) with the email you want to use for the admin.
2. In Firebase Console → Realtime Database, open `users/{that uid}` and change `role` to `admin`
   (optionally add `adminId` and `department`; you may remove the student-only fields). Done by the owner in the Console,
   this bypasses the rules.
3. Log out and back in; you are redirected to `/admin/dashboard`.

To promote more admins, repeat the same Console step for each account.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint
npm run build      # production build in dist/
npm run preview
```

## Deployment

Any static host works (the build is a single-page app; configure a fallback to `index.html`). With Firebase Hosting:

```bash
npm run build
firebase deploy --only hosting,database
```

Set the `VITE_FIREBASE_*` variables in your build environment.

## Known limitations

Be aware that a frontend-only Firebase app cannot be made fully tamper-proof. The role checks in the UI are a convenience;
**the security rules are the real enforcement**, and they have limits:

- **Admin provisioning is manual** (see above). There is no in-app admin promotion.
- **Anyone can self-register as a teacher.** There is no verification step; deactivate unwanted teachers from the admin panel.
- **Deleting a user from the admin panel removes their database data but not their Firebase Auth login** - deleting another
  user's Auth account needs the Admin SDK (a backend / Cloud Function). Their login will land on a "Profile not found" screen
  that offers to remove the login so they can re-register. Self-service account deletion removes both.
- **Teacher directory visibility**: `teachers/` is readable by any signed-in user; "active only" is filtered in the client, not by rules.
- **Past-slot check**: the rules compare a client-supplied `slotStartAt` to server time; the slot's real date/time is validated in the client.
- **Lock griefing**: a malicious active student could claim slot locks without completing a booking (rules require
  the claim to be for themself, not that an appointment follows). Admins can clear this by cancelling the office hour.
- **Notifications** can be created by any signed-in user for any user id (rules only require `createdBy` = their uid).
- Transactions and multi-path updates are atomic, but cascading cleanups (delete teacher/student) read data first; concurrent
  changes between the read and the write are possible in theory.
- No automated tests are included; verification was lint + production build. End-to-end flows need a live Firebase project.
