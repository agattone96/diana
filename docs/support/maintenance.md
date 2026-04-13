# Maintenance Guide

## Routine checks

- Backend: ensure `/health` returns `{ "ok": true }`.
- Database: verify connectivity (Neon) and monitor connection limits.
- Logs: review backend logs for repeated `401` spikes (token invalidation), `500` AI errors, and database connection errors.

## Backups / retention

Use your Postgres provider’s backup and retention features. This repo does not include backup automation.

