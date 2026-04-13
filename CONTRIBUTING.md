# Contributing

Thanks for helping improve Diana’s Pantry Plan.

## Development setup

Follow:
- `docs/developer/setup.md`
- `docs/developer/local-development.md`
- `docs/developer/environment.md`

## Code style

Backend:
- Prefer Black-compatible formatting and keep functions small and testable.

Frontend:
- Keep UI changes accessible and touch-friendly; test on web + mobile layouts when possible.

## Tests

Run:

```bash
pytest -q
```

If you add new endpoints or features, add or update tests under:
- `backend/tests/` (backend)
- `tests/` (repo-level checks)

## Pull requests

- Keep PRs focused and minimal-diff.
- Update `CHANGELOG.md` under **Unreleased** for user-facing changes.
- Include screenshots for UI changes when feasible.

