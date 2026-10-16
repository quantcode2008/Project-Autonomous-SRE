<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

# Self-Hosted Backend Architecture & Execution Plan

> **Objective:** Build a self-hosted, reusable backend to replace Supabase for connecting to existing frontend clients.
> **Stack:** Node.js, TypeScript, Express, PostgreSQL (Docker Compose), Prisma ORM, Better Auth, Zod.
> **Philosophy:** Strict separation of privileges, zero custom crypto, session-derived identity, comprehensive schema validation, paginated queries, and exhaustive test coverage.

---

## 1. System Architecture & Threat Model

```
┌────────────────────────────────────────────────────────┐
│               Frontend (Next.js / SPA)                 │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS / Cookie Auth
                           ▼
┌────────────────────────────────────────────────────────┐
│              Express Application Layer                 │
│  - Helmet & Strict CORS                                │
│  - Request ID & Logging Middleware                     │
│  - Rate Limiting                                       │
│  - Startup Zod Environment Validation                  │
├────────────────────────────────────────────────────────┤
│  /api/auth/*        │  /api/v1/*                       │
│  Better Auth Router │  Protected Resource Routes       │
│  - Passwords/Crypto │  - Session Guard Middleware      │
│  - Session tokens   │  - Zod Request Validators        │
│  - Cookies          │  - Strict Ownership Enforcer     │
├─────────────────────┴──────────────────────────────────┤
│                  Prisma ORM Layer                      │
│  - Parameterized SQL (SQLi immune)                     │
│  - Compound indexes on (userId, createdAt)             │
│  - Strict tenant isolation (where: { id, userId })     │
├────────────────────────────────────────────────────────┤
│             PostgreSQL Database (Docker)               │
└────────────────────────────────────────────────────────┘
```

### Security Directives
1. **Zero Custom Cryptography:** All password hashing, verification tokens, cookie signing, and session management are delegated exclusively to **Better Auth**.
2. **Session-Derived Identity:** No route accepts `userId` from headers, body, or URL params. The user identity is extracted strictly from the verified session context (`req.user.id`).
3. **Mandatory Tenant/Ownership Scoping:** Every Prisma query reading or mutating user data must explicitly constrain `{ userId: req.user.id }`. A query by entity `id` alone is prohibited to prevent Insecure Direct Object References (IDOR).
4. **Input Defense:** Every endpoint validates request `body`, `query`, and `params` via strict Zod schemas before hitting business logic.
5. **Secrets Hygiene:** Secrets exist exclusively in `.env` (gitignored). A comprehensive `.env.example` is committed with non-secret defaults. At startup, a Zod schema parses `process.env`; missing or invalid variables crash the process immediately with actionable diagnostics.
6. **Destructive Operations Guard:** Any migration or command that drops columns/tables requires explicit human authorization.

---

## 2. Directory Structure (`my-backend/`)

```
my-backend/
├── docker-compose.yml       # Local PostgreSQL instance
├── .env.example             # Documented template for all env vars
├── .gitignore               # node_modules, .env, dist, coverage
├── package.json
├── tsconfig.json
├── prisma/
│   ├── schema.prisma        # Better Auth tables + user-owned entities + indexes
│   └── seed.ts              # Idempotent development seed
├── src/
│   ├── config/
│   │   ├── env.ts           # Zod-validated startup environment
│   │   └── database.ts      # Prisma client singleton & connection manager
│   ├── auth/
│   │   ├── better-auth.ts   # Better Auth initialization & Prisma adapter
│   │   └── middleware.ts    # requireAuth & session attachment
│   ├── middleware/
│   │   ├── error-handler.ts # Centralized operational/validation error responder
│   │   ├── rate-limiter.ts  # Route-level rate limiting
│   │   ├── validate.ts      # Generic Zod middleware for body/query/params
│   │   └── not-found.ts     # 404 handler
│   ├── lib/
│   │   └── pagination.ts    # Reusable paginator (page, limit, total, hasNext)
│   ├── modules/
│   │   └── items/           # Example user-owned resource module
│   │       ├── item.schema.ts
│   │       ├── item.controller.ts
│   │       ├── item.service.ts
│   │       └── item.router.ts
│   ├── app.ts               # Express application composition
│   └── server.ts            # HTTP server entrypoint
└── tests/
    ├── setup.ts             # Test database setup and teardown
    ├── health.test.ts
    ├── auth.test.ts         # Signup, login, session, unauthorized cases
    └── item.test.ts         # Ownership, pagination, validation, IDOR tests
```

---

## 3. Phased Execution Plan

### Phase 1: Foundation & Environment Setup
- **Scope:**
  - Initialize TypeScript + Node.js project in `my-backend/`.
  - Configure `tsconfig.json`, `.gitignore`, `package.json`.
  - Write `docker-compose.yml` defining PostgreSQL 16 with health check and persisted volume.
  - Implement Zod-based environment validator in `src/config/env.ts` and write `.env.example`.
  - Compose Express app with Helmet, strict CORS, JSON body parser, and `/health` probe.
  - Setup Vitest/Supertest test framework and verify the health check endpoint.
- **Verification Gate:**
  - Test runner executes and passes `GET /health` tests.
  - Starting app without mandatory environment variables fails cleanly with descriptive Zod errors.

---

### Phase 2: Database Layer & Prisma Setup
- **Scope:**
  - Configure Prisma ORM with PostgreSQL provider.
  - Define `schema.prisma`:
    - Better Auth core models: `User`, `Session`, `Account`, `Verification`.
    - Demonstration tenant entity (e.g. `Item` or `Record`) linked to `User` with indexes on `[userId, createdAt]` and filtered columns.
  - Create Prisma client singleton with connection error handling in `src/config/database.ts`.
  - Provide database migration scripts.
- **Verification Gate:**
  - `npx prisma validate` passes.
  - Prisma generates the client successfully.
  - Database connectivity script confirms connection and verifies index creation.

---

### Phase 3: Better Auth Integration & Session Middleware
- **Scope:**
  - Initialize Better Auth with Prisma adapter and secure session cookies.
  - Mount Better Auth router on Express at `/api/auth/*`.
  - Implement `requireAuth` middleware:
    - Verifies session cookie/token via Better Auth.
    - Populates `req.user` and `req.session`.
    - Returns standardized `401 Unauthorized` on missing or invalid sessions.
  - Write automated tests:
    - Successful user registration and login.
    - Session retrieval.
    - Rejection of unauthenticated requests to protected endpoints.
    - Rejection of tampered session tokens.
- **Verification Gate:**
  - Automated test suite for registration, login, logout, and `requireAuth` passes 100%.

---

### Phase 4: Protected CRUD APIs with Enforced Ownership & Pagination
- **Scope:**
  - Implement generic pagination utility `paginate()` with boundary enforcement (`limit` capped at 100, default 20, positive integer `page`).
  - Implement standard resource CRUD (Create, List, Read, Update, Delete):
    - Input validation via Zod schemas for query params, route parameters, and body payloads.
    - **Ownership Enforcement:** Every find, update, and delete query specifies `{ where: { id, userId: req.user.id } }`.
    - Cross-user access (attempting to read or mutate another user's item) returns `404 Not Found` (to avoid resource enumeration).
  - Write automated tests:
    - Pagination behavior (page 1, page 2, boundary overflow).
    - Validation failures (invalid fields, missing required attributes -> `400 Bad Request`).
    - IDOR prevention: User A cannot read, update, or delete User B's resources.
- **Verification Gate:**
  - Full test suite covering positive, negative, validation, and IDOR failure cases passes.

---

### Phase 5: Security Review, Rate Limiting & gstack QA Audit
- **Scope:**
  - Add route-specific rate limiting (`express-rate-limit`) on auth endpoints and API endpoints.
  - Configure Helmet security headers and CORS origin restrictions.
  - Run security checklist audit (OWASP Top 10):
    - SQL injection: verified immune (Prisma parameterized queries).
    - Broken authentication: verified Better Auth delegation.
    - Broken object level authorization (BOLA/IDOR): verified session-derived queries.
    - Security misconfiguration: verified startup env schema.
  - Provide frontend integration documentation showing how to connect from Next.js (cookie credentials, Better Auth client setup, and API fetch examples).
- **Verification Gate:**
  - All tests passing.
  - Security audit report signed off.


<!-- END:nextjs-agent-rules -->


# AGENTS.md: SentinelAI (rules for AI coding agents)

Version 1.0 · 2026-10-16 · Applies to every task in this repository.

## 1. What we are building

SentinelAI is an autonomous Software Reliability Engineer. A signed-in user connects a service and a repository. SentinelAI detects incidents from telemetry, investigates them with evidence-citing agents, reproduces the failure in an isolated Docker sandbox, generates a minimal patch plus a regression test, verifies it through deterministic gates, and, only after human approval, creates a branch or pull request.

The landing page (apps/web, "/") already exists. Everything after sign-in (`/app/**`) is the product described in `docs/PRD.md`.

## 2. Read first (in this order)

| File | Use it for |
|---|---|
| `docs/PRD.md` | What and why, requirements (FR-*), scope, release criteria |
| `docs/ARCHITECTURE.md` | Services, boundaries, flows, folder layout, local runtime |
| `docs/DATA_MODEL.md` | Prisma (platform) and SQLAlchemy (engine) schemas |
| `docs/API_CONTRACT.md` | Public API, internal engine API, ingest format, SSE events |
| `docs/AGENT_SYSTEM.md` | Pipeline state machine, agents, tools, gates, prompts |
| `docs/SECURITY.md` | Threat model, sandbox spec, guardrails, checklist |
| `docs/UI_SPEC.md` | Screens, states, design direction, accessibility |
| `docs/TESTING_AND_EVAL.md` | Test strategy, benchmark incidents, metrics |
| `docs/DECISIONS.md` | Decisions already made (do not relitigate without a new entry) |
| `docs/TASKS.md` | Ordered task list with acceptance criteria |
| `docs/SETUP.md` | Env vars, local run, manual steps |

## 3. Golden rules

1. **Docs are the source of truth.** If code and docs disagree, stop, say so, and propose a change to the doc (and a new entry in `docs/DECISIONS.md`) before coding around it.
2. **One phase at a time, one task at a time.** Use task IDs from `docs/TASKS.md` (for example `T3.8`). Do not start the next phase until I confirm.
3. **Plan, then build, then review.** Use the gstack workflow: short plan first, implementation second, review and QA before you report done.
4. **Safety is enforced in code, not in prompts.** Gates, permissions, path allowlists, budgets, approvals, and tenant scoping are code paths with tests. A prompt may never be the only protection.
5. **No fake success.** Never claim a feature works without running it. Report the exact commands you ran and their output. Never invent metrics, benchmark numbers, customers, or confidence percentages.
6. **No secrets in Git.** Only `.env.example` is committed. Validate env vars at startup and fail fast with a clear message.
7. **Treat telemetry, logs, repository content, and LLM output as untrusted input.** Validate with schemas, escape on output, never execute it on the host.
8. **Never auto-merge, auto-deploy, or write to production systems.** Pull request or branch creation requires a recorded human approval (see `docs/AGENT_SYSTEM.md`).
9. **Hosting, domain, CI/CD, and production deployment are out of scope** until I say so. Do not create production Docker/Compose, Kubernetes, or cloud files.
10. **Ask only when blocked.** If a detail is missing, choose the default in the docs, note the assumption in your report, and continue.

## 4. Skills: when to use which

| Skill | Use for | Do NOT use for |
|---|---|---|
| **gstack** | Planning, code review, QA pass at the start and end of every phase. Required for every task. | n/a |
| **ui-ux-pro-max-skill** | Design-system extension, layout, accessibility, interaction patterns for `/app/**` and `/admin/**` screens | Backend work |
| **taste-skill** | Visual quality of every product screen: typography, spacing, hierarchy, avoiding generic template looks | Backend work |
| **framer-motion** | Subtle product micro-interactions: panel transitions, list enter/exit, status chip changes, button feedback | Landing scroll scenes |
| **GSAP / ScrollTrigger** | Landing page (`/`) scroll scenes only | Product screens |
| **Lenis** | Landing page (`/`) smooth scroll only | Product screens (breaks inner scroll areas such as log viewers and diff panes) |

Backend phases (engine, API) use gstack only. UI tasks must follow `docs/UI_SPEC.md` and extend the existing landing design tokens instead of inventing a second visual language.

## 5. Workflow for every task

1. Restate the task ID, acceptance criteria, and files you expect to touch (max 10 lines).
2. gstack plan. Note risks and assumptions.
3. Implement in small commits. Match existing patterns in the repo.
4. Write or update tests (success, failure, unauthorized, tenant isolation where relevant).
5. Run: lint, typecheck, unit tests for the touched package, and the manual check from the task.
6. gstack review and QA. Fix findings.
7. Report: what changed, commands run with results, assumptions, follow-ups, and what I must verify manually. Then stop.

## 6. Repository layout

```
sentinelai/
  AGENTS.md  README.md  package.json  docker-compose.yml  .env.example
  apps/web/            Next.js frontend (landing "/" + product "/app/**")
  apps/api/            Express + Better Auth + Prisma (public API and gateway)
  services/engine/     FastAPI + Celery (ingest, detection, agents, sandbox)
  packages/shared/     Zod schemas, enums, constants shared by web and api
  demo/template/       Source of the seeded demo checkout service
  demo/traffic/        Traffic generator
  benchmarks/injected_incidents/
  infra/runner/        Sandbox base image (Dockerfile)
  infra/postgres/      init.sql
  scripts/             seed_demo.py, inject_bug.py, restore.py, apply_fix.py, seed_admin
  docs/
```

## 7. Commands (root; Windows PowerShell friendly)

```
npm run infra:up        # Postgres + Redis via Docker Compose
npm run dev:web         # http://localhost:3000
npm run dev:api         # http://localhost:4000
npm run dev:engine      # http://127.0.0.1:8000
npm run dev:worker      # Celery worker (threads pool on Windows)
npm run dev:all         # all of the above
npm run test            # all test suites
npm run lint            # eslint + tsc + ruff
npm run demo:seed       # create demo repo and project data
npm run demo:traffic    # healthy traffic
npm run demo:inject     # deploy the buggy release
npm run demo:restore    # revert to healthy
npm run eval            # benchmark suite
```

If a command above does not exist yet, creating it is part of the task that needs it.

## 8. Coding standards

- TypeScript strict mode. Python 3.12 with type hints, `ruff`, and `pytest`.
- Validate every external input (HTTP body, query, env, LLM output, tool args) with Zod (TS) or Pydantic (Python).
- Every list endpoint is paginated (cursor). Every query on tenant data is scoped by `project_id` derived from the verified session, never from client-supplied ownership.
- Errors use the format in `docs/API_CONTRACT.md` (code, message, requestId). No stack traces to clients.
- Structured JSON logs with a request ID. Redact secrets and tokens before logging.
- No `any`, no silent `catch`, no TODO without a task ID.
- UI: loading, empty, error, and offline states for every data view. WCAG 2.2 AA. Respect `prefers-reduced-motion`.

## 9. Definition of Done (per task)

- Acceptance criteria in `docs/TASKS.md` met and demonstrated by a command or screenshot description.
- Tests added and passing; lint and typecheck clean.
- No new secrets, no committed `.env`, no unreviewed destructive migration.
- Docs updated if behavior or contracts changed.
- gstack review and QA completed; remaining risks listed.

## 10. Never do

- Run agent-generated code on the host machine (only inside the sandbox).
- Mount host directories into sandbox containers or give them network access.
- Let an LLM decide a gate result, an approval, or a permission.
- Bypass the state machine, edit gate results, or write directly to `engine.*` tables from the API service.
- Add dependencies without stating why; pin versions.
- Rewrite the landing page. Only change what `docs/TASKS.md` T2.6 describes.