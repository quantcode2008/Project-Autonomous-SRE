# SentinelAI: Architecture

Version 1.0 · 2026-10-16. Decisions referenced as D-xx live in `DECISIONS.md`.

## 1. System context

```
 Browser (Next.js, apps/web :3000)
        |  cookies (Better Auth session), JSON, SSE
        v
 Platform API (Express, apps/api :4000)  <--- only public gateway (D-03)
   | auth, users, projects, keys, quotas, admin, audit
   | internal HTTP + service token
   v
 Engine (FastAPI, services/engine 127.0.0.1:8000)  <--- ingest endpoint also accepts ingest keys
   | ingest, detection, agents, tools, sandbox, verification, delivery
   |--- Celery worker (same codebase) --- Redis (jobs + pub/sub)
   |--- PostgreSQL (schema platform | schema engine)
   |--- Local git mirrors + workspaces + artifacts (ENGINE_DATA_DIR)
   |--- Docker Engine (sandbox containers, no network)
   |--- LLM provider (Gemini / Anthropic / OpenAI / Ollama via adapter)
   '--- GitHub API (optional, scoped token, human-approved only)

 Monitored service (demo checkout service :5001) --> POST /ingest/v1/events (ingest key)
```

## 2. Services and responsibilities

| Service | Tech | Owns | Never does |
|---|---|---|---|
| **web** | Next.js (App Router), TypeScript, Tailwind, TanStack Query, React Flow, Recharts | UI, route protection, SSE consumption | Talk to the engine or DB directly |
| **api** | Express, TypeScript, Better Auth, Prisma, Zod, pino | Identity, sessions, roles, projects, repo connections, ingest keys, quotas, kill switch, audit, API gateway and SSE proxy, admin endpoints | Run agents, execute code, touch `engine.*` tables |
| **engine** | FastAPI, SQLAlchemy 2, Alembic, Celery, Redis, Docker SDK, httpx | Ingestion, detection, incidents, agents, tools, repo manager, sandbox, verification, delivery, memory | Authenticate end users, expose itself publicly |
| **shared** | Zod + TS | Shared enums, request/response schemas | Business logic |

## 3. Trust boundaries

1. **Internet to web/api:** session cookie, CORS restricted to `WEB_ORIGIN`, rate limits.
2. **api to engine:** `X-Internal-Token` (constant-time compare), `X-User-Id`, `X-Project-Id` set by the API after ownership verification. The engine binds to `127.0.0.1` and rejects requests without the token.
3. **Monitored service to engine ingest:** `Authorization: Bearer <ingest key>`; the key resolves to exactly one project.
4. **Engine to sandbox:** one-way. Sandboxes have no network, no host mounts, no secrets. Files go in and results come out via archive copy.
5. **Engine to LLM:** only redacted, size-capped context; model output is untrusted and schema-validated.
6. **Engine to GitHub:** only after a recorded approval, with a token scoped to one repository.

## 4. Runtime topology (local only, D-18)

| Process | Port | How it runs |
|---|---|---|
| web | 3000 | `npm run dev:web` |
| api | 4000 | `npm run dev:api` |
| engine | 8000 (127.0.0.1) | `npm run dev:engine` (Python venv on the host) |
| worker | n/a | `npm run dev:worker` (Celery) |
| postgres | 5432 | Docker Compose |
| redis | 6379 | Docker Compose |
| demo checkout service | 5001 | `uvicorn --reload` inside the demo repo |
| sandbox containers | n/a | created and destroyed by the engine through Docker |

The engine runs **on the host**, not in a container, so it can drive Docker without mounting the Docker socket into another container (D-07).

## 5. Data stores

- **PostgreSQL 16**, one database `sentinel`, two schemas: `platform` (Prisma) and `engine` (Alembic). Each service connects with `search_path` set to its own schema (D-04). Schemas are created by `infra/postgres/init.sql`.
- **Redis 7:** Celery broker/result backend and pub/sub channel `incident:{id}` for live events.
- **Filesystem (`ENGINE_DATA_DIR`):** `repos/<project_id>.git` (mirror clones), `workspaces/<incident_id>/{baseline,patched}`, `artifacts/<incident_id>/...` (logs, diffs, test output). Size caps and cleanup jobs apply.

## 6. Key flows

### 6.1 Sign-in and gateway
Web calls `POST /api/auth/sign-in/email`. Better Auth sets an httpOnly session cookie. All product calls go to `/api/v1/**` with `credentials: include`. The API resolves the session, checks role and disabled flag, verifies project ownership, then forwards to the engine with internal headers.

### 6.2 Ingestion and detection
1. Monitored service sends batches to `POST /ingest/v1/events`.
2. Engine validates, redacts, assigns fingerprints to failing events, stores rows in `engine.events` and `engine.deployments`.
3. A detector loop (every 15 s, guarded by a Postgres advisory lock) computes windowed error rates per (service, route). Over threshold with minimum volume: find or create an incident by fingerprint, link sample events, compute onset and correlated deployment, set severity.
4. If auto-investigate, kill switch off, and quota available, enqueue `investigate(incident_id)`.

### 6.3 Pipeline (details in `AGENT_SYSTEM.md`)
`DETECTED -> INVESTIGATING -> REPRODUCING -> REPAIRING -> VERIFYING -> AWAITING_APPROVAL -> PR_CREATED -> RESOLVED`, with `ESCALATED`, `FAILED`, `CANCELLED`, `DISMISSED` as exits. A deterministic orchestrator (code) moves between stages using guards. LLM agents run **inside** a stage with scoped tools and budgets. Planning is separated from tool execution: tools are plain functions that validate arguments, enforce permissions, and return structured results.

### 6.4 Live updates
Engine writes every activity to `engine.agent_events` (monotonic `seq`) and publishes it on Redis. The API's `GET /incidents/:id/stream` authenticates, replays missed events from the DB using `Last-Event-ID`, then relays live Redis events as SSE, with a heartbeat every 15 s (D-13).

### 6.5 Sandbox execution
1. Repo manager resolves the deployed commit and creates `baseline/` from the mirror (hooks disabled, no submodule recursion).
2. Dependency image is built once per requirements hash from `infra/runner/Dockerfile` (**network allowed only in this build step**, which is not agent-controlled).
3. Each sandbox run starts a fresh container from that image with: network disabled, memory/CPU/PID limits, read-only root filesystem, tmpfs workspace, `cap_drop=ALL`, `no-new-privileges`, non-root user, hard timeout.
4. Workspace files are copied in with a tar archive and results copied out; no bind mounts.
5. The replay harness imports the app (`app_import`) and sends the captured request through an in-process ASGI client, so no server or network is required (D-08).
6. Logs stream to Redis while running and are stored as artifacts when done.

### 6.6 Delivery
After approval, the publisher creates `sentinel/<short_id>-<slug>` in the repo mirror, commits the patch and regression test, and either (a) exports a `.patch` plus keeps the local branch (local mode) or (b) pushes the branch and opens a PR through the GitHub API using a token scoped to that repository. Nothing is merged.

## 7. Engine module layout

```
services/engine/app/
  main.py  worker.py  config.py
  api/            routers: ingest, internal (projects, incidents, metrics, flags), health
  core/           auth (internal token, ingest key), logging, redaction, errors, ids
  db/             models.py, session.py, migrations/ (alembic)
  ingest/         schemas, validators, fingerprinting, stack parser
  detection/      detector loop, severity, correlation
  incidents/      service, state machine, memory, graph builder
  orchestrator/   stage runner, guards, budgets, cancellation, events publisher
  llm/            adapter.py, providers/{gemini,anthropic,openai,ollama,fake}.py, usage
  agents/         telemetry_investigator, code_investigator, reproduction, fix, critic, prompts/
  tools/          registry.py, telemetry_tools.py, code_tools.py, sandbox_tools.py, workspace_tools.py, delivery_tools.py
  repo/           mirror manager, worktrees, git helpers
  sandbox/        docker_manager.py, images.py, harness/, sweeper.py
  verification/   gates.py, runners.py, risk.py, policy.py
  delivery/       local_branch.py, github.py, pr_template.py
tests/            unit, integration, e2e, fixtures/
```

## 8. API service module layout

```
apps/api/src/
  server.ts  app.ts  config/env.ts  logger.ts
  auth/           better-auth config, mailer interface (console mailer in dev)
  middleware/     requestId, requireAuth, requireRole, validate, rateLimit, errorHandler
  modules/        projects, repo, ingestKeys, incidents (proxy), telemetry (proxy), library, admin, me
  engine/         typed engine client (generated from engine OpenAPI), timeouts, retries
  sse/            stream relay (Redis subscribe + DB replay)
  audit/          audit log helper
  prisma/         schema.prisma, migrations
```

## 9. Web app route map

```
/                         landing (existing, GSAP + Lenis scenes)
/sign-in /sign-up /forgot-password /reset-password /verify-email
/app                      Command Center (project scoped)
/app/onboarding           project creation and connection wizard
/app/incidents            incident list
/app/incidents/[id]       Investigation Workspace
/app/library              Incident Library
/app/projects/[id]/settings
/app/settings             account
/admin/**                 later (Phase 8), ADMIN only
```
Route protection uses Next.js middleware (cookie presence) plus server-side session checks in layouts; the API is the real authority.

## 10. Cross-cutting concerns

- **Idempotency and resumability:** incidents carry a `version`; stage transitions use compare-and-swap. Celery tasks are retried safely; sandbox containers are labeled with the incident ID so a sweeper can reap orphans.
- **Budgets:** per agent run (tool calls), per incident (tokens, wall time), per user (daily investigations). Exhaustion escalates.
- **Cancellation:** cooperative flag checked between tool calls; running containers are killed.
- **Errors:** unified error body; engine errors mapped to API errors without leaking internals.
- **Observability:** pino and structlog JSON logs; request ID propagated api to engine in `X-Request-Id`.
- **Config:** one root `.env` (see `SETUP.md`), validated per service at startup.
- **Typing across services:** engine exposes OpenAPI; `openapi-typescript` generates the API's engine client types (`npm run gen:engine-types`). Web uses types from `packages/shared`.

## 11. Extension points (kept simple now)

| Seam | Today | Later |
|---|---|---|
| `JobQueue` interface | Celery + Redis | DB-backed runner or Temporal |
| `LLMProvider` interface | Gemini/Anthropic/OpenAI/Ollama/Fake | Multi-model routing and evaluation |
| `Mailer` interface | Console mailer | Resend/SES |
| `Storage` for artifacts | Local disk | Object store |
| `Delivery` interface | Local branch, GitHub PR | GitHub App, GitLab |
| Ingest format | Native JSON | OTLP adapter |
