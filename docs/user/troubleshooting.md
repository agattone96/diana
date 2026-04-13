# Troubleshooting

## I can’t sign up / log in

- Verify the backend is reachable (try the backend `/health` endpoint).
- If you are using a hosted web build, confirm the deployment is pointed at the correct backend URL.

## “EXPO_PUBLIC_BACKEND_URL is not configured…”

This error means the app build does not have a backend URL configured.

- For hosted web: ask the maintainer to set `EXPO_PUBLIC_BACKEND_URL` in the hosting provider.
- For local dev: follow `docs/developer/environment.md`.

## I’m logged in, but I keep getting logged out

- If the backend returns HTTP `401`, the app clears the stored token.
- Common causes:
  - backend database was reset
  - backend deployments changed and invalidated sessions

## Photo inventory extraction isn’t working

Photo extraction requires backend AI configuration. See:
- `docs/user/privacy.md` (what is sent)
- `docs/developer/environment.md` (required env vars)

