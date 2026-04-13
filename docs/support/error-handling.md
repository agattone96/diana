# Error Handling and Support Expectations

## Frontend behavior

- Non-2xx responses from the backend surface as user-visible errors.
- If the backend returns HTTP `401`, the app clears the stored session token and returns the user to the logged-out flow.

## Backend conventions

Common responses:
- `401 Authentication required` — missing/invalid Bearer token
- `400` — validation errors (bad inputs)
- `500` — unexpected server failure (often includes `detail`)

AI configuration errors:
- If AI keys are not configured, AI endpoints may return `500` with a configuration message.

## What support needs from users

Ask for:
- exact action attempted (screen + button)
- timestamp and timezone
- whether it is reproducible
- screenshots (without sensitive data)
- if possible: backend request ID / logs (maintainer-provided)

