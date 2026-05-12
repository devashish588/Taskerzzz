# TaskFlow Enterprise

> A full-stack team task management platform with role-based access control, analytics dashboard, and Kanban board.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS v4 + Recharts + Zustand |
| Backend | Node.js + Express.js + Zod |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (15min access) + Refresh Token (7d) in httpOnly cookies |
| DnD | @hello-pangea/dnd |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL running locally, or Docker Desktop for the included local Postgres service

### Backend
```bash
docker compose up -d postgres  # optional local Postgres on localhost:5433
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL
npm install
npx prisma migrate dev --name init
npm run seed  # Creates demo data
npm run dev   # Starts on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # Starts on port 5173
```

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@taskerzz.com | admin123 |
| Tasker | alice@taskerzz.com | tasker123 |
| Tasker | bob@taskerzz.com | tasker123 |
| Tasker | carol@taskerzz.com | tasker123 |

## Features

### Admin
- Full analytics dashboard with 7 chart types
- Project management with member assignment
- Task creation, assignment, and tracking
- Team management with email invites
- Overdue task monitoring

### Tasker
- Personal dashboard with task stats
- Kanban board with drag-and-drop
- Task status updates and comments
- Profile management

## Deployment (Railway)

Deploy 3 separate services:
1. **PostgreSQL** — Railway managed Postgres plugin
2. **Backend** — Set `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`
3. **Frontend** — Set `VITE_API_URL` to backend URL

## API Endpoints

See the full REST API with 30+ endpoints covering auth, users, projects, tasks, comments, and analytics.
