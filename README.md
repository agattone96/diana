# Diana

## Repo layout (high level)

- `backend/`: FastAPI service (Python).
- `frontend/`: Expo app (React Native / web export used by the desktop app).
- `desktop/`: Electron app that bundles the web export.
- `apps/diana-web/`: Vite + React web app.

## Environment variables

- Copy `.env.example` to `.env` and set required values:
  - `DATABASE_URL` (server-only; include `?sslmode=require` for Neon)
  - `EXPO_PUBLIC_BACKEND_URL` (frontend-safe; points at your backend base URL)

## Free local database (Postgres)

- Start local Postgres (Docker): `make db-up`
- Reset local Postgres data (destructive): `make db-reset`
- Verify local Postgres: `make db-verify`
- Default local `DATABASE_URL` is prefilled in `.env.example`.

## Quickstart (backend)

- Prereq: Python 3.12 (see `.tool-versions`)
- Install (venv): `make setup`
- Run: `.venv/bin/python backend/server.py`
- Health check: `GET /health`

## Quickstart (frontend)

- Install: `cd frontend && yarn install`
- Run: `cd frontend && yarn start`
- Lint: `cd frontend && yarn lint`

## Quickstart (desktop)

- Build renderer + sync into Electron: `npm run desktop:build`
- Package unsigned macOS build: `npm run desktop:dist:mac`

## Quickstart (web app)

- Install: `cd apps/diana-web && npm ci`
- Dev: `cd apps/diana-web && npm run dev`
- Build: `cd apps/diana-web && npm run build`

## Database connectivity check (Neon/Postgres)

- Neon (HTTP driver): `DATABASE_URL='...' npm run db:verify`
- Local Docker Postgres: `make db-verify`

## Validation entry points

- `make lint` (repo sanity lint)
- `make test` (pytest)
- `make ci` (lint + tests)
