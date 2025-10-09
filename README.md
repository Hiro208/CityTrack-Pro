# Real-Time Transit Analytics Platform

End-to-end full-stack platform for NYC subway real-time monitoring, user personalization, and service alert notifications.

This project focuses on real engineering challenges:
- GTFS-RT data quality issues (missing vehicle GPS)
- fallback position inference from `TripUpdate + stop_id`
- alert ingestion from MTA JSON feed (no API key required)
- personalized notifications based on favorite routes/stops

## Tech Stack

- Frontend: React + TypeScript + Vite + Mapbox GL + React Query + Tailwind
- Backend: Node.js + Express + TypeScript + PostgreSQL + Redis
- Auth & Notification: JWT + bcrypt + Nodemailer
- Data Source: MTA GTFS Realtime feeds + MTA alerts JSON feed

## Core Features

- Real-time subway vehicle visualization on map
- Route filtering and live vehicle popup
- User registration/login (JWT)
- Favorite routes and favorite stops
- Alert matching and notification center
- Email notification toggle and dispatch
- Multi-language UI (`en`, `zh`, `es`)
- Health endpoint for runtime checks

## Repository Structure

```text
.
├─ backend/                 # API server and data pipelines
│  ├─ src/
│  │  ├─ services/          # MTA feed ingestion, alert processing
│  │  ├─ controllers/       # API handlers
│  │  ├─ repositories/      # DB access layer
│  │  ├─ routes/            # REST routes
│  │  ├─ scripts/           # db:init, stops:fetch
│  │  └─ config/            # env/database/redis configs
│  └─ package.json
├─ frontend/                # React map application
│  ├─ src/
│  │  ├─ components/
│  │  ├─ api/
│  │  ├─ hooks/
│  │  └─ i18n.ts
│  └─ package.json
└─ docs/
   └─ architecture.md       # system architecture diagram
```

## Quick Start

### 1) Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (recommended)
- Mapbox token

### 2) Backend setup

```bash
cd backend
npm install
```

Create `backend/.env` (example values):

```env
PORT=5001
NODE_ENV=development

DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=transit_analytics
DB_HOST=localhost
DB_PORT=5432

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=replace-with-a-strong-secret

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_pass
SMTP_FROM=no-reply@example.com
```

Initialize DB and optional stop cache:

```bash
npm run db:init
npm run stops:fetch
```

Run backend:

```bash
npm run dev
```

### 3) Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_MAPBOX_TOKEN=your_mapbox_token
```

Run frontend:

```bash
npm run dev
```

Frontend default URL: `http://localhost:5173`  
Backend default URL: `http://localhost:5001`

## Main API Endpoints

### Health
- `GET /health`

### Vehicles
- `GET /api/vehicles`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Favorites
- `GET /api/favorites`
- `POST /api/favorites/routes`
- `DELETE /api/favorites/routes/:routeId`
- `POST /api/favorites/stops`
- `DELETE /api/favorites/stops/:stopId`

### Alerts & Notifications
- `GET /api/alerts`
- `GET /api/alerts/notifications/me`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `GET /api/notifications/settings`
- `PATCH /api/notifications/settings`

## Data Pipeline Notes

- Vehicle ingestion runs every 10 seconds.
- Alert ingestion runs every 60 seconds.
- Position fallback logic maps `stop_id` to coordinates via static stop data.
- Alert feed currently uses:
  - `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts.json`
  - no API key required.

## Architecture

See `docs/architecture.md` for the full architecture diagram and flow details.

## Interview Positioning (Suggested)

If you use this project for job applications, highlight:
- real-time data engineering with fallback strategy
- full-stack product delivery (auth + personalization + notifications)
- production-minded structure (modular backend, health checks, typed contracts)

