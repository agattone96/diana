# Versioning Strategy

This repository uses Semantic Versioning (SemVer):
- **MAJOR**: breaking changes (API changes, incompatible schema, required environment changes)
- **MINOR**: new features in a backwards-compatible way
- **PATCH**: bug fixes and small improvements

Practical guidance:
- If database schema changes require manual intervention, bump at least **MINOR**, and document it in `docs/support/upgrade-notes.md`.
- If you remove or rename API endpoints, bump **MAJOR**.

