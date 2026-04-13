# Testing Guide

## Backend unit tests

```bash
pytest -q
```

Notes:
- Some tests require environment variables (for example `DATABASE_URL`).

## API smoke testing

The repository includes integration-style tests under `backend/tests/`. If you run them against a deployed backend, ensure:
- `EXPO_PUBLIC_BACKEND_URL` is set to the backend base URL
- you have a valid user session token for protected endpoints

## Lint / formatting

Backend tooling is listed in `backend/requirements.txt` (Black, isort, flake8, mypy). Configure your editor to use these tools if you are contributing.

