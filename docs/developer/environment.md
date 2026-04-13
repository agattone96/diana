# Environment and Configuration

This project uses two categories of environment variables:
- **server-only**: must never be embedded in frontend builds
- **frontend-safe**: can be compiled into the Expo app (prefixed with `EXPO_PUBLIC_`)

## Backend (`backend/.env`)

Required:
- `DATABASE_URL` — Postgres connection string (include `sslmode=require` for Neon)

AI features (at least one provider path must be configured):
- `OPENAI_API_KEY` — used for OpenAI Responses API requests
- `EMERGENT_LLM_KEY` — used by `emergentintegrations` for chat + image extraction

Optional:
- `OPENAI_PLANNER_MODEL` — defaults to `gpt-5.1` in code

## Frontend (`frontend/.env`)

Required:
- `EXPO_PUBLIC_BACKEND_URL` — absolute backend base URL (for example `https://your-service.onrender.com`)

The frontend calls `${EXPO_PUBLIC_BACKEND_URL}/api/*` and uses Bearer token auth.

