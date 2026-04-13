# Local Development

## 1) Configure environment variables

- Backend env lives in `backend/.env` (loaded by `backend/server.py`).
- Frontend env lives in `frontend/.env`.

Use `.env.example` as a starting point.

## 2) Run the backend

```bash
cd backend
uvicorn server:app --reload --port 8001
```

Verify:
- `GET http://localhost:8001/health` returns `{ "ok": true }`

## 3) Run the frontend

```bash
cd frontend
yarn start
```

For local web:
- Expo will open a local web server.

## 4) Point the frontend at your backend

Set `EXPO_PUBLIC_BACKEND_URL` in `frontend/.env`.

Notes:
- For production builds, the frontend requires `https://` URLs.
- For local development, Expo typically supports `http://localhost:<port>` during `yarn start`.

