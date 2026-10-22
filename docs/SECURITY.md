# SentinelAI: Security and Safety

Version 1.0 · 2026-10-16. SentinelAI runs LLM-directed tools over untrusted data and executes untrusted code. Treat this document as requirements, not advice.

## 1. Assets and actors

| Asset | Why it matters |
|---|---|
| User accounts, sessions | Account takeover |
| Repository tokens, ingest keys, LLM keys | Credential theft |
| Customer code and logs | Confidentiality; sent to an LLM provider |
| Host machine | Must never run agent-generated code |
| Approval and delivery actions | Must never happen without a human |

Actors: legitimate users, malicious users (other tenants), malicious content inside logs or repositories (prompt injection), compromised dependencies, a misbehaving LLM.

## 2. Trust boundaries

See `ARCHITECTURE.md` section 3. Key principle: **permissions live in code**. The engine is internal-only; the API is the sole public gateway; the sandbox has no network and no host access.

## 3. Sandbox specification (mandatory)

| Control | Setting |
|---|---|
| Network | `network_mode="none"` for every run; dependency build step is the only networked step and is not agent-controlled |
| Filesystem | read-only root, tmpfs workspace (size capped), **no bind mounts**, files copied in/out by archive |
| User | non-root UID, `no-new-privileges`, `cap_drop=["ALL"]` |
| Resources | memory (default 512 MB), CPUs (default 1), `pids_limit` (256), disk via tmpfs cap |
| Time | hard timeout per run (default 120 s) then kill; total wall budget per incident |
| Secrets | none injected; only non-secret env such as `PYTHONHASHSEED`, `TZ` |
| Lifecycle | one container per run, auto-removed; label `sentinel.incident=<id>`; orphan sweeper every 5 minutes |
| Output | stdout/stderr capped (default 1 MB) and redacted before storage |

Security tests (must pass): outbound network call fails; writing outside the workspace fails; fork bomb is limited; memory hog is killed; timeout is enforced; host path is not visible.

## 4. Authentication and sessions

- Better Auth with email/password; argon2/bcrypt handled by the library; no custom crypto.
- httpOnly cookie, `sameSite=lax` (or `none` + `secure` only if the deployment requires it), `secure` outside dev, session expiry and rotation per library defaults.
- Origin check on mutating requests; CORS restricted to `WEB_ORIGIN` with credentials.
- Rate limits: strict on sign-in, sign-up, password reset, and verification email resend.
- Disabled users: blocked at sign-in and on every authenticated request (session check includes `disabled`).
- Admin routes check role server-side on every call; last-admin protection.

## 5. Authorization and tenant isolation

- Every project-scoped query filters by the project the API verified is owned by the session user.
- Unknown and unauthorized resources both return 404.
- Engine accepts tenant context only from the API (service token); it re-validates that incident IDs belong to the supplied `X-Project-Id`.
- **Mandatory tests:** user A cannot read, list, stream, approve, cancel, or delete anything of user B (projects, incidents, evidence, logs, keys, artifacts, SSE).

## 6. Secrets and data protection

- Repo tokens: AES-256-GCM with `ENCRYPTION_KEY`; never returned by any endpoint; only last 4 shown; decrypted in memory only when cloning or opening a PR.
- Ingest keys: 32+ bytes random, shown once, stored as SHA-256 hash; prefix for display; revocation supported; compare in constant time.
- Internal service token: random 32+ bytes; constant-time compare; engine binds to 127.0.0.1.
- LLM keys: env only; never logged; never sent to the browser.
- Logs: structured, redacted. No tokens, cookies, passwords, or request bodies in server logs.
- **LLM data disclosure:** code snippets and redacted logs are sent to the configured provider. The onboarding flow must state this plainly and let the user turn off request-body capture.

## 7. Input handling

- Zod/Pydantic on every external input; body size limits; reject unknown fields for write endpoints.
- Repo URL allowlist: `https://github.com/<owner>/<repo>` or an explicit local path under an allowed base directory (demo). Reject other schemes and hosts (prevents SSRF and local file exfiltration).
- Git: clone with hooks disabled (`core.hooksPath` to an empty dir), no submodule recursion, size and time limits, no credential helper persistence.
- Path handling: resolve and verify inside the workspace; reject symlinks that escape; reject `..`.
- Archive extraction (if any): size, file count, and path checks.
- Markdown and diffs rendered in the UI are sanitized; no raw HTML from logs, code, or LLM output.

## 8. Prompt injection and LLM misuse

- Wrap all external text as untrusted data; instruct the model to treat it as data.
- Tool allowlists per agent; tools validate and deny out-of-policy calls; denials are logged and counted.
- Schema validation on all LLM outputs; evidence IDs and file paths validated against stored facts.
- No LLM-controlled network access, no shell, no arbitrary file writes.
- Patch policy (G8) bounds the blast radius: size caps, allowed directories, no protected paths, no dependency edits.
- PR text comes from a fixed template; free text is capped and sanitized.
- Budgets (tokens, tool calls, time) and the global kill switch limit abuse and cost.

## 9. Delivery safeguards

- Approval is a database record bound to `patch_id`, `verification_id`, and `diff_sha256`; `create_pull_request` re-verifies it.
- GitHub token must be a fine-grained token limited to one repository with only contents and pull-request write permissions. SentinelAI never merges.
- Branch names are generated (`sentinel/<short_id>-<slug>`), sanitized, and never overwrite existing branches.

## 10. Audit and monitoring

- Audit: auth events, project and key changes, approvals, admin actions, flag changes.
- Engine: every tool call, every state transition, every sandbox run.
- Alertable local signals: repeated denied tool calls, sandbox timeouts, repeated auth failures (log only for now).

## 11. Dependencies and supply chain

- Pin versions (lockfiles); run `npm audit` and `pip-audit` during Phase 8.
- Sandbox base image pinned by digest where possible; dependency images built from the project's pinned requirements.
- No postinstall scripts from unknown packages; review any new dependency (reason recorded in the PR or task report).

## 12. Out-of-scope risks (documented, not solved in MVP)

- Hostile containers escaping via kernel vulnerabilities (mitigation later: gVisor/Firecracker, rootless Docker).
- Compliance regimes (SOC 2, GDPR processes).
- Large-scale abuse protection and billing fraud.

## 13. Release security checklist

- [ ] No secrets in Git history; `.env` ignored; `.env.example` complete
- [ ] Engine unreachable from outside localhost
- [ ] All sandbox security tests pass
- [ ] Tenant isolation tests pass for every resource type and SSE
- [ ] Approval gate tests pass (missing/old hash, failed verification, non-owner)
- [ ] Prompt-injection fixtures pass (no disallowed tool call; clean completion or escalation)
- [ ] Rate limits verified on auth and ingest
- [ ] Kill switch verified (new work blocked; running work cancellable)
- [ ] Token encryption verified; tokens never appear in responses or logs
- [ ] Dependency audit reviewed
- [ ] LLM data-disclosure notice present in onboarding
