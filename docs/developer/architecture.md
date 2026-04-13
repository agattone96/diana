# Architecture Overview

## High-level system

- **Frontend**: Expo (React Native + Expo Router) in `frontend/`
- **Backend**: FastAPI app in `backend/server.py`
- **Database**: Postgres (Neon recommended) via `psycopg`

## Backend data model (summary)

The backend creates tables on startup (see `backend/server.py`):
- `users`, `sessions`
- `household_defaults`
- `inventory_items`
- `required_items`
- `weekly_plans`, `weekly_history`

## Authentication

- API endpoints under `/api/*` require `Authorization: Bearer <token>`
- Tokens are created on login/signup and stored in `sessions`

## AI flows

- Weekly plan generation: `/api/generate-plan`
- Recipe replacement: `/api/regenerate-recipe`
- Photo inventory extraction: `/api/inventory/extract-photo`

AI calls are executed server-side only; the frontend never uses API keys.

