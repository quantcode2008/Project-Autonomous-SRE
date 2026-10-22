# SentinelAI: Data Model

Version 1.0 · 2026-10-16. One PostgreSQL 16 database (`sentinel`), two schemas. Cross-schema foreign keys are **not** used; the engine keeps its own project mirror (D-04).

## 1. Conventions

- IDs: `cuid` strings in `platform`; `uuid` in `engine` (except `events` and `agent_events`, which use `bigserial`).
- Timestamps: `timestamptz`, UTC, `created_at` and `updated_at` everywhere applicable.
- Soft delete only for `projects` (`deleted_at`); deletion also schedules engine data purge.
- Every engine row that belongs to a tenant carries `project_id` and every query filters on it.
- Enums are stored as text with CHECK constraints (engine) or Prisma enums (platform).
- Free-form `jsonb` columns are validated by Pydantic/Zod before write.

## 2. Platform schema (Prisma, `apps/api/prisma/schema.prisma`)

Better Auth tables are generated with its CLI, then extended with the additional fields below.

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql" url = env("DATABASE_URL") } // ends with ?schema=platform

enum Role { USER ADMIN }
enum RepoProvider { LOCAL GITHUB }
enum ProjectKind { DEMO CUSTOM }

model User {                      // Better Auth core + additional fields
  id            String   @id
  name          String
  email         String   @unique
  emailVerified Boolean  @default(false)
  image         String?
  role          Role     @default(USER)
  disabled      Boolean  @default(false)
  dailyInvestigationQuota Int @default(5)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  sessions      Session[]
  accounts      Account[]
  projects      Project[]
}

model Session {                   // Better Auth
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([userId])
}

model Account {                   // Better Auth (credentials and future social)
  id         String  @id
  accountId  String
  providerId String
  userId     String
  user       User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  password   String?
  accessToken String?
  refreshToken String?
  idToken    String?
  accessTokenExpiresAt DateTime?
  refreshTokenExpiresAt DateTime?
  scope      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@index([userId])
}

model Verification {              // Better Auth
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@index([identifier])
}

model Project {
  id         String      @id @default(cuid())
  ownerId    String
  owner      User        @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  name       String
  slug       String
  kind       ProjectKind @default(CUSTOM)
  language   String      @default("python")
  settings   Json        // validated by ProjectSettingsSchema (see section 4)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  deletedAt  DateTime?
  repo       RepoConnection?
  ingestKeys IngestKey[]
  @@unique([ownerId, slug])
  @@index([ownerId, deletedAt])
}

model RepoConnection {
  id            String       @id @default(cuid())
  projectId     String       @unique
  project       Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  provider      RepoProvider
  location      String       // local path (demo) or https GitHub URL
  defaultBranch String       @default("main")
  tokenEnc      String?      // AES-256-GCM, base64(iv|tag|ciphertext); never returned by the API
  tokenLast4    String?
  verifiedAt    DateTime?
  lastError     String?
  updatedAt     DateTime     @updatedAt
}

model IngestKey {
  id         String    @id @default(cuid())
  projectId  String
  project    Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name       String
  prefix     String    // first 8 chars, displayable
  hash       String    // sha256 of the full key; plaintext shown once at creation
  createdAt  DateTime  @default(now())
  lastUsedAt DateTime?
  revokedAt  DateTime?
  @@index([projectId])
  @@index([prefix])
}

model AuditLog {
  id         String   @id @default(cuid())
  actorId    String?
  action     String   // e.g. auth.sign_in, project.create, key.create, incident.approve
  targetType String?
  targetId   String?
  projectId  String?
  metadata   Json?    // redacted
  ip         String?
  createdAt  DateTime @default(now())
  @@index([actorId, createdAt])
  @@index([projectId, createdAt])
  @@index([action, createdAt])
}

model SystemFlag {
  key       String   @id          // e.g. investigations_paused
  value     Json
  updatedBy String?
  updatedAt DateTime @updatedAt
}
```

Notes: investigation usage counters live in the engine (`engine.usage_daily`) because the engine starts investigations automatically; the API reads them for display and admin.

## 3. Engine schema (Alembic, `services/engine`)

### 3.1 Enumerations

| Name | Values |
|---|---|
| `event_type` | LOG, SPAN, REQUEST |
| `severity` | SEV1, SEV2, SEV3 |
| `incident_status` | DETECTED, INVESTIGATING, REPRODUCING, REPAIRING, VERIFYING, AWAITING_APPROVAL, PR_CREATED, RESOLVED, ESCALATED, FAILED, CANCELLED, DISMISSED |
| `evidence_kind` | LOG_RANGE, TRACE, METRIC, DEPLOY_DIFF, CODE_LOCATION, SANDBOX_RUN, TEST_RESULT, SCAN_RESULT |
| `hypothesis_status` | PROPOSED, SUPPORTED, REFUTED, CONFIRMED |
| `confidence_label` | LOW, MEDIUM, HIGH |
| `sandbox_kind` | DEPENDENCY_BUILD, BASELINE_REPRO, PATCHED_REPRO, REGRESSION_BASELINE, REGRESSION_PATCHED, SUITE_BASELINE, SUITE_PATCHED, LINT_BASELINE, LINT_PATCHED, SECURITY_BASELINE, SECURITY_PATCHED, CRITIC_BASELINE, CRITIC_PATCHED |
| `run_status` | QUEUED, RUNNING, PASSED, FAILED, TIMEOUT, ERROR, CANCELLED |
| `gate_status` | PASSED, FAILED, WARNING, SKIPPED |
| `verification_overall` | PASSED, PASSED_WITH_WARNINGS, FAILED |
| `delivery_mode` | LOCAL, GITHUB |
| `memory_outcome` | RESOLVED, ESCALATED, DISMISSED, FAILED |

### 3.2 Tables

**projects** (mirror; upserted by API via `PUT /internal/projects/{id}`)
`project_id text PK`, `owner_id text`, `name`, `language`, `repo_provider`, `repo_location`, `default_branch`, `repo_token_enc text null`, `settings jsonb`, `owner_daily_quota int`, `created_at`, `updated_at`, `deleted_at`.

**ingest_keys**: `key_id text PK`, `project_id`, `prefix`, `hash`, `revoked_at`, `last_used_at`. Index `(prefix)`, `(project_id)`.

**events** (high volume)
`id bigserial PK`, `project_id`, `ts timestamptz`, `type event_type`, `service`, `level text null`, `method text null`, `route text null`, `status_code int null`, `duration_ms int null`, `trace_id text null`, `span_id text null`, `parent_span_id text null`, `name text null` (span name), `message text null`, `exception_type text null`, `exception_message text null`, `stack jsonb null` (parsed frames: file, line, function, in_app), `fingerprint text null`, `attrs jsonb`, `request_sample jsonb null` (redacted, failing requests only), `ingested_at`.
Indexes: `(project_id, ts desc)`, `(project_id, trace_id)`, `(project_id, fingerprint, ts desc)`, `(project_id, service, route, ts desc)`, partial index on `(project_id, ts)` where `status_code >= 500`.
Retention job deletes rows older than the project setting (default 7 days).

**deployments**: `id uuid PK`, `project_id`, `service`, `commit_sha`, `ref`, `message`, `author`, `ts`. Index `(project_id, service, ts desc)`.

**incidents**
`id uuid PK`, `project_id`, `seq int` (per-project counter), `short_id text` (e.g. `INC-0007`, unique per project), `title`, `fingerprint`, `service`, `route`, `severity`, `status`, `stage_started_at`, `detected_at`, `onset_at`, `resolved_at null`, `error_rate numeric`, `affected_requests int`, `deployment_id uuid null`, `summary text null`, `outcome text null`, `escalation_reason text null`, `created_by text` (AUTO or user id), `tokens_used int default 0`, `tool_calls int default 0`, `cost_estimate_usd numeric null`, `version int default 0` (compare-and-swap), `created_at`, `updated_at`.
Unique partial index: one **open** incident per `(project_id, fingerprint)` where status not in terminal states.

**incident_signals**: `incident_id`, `event_id`, `kind` (SAMPLE or FIRST_ERROR). Capped at 200 per incident.

**agent_runs**: `id uuid PK`, `incident_id`, `agent`, `stage`, `status`, `provider`, `model`, `started_at`, `ended_at`, `tokens_in`, `tokens_out`, `tool_call_count`, `stop_reason`, `error`.

**tool_calls**: `id uuid PK`, `agent_run_id`, `incident_id`, `seq`, `tool`, `args_summary jsonb`, `args_sha256`, `result_summary text`, `status` (OK, DENIED, ERROR, TIMEOUT), `duration_ms`, `redactions int`, `created_at`. Every tool invocation writes a row (audit completeness metric).

**agent_events** (feeds SSE): `seq bigserial PK`, `incident_id`, `ts`, `type text`, `payload jsonb`. Index `(incident_id, seq)`.

**evidence**: `id uuid PK`, `incident_id`, `kind evidence_kind`, `ref jsonb` (pointer: log id range, trace id, file path + lines + sha, deployment ids, sandbox_run id, artifact id), `summary text` (capped), `created_by_run uuid null`, `created_at`.

**hypotheses**: `id uuid PK`, `incident_id`, `statement text`, `status`, `rank int`, `confidence confidence_label`, `rationale text`, `suspected_files jsonb`, `created_at`, `updated_at`.
**hypothesis_evidence**: `hypothesis_id`, `evidence_id`, `stance` (SUPPORTS or REFUTES). PK on all three columns.

**incident_graphs**: `incident_id`, `version int`, `nodes jsonb`, `edges jsonb`, `built_at`. Each edge: `{from, to, type, evidence_ids[]}`.

**repository_revisions**: `id uuid PK`, `project_id`, `incident_id`, `commit_sha`, `kind` (BASELINE, PATCHED), `branch null`, `workspace_path`, `created_at`.

**sandbox_runs**: `id uuid PK`, `incident_id`, `revision_id`, `kind sandbox_kind`, `status run_status`, `image`, `command text`, `exit_code int null`, `duration_ms int null`, `limits jsonb`, `signature jsonb null` (exception_type, message, top_frame), `stdout_artifact_id`, `stderr_artifact_id`, `attempt int`, `started_at`, `ended_at`.

**artifacts**: `id uuid PK`, `incident_id`, `kind` (LOG, DIFF, TEST_OUTPUT, REPORT, PATCH_FILE), `path`, `size_bytes`, `sha256`, `created_at`. Size caps enforced on write.

**patch_candidates**: `id uuid PK`, `incident_id`, `attempt int`, `base_sha`, `branch`, `diff_text text`, `diff_sha256`, `files_changed int`, `lines_added int`, `lines_removed int`, `rationale text`, `regression_test_path`, `status` (DRAFT, VERIFIED, REJECTED, SUPERSEDED), `created_at`.

**verification_results**: `id uuid PK`, `incident_id`, `patch_id`, `overall verification_overall`, `gates jsonb` (array of `{id, name, status, detail, sandbox_run_ids[], artifact_ids[]}`), `risk_notes jsonb`, `critic jsonb`, `created_at`.

**approvals**: `id uuid PK`, `incident_id`, `patch_id`, `verification_id`, `user_id`, `decision` (APPROVED, REJECTED), `note text null`, `pr_title text null`, `diff_sha256 text` (must equal the patch's hash), `created_at`.

**pull_requests**: `id uuid PK`, `incident_id`, `patch_id`, `approval_id`, `mode delivery_mode`, `branch`, `url text null`, `number int null`, `patch_artifact_id null`, `body text`, `status` (CREATED, FAILED), `created_at`.

**incident_memory**: `incident_id PK`, `project_id`, `fingerprint`, `summary`, `root_cause`, `fix_summary null`, `files jsonb`, `outcome memory_outcome`, `search tsvector` (GIN index), `created_at`. (pgvector is a later option.)

**usage_daily**: `owner_id`, `day date`, `investigations int`, PK `(owner_id, day)`.

**flags**: `key PK`, `value jsonb`, `updated_at` (pushed from API, e.g. `investigations_paused`).

## 4. Project settings schema (Zod in `packages/shared`, Pydantic in engine)

```json
{
  "services": ["checkout-service"],
  "app_import": "app.main:app",
  "requirements_path": "requirements.txt",
  "source_dirs": ["app"],
  "tests_dir": "tests",
  "test_command": "pytest -q",
  "lint_command": "ruff check .",
  "protected_paths": [".github/**", ".env*", "Dockerfile*", "requirements*.txt", "pyproject.toml"],
  "detection": { "window_minutes": 5, "min_requests": 20, "error_rate_threshold": 0.05, "resolve_after_minutes": 10 },
  "auto_investigate": true,
  "capture_request_bodies": true,
  "redact_fields": ["password", "token", "authorization", "card", "secret"],
  "retention_days": 7
}
```

## 5. Fingerprint definition

`sha256(service | route_template | exception_type | top_in_app_frame(file:function))`, truncated to 16 hex chars. If there is no exception, use `service | route_template | status_code`. "In app" means the frame path is inside `source_dirs`.

## 6. Severity heuristics (configurable, documented in UI)

| Severity | Rule (first match) |
|---|---|
| SEV1 | error rate at least 20% and at least 100 affected requests in window, or affected route is marked critical |
| SEV2 | error rate at least 10% |
| SEV3 | otherwise (still above threshold) |

## 7. Retention and cleanup

- `events`: purge older than `retention_days`.
- Workspaces and sandbox artifacts: purge 14 days after incident resolution, except evidence referenced by `incident_memory`.
- Orphan containers: sweeper kills containers labeled `sentinel.incident` older than 30 minutes.
