# Senior Full-Stack + DevOps Bootstrap Plan

## Skill handling note
The requested skill reference `$vercel:env-vars` is not available in this session's declared skill list (only `skill-creator` and `skill-installer` are available), so this plan uses a manual fallback workflow while preserving your intent.

## Parameters to finalize first
Before execution, replace placeholders with concrete values:
- `ORG`: `<org>`
- `REPO`: `<repo>`
- `ENV_NAME`: `<env>`
- `APP_NAME`: `<app>`
- `APP_TYPE`: `<web|api|desktop|cli|mobile>`
- `STACK_PRESET`: `<preset>`
- `LANGUAGE`: `<ts|js|py|go>`
- `INTERNET_AFTER_SETUP`: `off`

## Phase 0 — Deterministic constraints & repo hygiene
1. Pin runtime/toolchain versions and record checksums:
   - Node: `.nvmrc` or `.tool-versions`
   - Python: `.python-version`
   - Go: `go.mod` toolchain
2. Lock package manager strategy:
   - `npm ci` / `pnpm --frozen-lockfile` / `pip-tools` / `uv lock` / `go mod vendor`
3. Configure reproducible CI environment:
   - fixed runner image, cache keys bound to lockfiles
4. Freeze formatting/lint/typecheck rules:
   - ESLint, Prettier, Ruff/Black, GolangCI-Lint (stack dependent)
5. Set branch protections and required checks list.

## Phase 1 — Workspace bootstrap
1. Initialize monorepo or single-repo layout by `APP_TYPE`:
   - `apps/<app>` + `packages/*` for web/api combos
2. Add baseline project metadata:
   - `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.editorconfig`
3. Add CI pipeline skeleton:
   - jobs: `lint`, `typecheck`, `test`, `build`, `security-scan`
4. Add local DX scripts:
   - `make setup`, `make test`, `make lint`, `make ci`
5. Add pre-commit hooks:
   - format + lint + secret scan

## Phase 2 — Scaffold app from parameters
1. Select scaffolder by stack/language:
   - TS/JS web: Vite/Next.js
   - TS/JS API: Fastify/Nest/Express
   - Python API: FastAPI
   - Go API/CLI: Cobra + stdlib http
2. Create clean architecture slices:
   - `domain`, `application`, `infrastructure`, `interfaces`
3. Add env management contract:
   - `.env.example` + runtime validation schema (e.g., Zod/Pydantic)
4. Add deployment descriptors:
   - Vercel/Render/Netlify/GitHub Actions artifacts as applicable
5. Add observability baseline:
   - structured logging, error boundary/middleware, health endpoint

## Phase 3 — Strict TDD feature delivery loop
For each feature in `FEATURES`:
1. Write failing acceptance test (API contract or UI behavior).
2. Write failing unit tests for core business rules.
3. Implement minimum code to pass tests.
4. Refactor for architecture constraints.
5. Add regression tests for discovered edge cases.
6. Ensure branch quality gates pass before next feature.

Definition of done per feature:
- acceptance + unit tests green
- no lint/type errors
- docs updated (API route or user flow)
- changelog entry added

## Phase 4 — Environment & secrets plan (Vercel/GitHub aligned)
1. Define env var matrix by scope:
   - local, preview, production
2. Document each var:
   - name, purpose, required/optional, default, sensitivity, rotation owner
3. Implement env sync workflow:
   - source-of-truth manifest in repo
   - CI guard that fails if required vars missing
4. GitHub integration:
   - Actions use encrypted secrets
   - environment protection rules
5. Vercel integration:
   - project env mapping for preview/prod
   - post-deploy smoke checks using env-aware endpoints

## Phase 5 — Internet-off execution mode after setup
Once dependencies and scaffolds are installed:
1. Disable network-dependent build/test steps.
2. Use lockfile + cached artifacts only.
3. Prevent accidental remote fetches in CI via offline flags where supported.

## Required artifacts in `/workspace/_codex/`
Create these during execution:
1. `/workspace/_codex/00-params.json`
   - concrete resolved values for all PARAMETERS
2. `/workspace/_codex/01-bootstrap-checklist.md`
   - deterministic setup checklist with status boxes
3. `/workspace/_codex/02-architecture.md`
   - chosen architecture, boundaries, tradeoffs
4. `/workspace/_codex/03-test-strategy.md`
   - TDD pyramid, naming conventions, coverage thresholds
5. `/workspace/_codex/04-feature-traceability.csv`
   - feature → tests → commits mapping
6. `/workspace/_codex/05-env-vars-matrix.csv`
   - env var name/scope/source/sensitivity/owner
7. `/workspace/_codex/06-runbook.md`
   - local dev, CI, deploy, rollback, incident steps
8. `/workspace/_codex/07-final-report.md`
   - completed checks, evidence, remaining risks

## Suggested execution order
1. Finalize PARAMETERS.
2. Run deterministic bootstrap.
3. Scaffold application skeleton.
4. Implement features with strict red-green-refactor cycles.
5. Generate and fill `/workspace/_codex/` artifacts.
6. Run full CI-equivalent local validation.
7. Prepare deployment handoff.

## Validation gates
- `setup`: deterministic toolchain + lockfiles verified
- `quality`: lint/type/test all green
- `security`: secret scan + dependency audit accepted
- `release`: deployable artifact + runbook + env matrix complete
