# diana-web

Vite + React web app with Neon Auth UI integration.

## Local setup

1. Copy `env.example` to `.env` in this folder.
2. Set:
   - `VITE_NEON_AUTH_URL=https://ep-wispy-rain-amn0yr1n.neonauth.c-5.us-east-1.aws.neon.tech/neondb/auth`
3. Install and run:

```bash
npm install
npm run dev
```

## Vercel environment variable

Configure the same variable in each deployment environment:

- `VITE_NEON_AUTH_URL`

## Neon Auth allowed origins / redirect URLs

Add these frontend URLs to Neon Auth allowed origins and redirect/callback settings:

- `https://diana-omega-two.vercel.app`
- `https://diana-allis-projects.vercel.app`
- `https://diana-git-main-allis-projects.vercel.app`

And include local development origin when needed:

- `http://localhost:5173`
