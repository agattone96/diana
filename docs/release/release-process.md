# Release Process

This project has two deployable artifacts:
- Backend API service (`backend/`) — typically deployed to Render
- Web frontend (`frontend/`) — typically deployed to Netlify (static export)

## Standard release checklist

1. Ensure `CHANGELOG.md` has an **Unreleased** section describing changes.
2. Run tests: `pytest -q`
3. Confirm environment variable matrix is accurate (`docs/developer/environment.md`).
4. Deploy backend and verify `/health` returns `{ "ok": true }`.
5. Deploy frontend and verify login + plan generation flows.
6. Create release notes from `docs/release/release-notes-template.md`.

## Operational expectations

- Backend database schema is created on app startup (migrations are not yet implemented).
- Backwards-incompatible schema changes should be treated as a breaking release.

