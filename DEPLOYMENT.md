# Deployment

## Frontend

The frontend is deployed on Netlify.

Netlify settings:

- Base directory: `frontend`
- Build command: `npx expo export --platform web`
- Publish directory: `dist`

Required Netlify environment variable:

- `EXPO_PUBLIC_BACKEND_URL=https://<your-render-service>.onrender.com`

The web bundle will fail auth and API requests if `EXPO_PUBLIC_BACKEND_URL` is missing.

## Backend

The backend is prepared for Render using [`render.yaml`](./render.yaml).

Render web service settings:

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health`

Required Render environment variables:

- `DATABASE_URL` (Neon Postgres connection string, include `?sslmode=require`)
- `OPENAI_API_KEY`

Optional:

- `PYTHON_VERSION` if you want to pin the runtime in Render

## Database

Use Neon Postgres for production.

1. Create a Neon project/database.
2. Copy the connection string.
3. Add it to Render as `DATABASE_URL`.
4. Ensure the connection string includes `sslmode=require`.

## Verification

Backend checks:

```bash
curl https://<your-render-service>.onrender.com/health
curl https://<your-render-service>.onrender.com/api/profile
```

Auth checks:

```bash
curl -X POST https://<your-render-service>.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

After setting `EXPO_PUBLIC_BACKEND_URL`, redeploy Netlify and confirm the generated frontend bundle no longer contains `undefined/api`.
