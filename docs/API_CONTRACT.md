# SentinelAI: API Contract

Version 1.0 · 2026-10-16. Public base: `http://localhost:4000`. Engine base (internal): `http://127.0.0.1:8000`.

## 1. Conventions

- JSON everywhere; `Content-Type: application/json`. Dates are ISO 8601 UTC.
- Auth: Better Auth session cookie (`credentials: "include"`). CORS allows only `WEB_ORIGIN`.
- IDs in paths are opaque strings.
- Pagination: `?limit=` (default 25, max 100) and `?cursor=`; responses return `{ "items": [], "nextCursor": string|null }`.
- Every response carries `X-Request-Id`.
- Mutating requests require the `Origin` header to match `WEB_ORIGIN` (CSRF defense in addition to `sameSite` cookies).

### Error format

```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Human readable", "details": [{"path":"name","issue":"Required"}], "requestId": "req_abc123" } }
```

| HTTP | code | Meaning |
|---|---|---|
| 400 | VALIDATION_FAILED | Body/query failed schema validation |
| 401 | UNAUTHENTICATED | No or invalid session |
| 403 | FORBIDDEN | Role or disabled account |
| 404 | NOT_FOUND | Missing **or not owned** (never reveal existence) |
| 409 | CONFLICT / INVALID_STATE | State machine or version conflict |
| 413 | PAYLOAD_TOO_LARGE | Body over limit |
| 422 | GATE_NOT_SATISFIED | Approval or transition blocked by a gate |
| 429 | RATE_LIMITED / QUOTA_EXCEEDED | Includes `retryAfterSeconds` where known |
| 503 | PAUSED / ENGINE_UNAVAILABLE | Kill switch on or engine down |

## 2. Auth (Better Auth, mounted at `/api/auth/*`)

Sign up, sign in, sign out, verify email, request/reset password, get session. Use the Better Auth client in the web app; do not hand-roll. Sign-up and sign-in are rate limited. Dev mailer prints verification and reset links to the API console.

## 3. Account

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/me` | `{ id, name, email, role, emailVerified, quota: { daily, usedToday } }` |
| PATCH | `/api/v1/me` | `{ name }` |

## 4. Projects

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/projects` | n/a | paginated projects (own only) |
| POST | `/api/v1/projects` | `{ name, settings? }` | project |
| POST | `/api/v1/projects/demo` | `{}` | project wired to the seeded demo repo, plus first ingest key (plaintext once) |
| GET | `/api/v1/projects/:id` | n/a | project with repo summary and health |
| PATCH | `/api/v1/projects/:id` | `{ name?, settings? }` | project |
| DELETE | `/api/v1/projects/:id` | n/a | 204 (soft delete; engine purge scheduled) |
| PUT | `/api/v1/projects/:id/repo` | `{ provider, location, defaultBranch, token? }` | repo summary (token never returned; `tokenLast4` only) |
| POST | `/api/v1/projects/:id/repo/verify` | `{}` | `{ ok, commitSha?, error? }` |
| GET | `/api/v1/projects/:id/ingest-keys` | n/a | `[{ id, name, prefix, createdAt, lastUsedAt, revokedAt }]` |
| POST | `/api/v1/projects/:id/ingest-keys` | `{ name }` | `{ id, name, key }` (**key shown once**) |
| DELETE | `/api/v1/ingest-keys/:keyId` | n/a | 204 (revokes) |
| GET | `/api/v1/projects/:id/connection-status` | n/a | `{ connected, lastEventAt, eventsLast5m }` (onboarding polling) |

Project object:
```json
{ "id":"clx...", "name":"Checkout (demo)", "kind":"DEMO", "language":"python",
  "settings":{...}, "repo":{"provider":"LOCAL","location":"demo/checkout-service","defaultBranch":"main","verifiedAt":"..."},
  "createdAt":"..." }
```

## 5. Telemetry (proxied to engine, scoped by project)

| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/api/v1/projects/:id/overview` | `window=1h` | `{ health: "HEALTHY"|"DEGRADED"|"INCIDENT", requestRate, errorRate, p95Ms, openIncidents, lastDeployment }` |
| GET | `/api/v1/projects/:id/metrics` | `window, step, service?, route?` | `{ series: [{ ts, requests, errors, p50Ms, p95Ms }] }` |
| GET | `/api/v1/projects/:id/logs` | `from,to,level?,q?,traceId?,cursor` | paginated log events (redacted) |
| GET | `/api/v1/projects/:id/deployments` | `limit` | deployments |

`health` is a heuristic: INCIDENT if any open non-terminal incident of SEV1/SEV2, DEGRADED if error rate is above half the threshold or a SEV3 is open, else HEALTHY.

## 6. Incidents

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/projects/:id/incidents` | `status?, severity?, q?, cursor` |
| GET | `/api/v1/incidents/:id` | detail (below) |
| POST | `/api/v1/incidents/:id/investigate` | Manual start/re-run; 503 if paused; 429 if over quota |
| POST | `/api/v1/incidents/:id/cancel` | Cooperative cancel |
| POST | `/api/v1/incidents/:id/dismiss` | `{ reason? }` |
| POST | `/api/v1/incidents/:id/resolve` | Mark resolved |
| GET | `/api/v1/incidents/:id/timeline` | ordered timeline entries with evidence refs |
| GET | `/api/v1/incidents/:id/evidence` | `kind?`; paginated |
| GET | `/api/v1/incidents/:id/evidence/:evidenceId` | full artifact view (log range, trace, code snippet, diff, run) |
| GET | `/api/v1/incidents/:id/hypotheses` | ranked with evidence ids and confidence label |
| GET | `/api/v1/incidents/:id/graph` | `{ nodes, edges }` |
| GET | `/api/v1/incidents/:id/reproduction` | sample, baseline runs, signature match, regression test |
| GET | `/api/v1/incidents/:id/sandbox-runs/:runId` | run detail |
| GET | `/api/v1/incidents/:id/sandbox-runs/:runId/logs` | text, capped, `?tail=` |
| GET | `/api/v1/incidents/:id/patches` | candidates (latest first) |
| GET | `/api/v1/incidents/:id/patches/:patchId` | diff, rationale, files |
| GET | `/api/v1/incidents/:id/verification` | latest verification with gates, critic, risk |
| POST | `/api/v1/incidents/:id/approve` | `{ patchId, verificationId, diffSha256, prTitle?, confirmReviewed: true }` |
| POST | `/api/v1/incidents/:id/reject` | `{ patchId, note?, requestRevision: boolean }` |
| GET | `/api/v1/incidents/:id/pull-request` | PR/branch result and patch download link |
| GET | `/api/v1/incidents/:id/audit` | tool calls and approvals |
| GET | `/api/v1/incidents/:id/stream` | **SSE** (section 8) |
| GET | `/api/v1/projects/:id/library` | `q?, outcome?, cursor` |
| GET | `/api/v1/incidents/:id/similar` | top 5 similar past incidents |

Incident detail:
```json
{
  "id":"uuid","shortId":"INC-0007","projectId":"clx...","title":"HTTP 500 on POST /checkout (AttributeError in calculate_price)",
  "severity":"SEV2","status":"INVESTIGATING","service":"checkout-service","route":"/checkout",
  "detectedAt":"...","onsetAt":"...","errorRate":0.174,"affectedRequests":209,
  "deployment":{"id":"uuid","commitSha":"a1b2c3d","message":"feat: promotion tiers","ts":"..."},
  "budget":{"tokensUsed":48210,"tokensMax":500000,"toolCalls":17,"elapsedSeconds":142},
  "stage":{"name":"INVESTIGATING","startedAt":"..."},
  "escalationReason":null,"summary":null,"version":9
}
```

### Approval rules (enforced server-side; 422 `GATE_NOT_SATISFIED` otherwise)
1. Incident status is `AWAITING_APPROVAL`.
2. `patchId` is the latest `VERIFIED` candidate and `diffSha256` equals its stored hash.
3. `verificationId` is that patch's latest verification and `overall != FAILED`.
4. `confirmReviewed` is `true`.
5. Caller owns the project and the account is enabled.
The approval and the resulting delivery are written to the audit log.

## 7. Admin (ADMIN role only; every call audited)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/admin/users` | `q?, role?, disabled?, cursor` |
| PATCH | `/api/v1/admin/users/:id` | `{ role?, disabled?, dailyInvestigationQuota? }`; cannot demote or disable the last admin or yourself |
| GET | `/api/v1/admin/audit-logs` | filters: actor, action, project, date range |
| GET | `/api/v1/admin/stats` | users, projects, incidents by status, tokens and tool calls last 24h |
| GET | `/api/v1/admin/flags` | current flags |
| PUT | `/api/v1/admin/flags/investigations_paused` | `{ value: boolean }`, pushed to the engine |

## 8. Server-Sent Events: `GET /api/v1/incidents/:id/stream`

Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`. Compression disabled for this route. Supports `Last-Event-ID` (replay from DB, then live). Comment heartbeat `: ping` every 15 s.

```
id: 128
event: tool_call
data: {"seq":128,"ts":"2026-10-16T10:31:15Z","agent":"code_investigator","tool":"read_file","summary":"Read app/pricing.py lines 40-90","status":"OK","durationMs":12}
```

| event | Payload highlights |
|---|---|
| `stage_changed` | `{ from, to, reason }` |
| `agent_started` / `agent_finished` | `{ agent, runId, stopReason? }` |
| `tool_call` | see above |
| `evidence_added` | `{ id, kind, summary }` |
| `hypothesis_updated` | `{ id, statement, rank, confidence, status }` |
| `sandbox_started` / `sandbox_finished` | `{ runId, kind, status, exitCode?, durationMs? }` |
| `sandbox_log` | `{ runId, stream: "stdout"|"stderr", line }` (throttled) |
| `gate_result` | `{ gate, status, detail }` |
| `patch_proposed` | `{ patchId, attempt, files, linesAdded, linesRemoved }` |
| `awaiting_approval` | `{ patchId, verificationId, overall }` |
| `approval_recorded` | `{ decision, userId }` |
| `pr_created` | `{ mode, branch, url? }` |
| `escalated` | `{ reason }` |
| `incident_resolved` | `{ how: "AUTO"|"USER" }` |
| `error` | `{ code, message }` (sanitized) |

Activity items are **summaries of actions** and never raw model reasoning (D-19).

## 9. Ingest (engine, authenticated by ingest key)

`POST /ingest/v1/events` with `Authorization: Bearer sk_ing_<random>`

Limits: 500 events per batch, 1 MB body, 600 requests/minute per key (defaults).

```json
{
  "events": [
    { "type":"request","ts":"2026-10-16T10:30:58.120Z","service":"checkout-service","method":"POST","route":"/checkout",
      "status_code":500,"duration_ms":38,"trace_id":"7f3c...","request_sample":{"method":"POST","path":"/checkout","headers":{"content-type":"application/json"},"body":{"cart":[{"sku":"A1","qty":2}],"coupon_code":null}} },
    { "type":"log","ts":"...","service":"checkout-service","level":"ERROR","message":"Unhandled exception","trace_id":"7f3c...",
      "exception":{"type":"AttributeError","message":"'NoneType' object has no attribute 'discount_pct'",
        "frames":[{"file":"app/pricing.py","line":57,"function":"calculate_price"},{"file":"app/main.py","line":31,"function":"checkout"}]} },
    { "type":"span","ts":"...","service":"checkout-service","trace_id":"7f3c...","span_id":"s2","parent_span_id":"s1","name":"PricingService.calculate_price","start_ts":"...","end_ts":"...","status":"ERROR" },
    { "type":"deploy","ts":"...","service":"checkout-service","commit_sha":"a1b2c3d4","ref":"main","message":"feat: promotion tiers","author":"dev" }
  ]
}
```
Response `202`: `{ "accepted": 4, "rejected": [{ "index": 2, "reason": "..." }] }`. Redaction runs before storage. A tiny reference client (`sentinel_client.py`, ASGI middleware plus log handler) ships in the demo template.

## 10. Engine internal API (service token required; never public)

Headers: `X-Internal-Token`, `X-Request-Id`, and for tenant calls `X-User-Id`, `X-Project-Id`.

| Method | Path | Purpose |
|---|---|---|
| PUT | `/internal/projects/{id}` | Upsert project mirror (settings, repo, encrypted token, quota) |
| DELETE | `/internal/projects/{id}` | Purge request |
| PUT | `/internal/projects/{id}/ingest-keys/{keyId}` | Upsert key hash and revocation |
| POST | `/internal/projects/{id}/repo/verify` | Test clone/ls-remote |
| GET | `/internal/projects/{id}/overview`, `/metrics`, `/logs`, `/deployments`, `/connection-status` | Telemetry reads |
| GET | `/internal/projects/{id}/incidents` | List |
| GET | `/internal/incidents/{id}` and sub-resources | `timeline, evidence, hypotheses, graph, reproduction, sandbox-runs, patches, verification, pull-request, audit, similar` |
| POST | `/internal/incidents/{id}/investigate` , `/cancel`, `/dismiss`, `/resolve` | Controls |
| POST | `/internal/incidents/{id}/approve`, `/reject` | Approval recording and delivery enqueue (engine re-validates every rule in section 6) |
| GET | `/internal/incidents/{id}/events?after=<seq>` | Replay for SSE |
| PUT | `/internal/flags/{key}` | Push control flags |
| GET | `/internal/usage?ownerId=` | Daily usage |
| GET | `/health`, `/ready` | Public to localhost only |

The engine exposes OpenAPI at `/openapi.json` (localhost only); the API generates its typed client from it.
