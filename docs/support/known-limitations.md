# Known Limitations / Technical Debt

This file is intentionally specific and should be updated as issues are discovered.

## Schema / migrations

- The backend initializes schema at startup (`CREATE TABLE IF NOT EXISTS ...`). There is no migration framework yet.

## Account deletion

- There is no user-facing “delete account” flow in the app UI.

## Test coverage gaps

- Some integration-style tests under `backend/tests/` assume unauthenticated access; the backend enforces Bearer token auth for `/api/*`.

