# Real-Time Transit Analytics Platform

Full-stack transit analytics platform for real-time subway monitoring, user personalization, and alert delivery.

## Why this project matters

This project demonstrates practical product engineering around urban mobility data:
- Real-time GTFS feed ingestion and map visualization
- Data fallback strategy when GPS is missing (`TripUpdate -> stop coordinates`)
- Personalized features (auth, favorites, notifications)
- Time-window analytics (`Time Range + Compare`) for change interpretation

## Tech Stack

- Frontend: React, TypeScript, Vite, React Query, Mapbox GL, Tailwind
- Backend: Node.js, Express, TypeScript, PostgreSQL, Redis
- Auth/Email: JWT, bcrypt, Nodemailer

## Key Features

- Live vehicle map (`/api/vehicles`)
- Trend insights API (`/api/vehicles/insights`)
- Time range compare UI (`15m / 1h / 6h / 24h` vs previous window)
- Route activity ranking and sparkline
- JWT login/register
- Favorite routes and stops
- Alert matching + notification center
- Multi-language frontend (`en`, `zh`, `es`)

## Repository Structure

```text
.
├─ backend/
│  ├─ src/
│  │  ├─ controllers/
│  │  ├─ services/
│  │  ├─ repositories/
│  │  ├─ routes/
│  │  ├─ scripts/
│  │  └─ config/
│  ├─ .env.example
│  └─ .env.required.md
├─ frontend/
│  ├─ src/
│  └─ .env.example
└─ docs/
   ├─ architecture.md
   └─ api.md
```

## Quick Start

### 1) Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (recommended)
- Mapbox token

### 2) Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill values in `.env` (see `backend/.env.required.md` for details), then:

```bash
npm run db:init
npm run stops:fetch
npm run dev
```

> If you pulled latest changes, run `npm run db:init` again to create/upgrade
> `vehicle_metrics_snapshots` for trend insights.

### 3) Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Set `VITE_MAPBOX_TOKEN` in `frontend/.env`.

Frontend default URL: `http://localhost:5173`  
Backend default URL: `http://localhost:5001`

## Docs

- Architecture: `docs/architecture.md`
- API contracts: `docs/api.md`
- Backend env setup: `backend/.env.required.md`

## Interview Positioning

Use this project to show:
- product-oriented frontend with meaningful data interactions
- robust backend data ingestion under imperfect external feeds
- full-stack ownership from API design to UI delivery

