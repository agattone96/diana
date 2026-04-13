# Debugging Guide

## Backend

- Run with reload: `uvicorn server:app --reload --port 8001`
- Inspect logs: FastAPI logs to stdout
- Common issues:
  - `KeyError: 'DATABASE_URL'` → missing backend env var
  - `401 Authentication required` → missing/invalid Bearer token

## Frontend

- If API calls fail, first confirm `EXPO_PUBLIC_BACKEND_URL` is correct.
- The frontend stores the auth token locally and clears it on HTTP `401`.

