# Campus Event Tracker

A full-stack college campus event management and scheduling platform. Students can
browse, search and register for campus events; admins can create and manage events,
track registrations, and view students and statistics.

---

## Features

**Students**
- Register and log in
- Browse, search and filter events (category, status, date, venue)
- View event details with live capacity and seat availability
- Register / cancel registration for events
- "My Events" list of everything they've registered for
- Monthly calendar view of all events
- In-app notifications with unread count and mark-as-read
- Profile page

**Admins**
- Admin dashboard with event and registration statistics
- Create, edit, delete and cancel events
- Automatic **venue conflict detection** (rejects overlapping bookings in the same venue)
- View registrations for any event
- View all students
- Notifications

**Automatic behavior**
- Event status (**Upcoming / Ongoing / Completed / Cancelled**) is computed live from
  the current date/time (Asia/Kolkata) — it is never set manually by an admin.
- Students automatically get notified on: successful registration, event cancellation,
  event schedule updates, and venue changes.
- A background job checks hourly for events happening "tomorrow" and sends a
  reminder notification to every registered student.

---

## Technology Stack

**Frontend:** React (Vite), JavaScript, React Router, Axios, CSS, Lucide React icons
**Backend:** Node.js, Express.js, JWT auth, bcryptjs, MySQL2, dotenv, cors, helmet
**Database:** MySQL

---

## Folder Structure

```
campus-event-tracker/
├── backend/
│   ├── config/db.js              # MySQL connection pool
│   ├── controllers/              # Route handler logic
│   ├── middleware/                # auth, admin authorization, error handling
│   ├── routes/                    # Express routers
│   ├── utils/                     # status computation, notifications, reminders
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/            # Sidebar, Topbar, EventCard, Modal, etc.
│   │   ├── pages/                 # One file per route
│   │   ├── services/api.js        # Axios instance with JWT interceptor
│   │   ├── context/                # Auth + Toast context
│   │   ├── utils/                  # Date formatting helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
├── database/
│   ├── schema.sql
│   └── seed.sql
└── README.md
```

---

## 1. Database Setup

Make sure MySQL is installed and running on your machine, then run:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

This creates the `campus_event_tracker` database with all tables, and inserts demo
users and 7 sample events (dates are generated relative to today, so they'll always
look current).

---

## 2. Backend Setup

```bash
cd backend
npm install
copy .env.example .env
```

> On Windows, `copy .env.example .env` works in Command Prompt. In PowerShell use
> `Copy-Item .env.example .env`. In Git Bash / VS Code terminal use `cp .env.example .env`.

Open the new `.env` file and set your MySQL password:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campus_event_tracker
JWT_SECRET=change_this_secret
FRONTEND_URL=http://localhost:5173
```

Run the backend:

```bash
npm start
```

You should see:
```
Server running on http://localhost:5000
MySQL connected successfully.
```

---

## 3. Frontend Setup

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

You should see Vite print a local URL — open it in your browser.

---

## URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api

---

## Demo Credentials

| Role    | Email               | Password    |
|---------|----------------------|-------------|
| Admin   | admin@campus.com     | Admin@123   |
| Student | harish@campus.com    | Student@123 |
| Student | student2@campus.com  | Student@123 |

---

## API Endpoints

**Auth**
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

**Events**
```
GET    /api/events                       ?search=&category=&date=&status=&venue=
GET    /api/events/:id
POST   /api/events                       (admin)
PUT    /api/events/:id                   (admin)
DELETE /api/events/:id                   (admin)
```

**Registrations**
```
POST   /api/events/:id/register          (student)
DELETE /api/events/:id/register          (student)
GET    /api/my-events                    (student)
GET    /api/events/:id/registrations     (admin)
```

**Notifications**
```
GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all
```

**Admin / Students**
```
GET    /api/students                     (admin)
GET    /api/admin/stats                  (admin)
GET    /api/student/stats                (student)
```

All responses follow the same JSON shape:

```json
{ "success": true, "message": "...", "data": {} }
{ "success": false, "message": "...", "error": "..." }
```

---

## Testing Checklist

Everything below was verified against a running MySQL instance during development:

- [x] Student registration & login
- [x] Admin login
- [x] Invalid login rejected
- [x] Event creation, update, deletion
- [x] Event search, category filter, status filter
- [x] Student registration for an event
- [x] Duplicate registration prevented
- [x] Capacity enforcement ("Event is already full")
- [x] Registration deadline enforcement
- [x] Venue conflict detection on overlapping bookings
- [x] Automatic event status (upcoming/ongoing/completed/cancelled)
- [x] My Events list
- [x] Notifications (registration, cancellation, reminders)
- [x] Admin dashboard statistics
- [x] Student dashboard statistics
- [x] Protected routes (401 without token, 403 for wrong role)

---

## Future Enhancements

- Email/SMS reminders in addition to in-app notifications
- Event image uploads (currently a URL field only)
- Waitlists for full events
- QR-code based attendance check-in
- Admin ability to export registrations to CSV
- Password reset via email

---

## Troubleshooting

- **"MySQL connection failed" in the backend console:** make sure MySQL is running
  and the credentials in `backend/.env` are correct.
- **CORS or network errors in the browser:** make sure the backend is running on
  port 5000 and `FRONTEND_URL` in `.env` matches the URL Vite prints (default
  `http://localhost:5173`).
- **"Port already in use":** stop any other process using port 5000 or 5173, or
  change `PORT` in `.env` / pass `--port` to `vite`.
