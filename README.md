# Diana

## Neon Postgres (serverless)

- Set `DATABASE_URL` (include `?sslmode=require`) in a local `.env`/`.env.local` (see `.env.example`).
- Serverless health check: `GET /api/health` (runs `SELECT NOW()`).
- Local verification: `DATABASE_URL='...' npm run db:verify`.
