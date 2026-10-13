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
