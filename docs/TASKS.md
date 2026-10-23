# SentinelAI: Tasks

Version 1.0 · 2026-10-16. Work in phase order. Mark `[x]` only when the acceptance criteria are demonstrated. Each task: **ID, description, acceptance**. Skills: **G** = gstack (always), **UX** = ui-ux-pro-max-skill, **T** = taste-skill, **FM** = framer-motion.

Hosting, domain, CI/CD, and production deployment are **out of scope** (see the end).

---

## Phase 0: Workspace and tooling

- [x] **T0.1** Create the monorepo layout from `AGENTS.md` section 6 with npm workspaces and root scripts (`dev:*`, `test`, `lint`, `infra:*`). *Accept:* `npm install` succeeds; `npm run lint` runs (even if empty).
- [x] **T0.2** Move the existing frontend into `apps/web`. *Accept:* landing page at `/` looks and behaves exactly as before; no visual change.
- [x] **T0.3** `docker-compose.yml` with Postgres 16 and Redis 7 (volumes, healthchecks) and `infra/postgres/init.sql` creating schemas `platform` and `engine`. *Accept:* `npm run infra:up` then both services report healthy; both schemas exist.
- [x] **T0.4** `.env.example` covering all variables in `SETUP.md`; env validation helpers in api and engine. *Accept:* missing or invalid variable stops startup with a clear message.
- [x] **T0.5** `packages/shared` scaffold (Zod schemas, enums for statuses/severity/roles). *Accept:* imported by web and api builds.
- [x] **T0.6** Engine scaffold: Python 3.12 venv instructions, pinned requirements, FastAPI app with `/health` and `/ready`, ruff, pytest. *Accept:* `npm run dev:engine` serves `/health` on 127.0.0.1:8000; one test passes.
- [x] **T0.7** Lint, format, typecheck configs (eslint, prettier, tsc strict, ruff). *Accept:* `npm run lint` passes on a clean tree.
- [x] **T0.8** `README.md` quickstart and `npm run dev:all`. *Accept:* a fresh clone follows the README to all processes running.

**Exit:** all infrastructure and four processes start; landing unchanged.

---

## Phase 1: Platform API, auth, projects

- [x] **T1.1** Express skeleton: helmet, CORS (WEB_ORIGIN, credentials), request ID, pino logging, Zod `validate` middleware, error handler (format in `API_CONTRACT.md`), rate-limit middleware, `/health`, `/ready`. *Accept:* unit tests for error format and validation.
- [x] **T1.2** Prisma schema per `DATA_MODEL.md` and first migration in schema `platform`. *Accept:* `prisma migrate dev` works; tables exist.
- [x] **T1.3** Better Auth integration (email/password, verification, reset, cookie sessions) using Better Auth's Express handler mounted before `express.json()`; console mailer prints links in dev. *Accept:* sign up, verify via console link, sign in, sign out, reset password all work against the running API.
- [x] **T1.4** Roles, disabled flag, `requireAuth`, `requireRole`; disabled users are blocked at sign-in and on every request. *Accept:* tests for 401, 403, disabled user with an active session.
- [x] **T1.5** Audit log helper and table; record auth, project, key, flag, and admin actions. *Accept:* rows appear with redacted metadata.
- [x] **T1.6** Projects CRUD with ownership scoping and settings schema validation; unknown or unowned returns 404. *Accept:* cross-tenant tests pass.
- [x] **T1.7** Repo connection with encrypted token (AES-256-GCM), allowlisted repo locations, and verify endpoint (via engine). *Accept:* token never returned; invalid URL rejected.
- [x] **T1.8** Ingest keys: create (shown once), list (prefix only), revoke; sync hash to engine. *Accept:* plaintext appears only in the create response; revoked key stops working at ingest (after T3.2).
- [x] **T1.9** Typed engine client (generated from engine OpenAPI via `npm run gen:engine-types`), internal token, timeouts, retries, error mapping, `X-Request-Id` propagation. *Accept:* contract test against a stub engine.
- [x] **T1.10** Kill switch and per-user quota plumbing (flag push to engine, usage read). *Accept:* admin toggle returns 503 `PAUSED` on `investigate`; quota exceeded returns 429.
- [x] **T1.11** Admin endpoints (users, role, disable, quota, audit logs, stats, flags) with last-admin protection. *Accept:* non-admin gets 403 everywhere.
- [x] **T1.12** `npm run seed:admin -- <email>` to promote an existing user to ADMIN. *Accept:* promoted user can call admin endpoints.
- [x] **T1.13** Test suite: auth failures, validation, ownership, roles, rate limits. *Accept:* `npm run test -w apps/api` green.

**Exit:** a user can sign up, sign in, create a project, connect a repo, and mint an ingest key through the API.

---

## Phase 2: Web app shell and onboarding (UX, T, FM)

- [ ] **T2.1** Design-system extension: read the landing tokens, run ui-ux-pro-max, produce `apps/web/docs/design-tokens.md` (palette, status colors, type scale, spacing, radii, motion). Show it for approval before coding screens. *Accept:* approved by user.
- [ ] **T2.2** API client, Better Auth client, TanStack Query provider, 401/503 handlers, typed hooks. *Accept:* expired session redirects to sign-in with a return URL.
- [ ] **T2.3** Auth screens per `UI_SPEC.md` 4.1 and route protection (middleware plus server checks). *Accept:* e2e: sign up, verify (console link), sign in, sign out.
- [ ] **T2.4** App shell (nav, project switcher, account menu, paused banner), responsive. *Accept:* works at 375, 768, 1280.
- [ ] **T2.5** Onboarding wizard with demo path, custom repo path, ingest key reveal, LLM data-disclosure notice, and live connection check. *Accept:* wizard completes and shows "Waiting for first event".
- [ ] **T2.6** Landing page integration only: primary CTAs and nav link go to `/sign-up` and `/sign-in`; remove any email-waitlist form; do not alter scenes or effects. *Accept:* landing visually unchanged except CTA targets.
- [ ] **T2.7** Project settings page and account settings. *Accept:* settings persist and validate.
- [ ] **T2.8** Empty, loading, and error states for all views so far. *Accept:* visible in a storybook-like checklist or manual script.
- [ ] **T2.9** Playwright e2e for sign-up to project creation. *Accept:* passes headless.

**Exit:** user flow from landing to an empty Command Center works.

---

## Phase 3: Engine foundation, ingestion, detection, demo (Proposal Phase 1)

- [ ] **T3.1** Engine DB: SQLAlchemy models and Alembic migrations for projects, ingest_keys, events, deployments, incidents, incident_signals, usage_daily, flags (rest added per phase). *Accept:* migrations apply and roll back.
- [ ] **T3.2** Internal auth dependency (token + tenant headers), project mirror upsert, ingest key validation (hash, prefix, revoked). *Accept:* tests for missing/invalid token and cross-project access.
- [ ] **T3.3** `POST /ingest/v1/events`: schema validation, size and rate limits, redaction, fingerprinting, stack parsing, partial acceptance. *Accept:* fixtures pass; redaction verified.
- [ ] **T3.4** Demo service template (`demo/template/`): FastAPI checkout service, pricing module with promotion handling, orders, tax, about 12 pytest tests passing on healthy and buggy versions, `sentinel_client.py` middleware and handler. *Accept:* `pytest` green; service runs on 5001.
- [ ] **T3.5** Scripts: `seed_demo.py` (nested git repo, healthy history, project registration instructions), `inject_bug.py` (commit the BM-01 bug and send a deploy event), `restore.py`, `apply_fix.py` (merge the SentinelAI branch locally and send a deploy event), and `demo/traffic` generator (`--bad-ratio`, `--rps`). *Accept:* idempotent; inject then traffic produces 500s in the service.
- [ ] **T3.6** Deployment events API and storage. *Accept:* deployments listed and linked to incidents.
- [ ] **T3.7** Metrics queries (rate, error rate, p50/p95, buckets) and logs query with filters. *Accept:* p95 under 500 ms on a 7-day synthetic dataset.
- [ ] **T3.8** Detector loop (advisory lock, windowed error rate, fingerprint grouping, severity, onset, deployment correlation, dedupe, auto-resolve rule). *Accept:* one incident per fault; attaches later signals; unit tests with synthetic events.
- [ ] **T3.9** API proxy routes: overview, metrics, logs, deployments, incident list/detail, connection-status. *Accept:* ownership enforced; contract tests pass.
- [ ] **T3.10** Command Center UI (KPIs, chart with deployment markers and table alternative, incident list, deployments, demo card). *Accept:* live data from the demo; keyboard accessible.
- [ ] **T3.11** Retention job and ingest rate-limit tests; ingest throughput test with k6 (report the measured number). *Accept:* report committed.

**Exit:** `demo:seed`, `demo:traffic`, `demo:inject` produce exactly one grouped incident visible in the UI.

---

## Phase 4: Investigation (Proposal Phase 2)

- [ ] **T4.1** LLM adapter with Gemini, Anthropic, OpenAI, Ollama, and `fake` providers; usage tracking; deadline and cancellation; output schema validation with one repair attempt. *Accept:* provider contract tests; fake provider drives scripted runs.
- [ ] **T4.2** Tool framework: registry, JSON-schema validation, per-agent allowlists, redaction, `tool_calls` logging, result caps. *Accept:* denied calls are logged and counted.
- [ ] **T4.3** Repo manager: mirror clone with hooks disabled, SHA checkout, worktrees, size/time limits, allowlisted locations. *Accept:* clones the demo repo; rejects disallowed URLs.
- [ ] **T4.4** Code tools: `list_files`, `read_file`, `search_code` (rg with Python fallback), `git_log`, `git_diff`. *Accept:* path traversal and size-cap tests pass.
- [ ] **T4.5** Telemetry tools: `search_logs`, `query_metrics`, `inspect_trace`, `list_deployments`. *Accept:* tenant scoping tests pass.
- [ ] **T4.6** Stack parser and frame-to-file mapping at the deployed SHA. *Accept:* maps the demo traceback to `app/pricing.py`.
- [ ] **T4.7** Evidence and hypothesis services: ID validation, rule-based confidence labels. *Accept:* hallucinated IDs rejected; label rules tested.
- [ ] **T4.8** Orchestrator and Celery tasks (investigate stage), budgets, cancellation, state machine with compare-and-swap, `JobQueue` interface. *Accept:* illegal transitions rejected; cancel works mid-run.
- [ ] **T4.9** Telemetry and Code Investigator agents with prompts from `AGENT_SYSTEM.md`. *Accept:* with a real model, BM-01 yields a top hypothesis citing the deployment diff and `calculate_price`.
- [ ] **T4.10** `agent_events` persistence, Redis pub/sub, API SSE relay with `Last-Event-ID` replay. *Accept:* reconnect resumes without duplicates.
- [ ] **T4.11** Workspace UI: header, stage stepper, Activity Feed, Timeline, Evidence, Hypotheses tabs (UX, T, FM). *Accept:* live updates while an investigation runs.
- [ ] **T4.12** Tests: scripted fake-LLM investigation, injection fixtures, budget exhaustion, tenant isolation on SSE. *Accept:* all pass.

**Exit:** the seeded incident gets a cited, ranked investigation visible live in the UI.

---

## Phase 5: Reproduction (Proposal Phase 3)

- [ ] **T5.1** Runner image (`infra/runner/Dockerfile`) and dependency-image builder keyed by requirements hash. *Accept:* second build is a cache hit.
- [ ] **T5.2** Docker sandbox manager with all controls from `SECURITY.md` section 3, archive copy in/out, log streaming, sweeper. *Accept:* sandbox security tests pass.
- [ ] **T5.3** Failing request sample capture and selection (redacted, capped). *Accept:* samples stored only when enabled.
- [ ] **T5.4** Replay harness and `replay_request` tool. *Accept:* reproduces BM-01 on baseline with the expected signature.
- [ ] **T5.5** Reproduction Agent and `write_test_file` constraints. *Accept:* generated test fails on baseline for the right reason.
- [ ] **T5.6** Failure-signature matcher and G1 (3/3 deterministic) enforcement in the orchestrator. *Accept:* wrong-failure and flaky cases do not pass.
- [ ] **T5.7** Non-reproducible path: escalate with explanation. *Accept:* BM fixture with an unreproducible fault ends `ESCALATED`.
- [ ] **T5.8** Reproduction tab UI (sample, runs, signature chip, test code). *Accept:* matches `UI_SPEC.md`.
- [ ] **T5.9** Integration tests with Docker. *Accept:* green on Windows Docker Desktop.

**Exit:** BM-01 is reproduced deterministically and repair is impossible without it.

---

## Phase 6: Repair, verification, approval, delivery (Proposal Phase 4)

- [ ] **T6.1** Fix Agent, `edit_workspace` with policy enforcement (paths, size, protected files, no dependency changes). *Accept:* policy tests block violations.
- [ ] **T6.2** Verifier: gates G1-G8, baseline-versus-patched comparison for suite, lint (ruff), security (bandit). *Accept:* each gate has pass and fail fixtures.
- [ ] **T6.3** Critic agent, classification matrix, fix-critic loop controller. *Accept:* introduced regression returns to the Fix Agent; loop limit escalates.
- [ ] **T6.4** Risk review generator (deterministic facts plus capped summary). *Accept:* includes changed paths, interface changes, warnings, rollback note.
- [ ] **T6.5** Approval and rejection API with all rules from `API_CONTRACT.md` 6, engine re-validation, audit rows. *Accept:* every invalid approval returns 422 with the right reason.
- [ ] **T6.6** Delivery: local branch plus `.patch` export; GitHub PR via fine-grained token; fixed PR template. *Accept:* branch and patch created in the demo repo; PR path tested against a test repo when a token exists.
- [ ] **T6.7** Incident memory on terminal states; auto-resolve after fix. *Accept:* `apply_fix` then `restore` leads to RESOLVED.
- [ ] **T6.8** Patch, Verification, and Approval UI plus PR result card (UX, T, FM). *Accept:* full review flow works.
- [ ] **T6.9** End-to-end test (fake LLM) from inject to approved local branch, plus a documented manual run with a real model. *Accept:* BM-01 completes end to end.

**Exit:** the full demo scenario works from the UI.

---

## Phase 7: Advanced layer and evaluation (Proposal Phase 5)

- [ ] **T7.1** Root-cause graph builder, API, and React Flow UI with list alternative (UX, T, FM). *Accept:* every edge links to evidence.
- [ ] **T7.2** Incident Library with full-text and fingerprint similarity; "similar incidents" panel. *Accept:* BM-01 recurrence finds the earlier case.
- [ ] **T7.3** Benchmark harness and BM-01 to BM-03 (BM-04, BM-05 if time) and `npm run eval` with JSON and Markdown reports. *Accept:* report with real numbers over at least 3 runs each.
- [ ] **T7.4** Cost, token, and time counters per incident in UI. *Accept:* matches DB values.
- [ ] **T7.5** Demo polish: pre-flight script, deterministic seed, demo script checklist, recorded fallback run. *Accept:* three consecutive clean demo runs.
- [ ] **T7.6** (Stretch) Multi-model comparison through the eval harness. *Accept:* table of models on the same incidents.

**Exit:** benchmark report exists and the demo is repeatable.

---

## Phase 8: Admin UI and hardening

- [ ] **T8.1** Admin UI: users, quotas, kill switch, audit logs, stats (UX, T). *Accept:* ADMIN only; destructive actions confirmed.
- [ ] **T8.2** Security pass using the `SECURITY.md` checklist; fix findings. *Accept:* checklist fully checked.
- [ ] **T8.3** Accessibility pass (axe, keyboard, reduced motion) on all core screens. *Accept:* no critical issues.
- [ ] **T8.4** Performance pass: Lighthouse on landing, dashboard query timing, ingest throughput. *Accept:* measured numbers recorded in `docs/PERFORMANCE.md`.
- [ ] **T8.5** Dependency audit (`npm audit`, `pip-audit`), pinned versions, documentation refresh, final README, demo video script. *Accept:* release criteria in `PRD.md` section 10 met.

---

## Deferred (do not start)

Hosting and domain, production Docker/Compose, CI/CD, HTTPS and reverse proxy, managed database, real email provider, off-machine backups, GitHub App flow, OTLP ingest, pgvector, additional languages, Temporal, light theme, bring-your-own-key, billing.
