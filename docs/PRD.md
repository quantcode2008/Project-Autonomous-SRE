# SentinelAI: Product Requirements Document (PRD)

Version 1.0 · 2026-10-16 · Owner: Misba · Status: Approved for build
Source: *SentinelAI Professional Project Proposal* (Oct 2026) and *SentinelAI project concept*.

## 1. Product summary

**SentinelAI** is an AI-native autonomous Software Reliability Engineer. It turns a production incident into an evidence-backed diagnosis, a reproducible failure, a validated patch with a regression test, and a review-ready branch or pull request, with a human approving every external write.

Tagline: *Detect. Investigate. Reproduce. Repair. Verify.*

One-line pitch: SentinelAI converts production incidents into explainable, reproducible, and safely verified code fixes, ready for human review.

## 2. Problem

- Production failure signals are scattered across logs, traces, metrics, repositories, and release records.
- Triage is slow because engineers correlate signals by hand.
- A plausible AI patch is not trustworthy unless the original failure is reproduced and the fix is tested.

## 3. Goals and non-goals

### Goals (MVP)

1. A signed-in user can connect a Python service and its repository (or use the seeded demo) and see live telemetry.
2. Incidents are detected and grouped automatically.
3. Agents investigate using bounded tools and cite evidence for every claim.
4. The system reproduces the failure in an ephemeral sandbox **before** any repair is attempted.
5. The system generates a minimal patch and a regression test that fails on baseline and passes on the patch.
6. Deterministic verification gates run (reproduction, regression, full suite, lint, security scan, adversarial cases, policy).
7. A human reviews evidence and approves; only then a branch or PR is created.
8. The whole flow is auditable and demonstrable in under 5 minutes on the seeded benchmark.

### Non-goals (MVP)

- Automatic deployment, auto-merge, or any production write.
- Languages other than Python; Kubernetes signals; multi-repo incidents.
- Multi-tenant organizations, billing, SSO, team roles beyond USER/ADMIN.
- Hosting, domain, CI/CD, and production infrastructure (deferred).
- Calibrated probability scores. Confidence is a heuristic label only.

## 4. Users and personas

| Persona | Need | Primary screens |
|---|---|---|
| **Software engineer** investigating an unfamiliar failure | Fast, trustworthy root cause with proof | Investigation Workspace, Patch, Verification |
| **SRE / DevOps** doing triage | See scope, onset, deploy correlation, severity | Command Center, Incident list |
| **Engineering lead** reviewing impact and remediation | Evidence, risk, approval control, audit | Verification, Approval, Library |
| **Operator (Misba)** running the platform | Control users, quotas, and a kill switch | Admin (later phase) |

## 5. Scope

### MVP (must ship)

Auth, projects, repo connection, ingest keys, ingestion, detection, investigation, sandbox reproduction, repair, verification, approval, local-branch and GitHub PR delivery, Command Center, Investigation Workspace, benchmark harness, seeded demo.

### Should ship (P1)

Root-cause graph, Incident Library with similarity, cost/time per incident, evaluation report, admin endpoints.

### Later (P2)

Admin UI, multi-model comparison, pgvector similarity, OpenTelemetry/OTLP ingest, Prometheus/Grafana, additional languages, GitHub App installation flow, Temporal, team workspaces, hosting and deployment.

## 6. User journeys

### 6.1 First run
1. Visitor lands on `/`, clicks **Get started**, signs up (email + password).
2. Verifies email (in dev, the link is printed to the API console).
3. Signs in and is routed to `/app/onboarding`.
4. Chooses **Use the demo service** (seeded) or **Connect my repo**.
5. Receives an ingest key (shown once) and a snippet; the page shows **Waiting for first event** and flips to **Connected** when data arrives.
6. Lands on the Command Center with live metrics.

### 6.2 Incident lifecycle (the core experience)
1. A faulty release is deployed (demo: `npm run demo:inject`). A deploy event and failures arrive.
2. Detector creates **one grouped incident** (severity, service, route, onset, linked deployment).
3. Investigation starts automatically (or on click). The Investigation Workspace shows live agent activity, evidence, and ranked hypotheses.
4. Reproduction runs in the sandbox. UI shows the captured request, the baseline failure, and the failure-signature match.
5. Repair produces a minimal diff and a regression test. UI shows the diff and before/after runs.
6. Verification gates run. UI shows each gate with artifacts, risk notes, and critic results.
7. The user reviews and clicks **Approve and create PR** (or Reject with feedback).
8. A branch/PR is created. The incident becomes **PR created**, then **Resolved** when the fingerprint stops appearing.
9. The incident is stored in the Incident Library with outcome.

### 6.3 Failure and escalation
If reproduction fails, budgets are exhausted, gates keep failing, or the kill switch is on, the incident becomes **Escalated** with a human-readable explanation and all collected evidence. The system never fakes a fix.

## 7. Functional requirements

Priority: **P0** MVP, **P1** should, **P2** later.

### 7.1 Authentication and accounts (AUTH)
| ID | Requirement | P |
|---|---|---|
| FR-AUTH-1 | Email/password sign-up, sign-in, sign-out with secure cookie sessions | P0 |
| FR-AUTH-2 | Email verification and password reset (dev mailer prints links to console; provider pluggable) | P0 |
| FR-AUTH-3 | All `/app/**` pages and all non-public API routes require a valid session; unauthenticated users are redirected to sign-in with a return URL | P0 |
| FR-AUTH-4 | Roles USER and ADMIN; disabled users cannot sign in and existing sessions stop working | P0 |
| FR-AUTH-5 | Rate limiting on auth endpoints | P0 |
| FR-AUTH-6 | Account settings: name, change password, sign out of other sessions | P1 |
| FR-AUTH-7 | Social login (Google/GitHub) | P2 |

### 7.2 Projects and connections (PROJ)
| ID | Requirement | P |
|---|---|---|
| FR-PROJ-1 | Create, list, rename, delete projects; each project is owned by one user and fully isolated | P0 |
| FR-PROJ-2 | **Demo project**: one click creates a project wired to the seeded demo repo | P0 |
| FR-PROJ-3 | Connect a repository: local path (demo) or GitHub HTTPS URL with an optional token; verify connectivity; token stored encrypted | P0 |
| FR-PROJ-4 | Project settings: service name(s), language (python), `app_import`, `test_command`, `lint_command`, source dirs, requirements path, protected paths, thresholds, `auto_investigate`, `capture_request_bodies` | P0 |
| FR-PROJ-5 | Ingest keys: create (shown once), list (prefix only), revoke | P0 |
| FR-PROJ-6 | Onboarding wizard with a live "waiting for first event" check | P0 |

### 7.3 Ingestion (ING)
| ID | Requirement | P |
|---|---|---|
| FR-ING-1 | Batched JSON ingest of `log`, `span`, `request`, and `deploy` events authenticated by an ingest key | P0 |
| FR-ING-2 | Schema validation, size and rate limits, per-project quotas, partial-failure reporting | P0 |
| FR-ING-3 | Redaction of secrets and configured sensitive fields before storage | P0 |
| FR-ING-4 | Request sample capture (opt-in) with redaction, stored for failing requests only | P0 |
| FR-ING-5 | Retention: events older than 7 days purged (configurable) | P1 |
| FR-ING-6 | OTLP/OpenTelemetry-compatible ingest | P2 |

### 7.4 Detection and incidents (DET)
| ID | Requirement | P |
|---|---|---|
| FR-DET-1 | Detect error-rate spikes per service/route over a sliding window with minimum request count | P0 |
| FR-DET-2 | Group failures by fingerprint (service, route, exception type, top in-app frame) into one incident; later signals attach to the open incident | P0 |
| FR-DET-3 | Compute onset time, affected request count, error rate, and correlate the latest prior deployment | P0 |
| FR-DET-4 | Severity SEV1-SEV3 from documented heuristics; thresholds configurable per project | P0 |
| FR-DET-5 | Auto-investigate on creation unless disabled, the kill switch is on, or quota is exhausted (then manual start) | P0 |
| FR-DET-6 | Manual actions: investigate, cancel, dismiss, mark resolved | P0 |
| FR-DET-7 | Auto-resolve a `PR_CREATED` incident when the fingerprint has not recurred for N minutes (default 10) | P1 |

### 7.5 Investigation (INV)
| ID | Requirement | P |
|---|---|---|
| FR-INV-1 | Agents use only registered tools with structured outputs; every tool call is logged | P0 |
| FR-INV-2 | Every hypothesis and claim cites evidence IDs; evidence IDs are validated by the engine (hallucinated IDs rejected) | P0 |
| FR-INV-3 | Evidence kinds: log range, trace, metric, deploy diff, code location, sandbox run, test result, scan result | P0 |
| FR-INV-4 | Ranked hypotheses with a heuristic confidence label (LOW/MEDIUM/HIGH) computed by rules, never by the LLM | P0 |
| FR-INV-5 | Live activity stream (SSE) with resume support; summaries only, never raw model reasoning | P0 |
| FR-INV-6 | Budgets: tool calls per run, tokens per incident, wall-clock; cancel anytime | P0 |
| FR-INV-7 | Code retrieval via ripgrep (with Python fallback) and git history/diff at the deployed commit | P0 |

### 7.6 Reproduction (REP)
| ID | Requirement | P |
|---|---|---|
| FR-REP-1 | No repair may begin until the failure is reproduced in the sandbox with a matching failure signature, deterministically (3/3 runs) | P0 |
| FR-REP-2 | Sandbox: ephemeral container, no network, resource limits, non-root, no host mounts, timeouts | P0 |
| FR-REP-3 | Replay captured failing request through an in-process ASGI harness; generate a failing regression test | P0 |
| FR-REP-4 | Non-reproducible incidents escalate with an explanation instead of proceeding | P0 |

### 7.7 Repair and verification (FIX / VER)
| ID | Requirement | P |
|---|---|---|
| FR-FIX-1 | Fix Agent produces the smallest evidence-backed diff within policy (max files/lines, allowlisted paths, no dependency changes) | P0 |
| FR-FIX-2 | A new regression test that fails on baseline and passes on the patch is mandatory | P0 |
| FR-VER-1 | Gates G1-G8 (see `AGENT_SYSTEM.md`) run deterministically; the LLM cannot alter results | P0 |
| FR-VER-2 | Critic generates adversarial cases; introduced regressions send the patch back to the Fix Agent (max 3 loops) then escalate | P0 |
| FR-VER-3 | Risk review: changed paths, interface changes, warnings, pre-existing weaknesses, rollback note | P0 |

### 7.8 Approval and delivery (DEL)
| ID | Requirement | P |
|---|---|---|
| FR-DEL-1 | Approval is a recorded human action bound to a specific patch hash and verification result | P0 |
| FR-DEL-2 | On approval create a branch (local mode) with downloadable patch, or a GitHub PR when a scoped token is configured | P0 |
| FR-DEL-3 | PR body generated from a fixed template: root cause with evidence links, reproduction, diff summary, gate table, risks, rollback, AI-generated disclosure | P0 |
| FR-DEL-4 | Rejection with optional feedback returns to repair once; otherwise dismisses | P0 |
| FR-DEL-5 | Nothing is ever merged or deployed by SentinelAI | P0 |

### 7.9 Experience (UX)
| ID | Requirement | P |
|---|---|---|
| FR-UX-1 | Command Center: health state, request/error trends, open incidents, recent deployments | P0 |
| FR-UX-2 | Investigation Workspace: stage stepper, tabs (Timeline, Evidence, Graph, Reproduction, Patch, Verification, Audit), live activity feed | P0 |
| FR-UX-3 | Root-cause graph (React Flow) where every edge links to evidence | P1 |
| FR-UX-4 | Incident Library with search and similar past incidents | P1 |
| FR-UX-5 | All screens: loading, empty, error, and reconnect states; WCAG 2.2 AA; reduced-motion support | P0 |
| FR-UX-6 | Per-incident time, token, and tool-call counters | P1 |

### 7.10 Administration and audit (ADM)
| ID | Requirement | P |
|---|---|---|
| FR-ADM-1 | Audit log of sensitive user actions (auth, project, keys, approvals) and every tool call | P0 |
| FR-ADM-2 | Admin API: list/search users, change role, disable/enable, set daily investigation quota, view audit logs, platform stats | P0 |
| FR-ADM-3 | Global kill switch pausing all investigations | P0 |
| FR-ADM-4 | Admin UI | P2 (Phase 8) |

## 8. Non-functional requirements

| Area | Requirement (targets are goals to measure, not claims) |
|---|---|
| Performance | Ingest sustains 200 events/s locally; dashboard queries p95 under 500 ms on 7 days of demo data; Command Center interactive under 2 s on a mid laptop |
| Time to resolution | Seeded benchmark incident reaches `AWAITING_APPROVAL` in under 10 minutes with a hosted model (measure and report actual) |
| Reliability | Pipeline is resumable: a worker restart must not corrupt an incident; every stage is idempotent or guarded by state version |
| Security | See `SECURITY.md`; sandbox-first, least privilege, tenant isolation tests mandatory |
| Privacy | Redaction before storage and before any LLM call; users are told that code and logs are sent to the configured LLM provider |
| Accessibility | WCAG 2.2 AA; keyboard operable; severity never color-only; `aria-live` for activity feed (throttled) |
| Portability | Developer experience works on Windows 11 (PowerShell), macOS, Linux |
| Maintainability | Strict typing, tests per module, docs updated with behavior changes |
| Observability of SentinelAI | JSON logs with request IDs; `/health` and `/ready` on every service |
| Cost control | Per-incident token budget; per-user daily investigation quota; global kill switch |

## 9. Success metrics

Measured on the seeded benchmark (`TESTING_AND_EVAL.md`). Report real numbers; do not claim targets as results.

| Metric | Definition | MVP target |
|---|---|---|
| Detection precision | Incidents that are real and actionable / incidents created | 100% on benchmark, no duplicate incidents per fault |
| Root-cause attribution | Correct file in top-3 suspected files | at least 4/5 incidents |
| Reproduction rate | Incidents reproduced before patching / total | at least 4/5 |
| Patch success | Regression fails-baseline/passes-patched and full suite passes | at least 3/5 end to end |
| Risk escape rate | Critic cases that fail only after patch (introduced regressions) surviving verification | 0 |
| Time to verified PR | Incident creation to `AWAITING_APPROVAL` | reported median |
| Cost per incident | Tokens and estimated USD | reported median |
| Audit completeness | Tool calls with a log row / tool calls executed | 100% |

## 10. Release criteria (MVP "done")

1. A new user can sign up, verify, sign in, create the demo project, and see live data without editing code.
2. `inject_bug` creates exactly one incident within 2 minutes of traffic.
3. The incident reaches `AWAITING_APPROVAL` with a reproduced failure, a diff, a regression test, and all gates green.
4. Approving creates a local branch and patch export (GitHub PR if a token is configured).
5. `restore` plus `apply_fix` makes the incident auto-resolve.
6. Benchmark report exists with real numbers for at least 3 seeded incidents.
7. Security checklist in `SECURITY.md` passes; tenant-isolation and sandbox tests pass.
8. Accessibility check finds no critical issues on core screens.

## 11. Risks and mitigations

| Risk | Mitigation |
|---|---|
| LLM output is wrong or inconsistent | Deterministic gates, evidence validation, benchmark, escalation path |
| Prompt injection via logs or code | Untrusted-data handling, schema-validated outputs, tool permissions in code, sandbox without network |
| Sandbox escape or abuse | Non-root, no network, no host mounts, cap-drop, resource limits, timeouts, orphan sweeper |
| Cost runaway | Token/tool/wall budgets, per-user quotas, kill switch |
| Celery on Windows | Threads pool in dev; `JobQueue` interface allows a DB-backed runner fallback |
| Scope creep | MVP list in section 5 is binding; new ideas go to P2 |
| Demo flakiness | Deterministic seed scripts, pinned demo dependencies, recorded fallback run |
| Small local models cannot do tool calling well | Default to a hosted model for demos; local models are experimental |

## 12. Assumptions and defaults

- Python 3.12 services only; one demo service; one repository per project.
- LLM keys are operator-level environment variables for MVP (users do not bring keys).
- Default provider and model are set in `.env` (see `SETUP.md`); the adapter keeps the choice swappable.
- GitHub integration is optional; the local-branch mode must work without it.
- Single region, single machine, local-only until hosting is planned.

## 13. Demo script (target 3 minutes)

| Time | Scene |
|---|---|
| 0:00 | Healthy dashboard, steady checkout traffic |
| 0:20 | `npm run demo:inject` deploys the buggy release; deploy marker appears |
| 0:40 | Error rate rises; one incident appears with SEV and linked deployment |
| 1:00 | Live agents gather evidence; hypothesis ranks the pricing function first |
| 1:40 | Sandbox replays the exact failing request; baseline fails with matching signature |
| 2:10 | Patch and regression test appear; before/after runs shown |
| 2:30 | Gates turn green; critic results and risk notes shown |
| 2:50 | Approve; branch/PR created; `apply_fix` then `restore` and incident resolves |
