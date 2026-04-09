# Deployment

## Frontend

The frontend is deployed on Netlify.

### Netlify settings

- Base directory: `frontend`
- Build command: `npx expo export --platform web`
- Publish directory: `dist`

### Required Netlify environment variable

- `EXPO_PUBLIC_BACKEND_URL=https://<your-render-service>.onrender.com`

The web bundle will fail auth and API requests if `EXPO_PUBLIC_BACKEND_URL` is missing.

## Backend

The backend is prepared for Render using [`render.yaml`](./render.yaml).

### Render web service settings

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health`

### Required Render environment variables

- `DATABASE_URL` = Neon Postgres connection string
- `OPENAI_API_KEY`

### Optional

- `PYTHON_VERSION` if you want to pin the runtime in Render

## Database

Use Neon Postgres for production auth and storage.

1. Create a Neon project and database.
2. Copy the Neon connection string.
3. Add it to Render as `DATABASE_URL`.
4. Ensure the connection string includes `sslmode=require`.

Example server-side usage:

```ts
// app/actions.ts
"use server";
import { neon } from "@neondatabase/serverless";

export async function getData() {
  const sql = neon(process.env.DATABASE_URL!);
  const data = await sql`...`;
  return data;
}