# Developer Setup

## Prerequisites

- Python 3.11+ (backend)
- Node.js + Yarn 1.x (frontend)
- Postgres database (Neon recommended)

## Repo bootstrap (optional)

This repo contains a scaffolding script used to generate Codex artifacts:

```bash
make bootstrap
```

Artifacts are written under `_codex/` (internal scaffolding output, not product docs).

## Install backend dependencies

```bash
python -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
```

## Install frontend dependencies

```bash
cd frontend
yarn install
```

