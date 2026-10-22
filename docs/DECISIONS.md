# SentinelAI: Decision Log

Version 1.0 · 2026-10-16. Status values: **Accepted**, **Revisit** (accepted now, with a trigger to reconsider), **Superseded**. Add a new entry instead of silently changing behavior. Format: Context, Decision, Consequences.

---

### D-01 Monorepo with npm workspaces
- **Context:** web, api, shared types, and a Python engine change together; one person builds them.
- **Decision:** one repo (`apps/*`, `packages/*`, `services/engine`, `demo`, `benchmarks`, `infra`, `scripts`, `docs`). The existing frontend moves to `apps/web`.
- **Consequences:** one place for docs and scripts; the Python service is outside npm workspaces but wired through root scripts. Status: Accepted.

### D-02 Two backend services: Express platform API and FastAPI engine
- **Context:** the planned reusable backend uses Node, Express, Prisma, and Better Auth; the product's agent, sandbox, and code-analysis work is best in Python (proposal's FastAPI choice).
- **Decision:** `apps/api` (Express) owns identity and platform concerns; `services/engine` (FastAPI) owns telemetry and agents.
- **Consequences:** two runtimes and an internal API contract. **Revisit** if this overhead slows the build: Better Auth could move into Next.js route handlers and the Express service be removed.

### D-03 The API is the only public gateway
- **Decision:** browsers talk only to `apps/api`. The engine binds to `127.0.0.1` and accepts an internal service token plus tenant headers set by the API. The only engine path used by external clients is `/ingest/v1/events`, authenticated by ingest keys.
- **Consequences:** one auth boundary; SSE is relayed by the API. Status: Accepted.

### D-04 One Postgres database, two schemas, separate migration tools
- **Decision:** `platform` schema via Prisma, `engine` schema via Alembic; no cross-schema foreign keys; the engine keeps a project mirror updated by the API.
- **Consequences:** clear ownership and independent migrations; requires sync on project changes. Optional later: separate DB roles per schema. Status: Accepted.

### D-05 Celery + Redis for background work
- **Context:** the proposal's MVP choice. Celery targets Linux; Windows needs a non-prefork pool.
- **Decision:** Celery with `--pool=threads` for local Windows development. Wrap it behind a `JobQueue` interface.
- **Consequences:** if Celery misbehaves on Windows, run the worker in WSL2 or switch to a DB-backed runner without touching business code. **Revisit** at Phase 4. Status: Accepted.

### D-06 Native JSON ingest format first; OTLP later
- **Context:** the proposal lists OpenTelemetry as the signal source; implementing full OTLP parsing is large and not needed to prove the workflow.
- **Decision:** a small documented JSON event format (`log`, `span`, `request`, `deploy`) with a reference Python client. OTLP adapter is P2.
- **Consequences:** faster MVP; real OpenTelemetry users need an adapter later. Status: Accepted.

### D-07 Engine runs on the host; sandboxes are per-run Docker containers
- **Decision:** the engine process runs on the host and uses the Docker SDK; it is not containerized for MVP. Files move in and out by archive copy, never bind mounts. Network is disabled for all runs.
- **Consequences:** no Docker-socket-in-container risk; Windows Docker Desktop (WSL2) required. Status: Accepted.

### D-08 Reproduction uses an in-process ASGI replay harness (Python only)
- **Decision:** the captured request is replayed through the app's ASGI entrypoint using a test client inside the sandbox, so no server startup or network is needed.
- **Consequences:** deterministic and fast; limited to Python ASGI apps in MVP (WSGI adapter later). Status: Accepted.

### D-09 Deterministic gates and state machine own safety
- **Decision:** gate results, transitions, permissions, budgets, and approvals are computed by code; LLMs only propose actions inside a stage.
- **Consequences:** more code, far more trustworthy. Status: Accepted.

### D-10 Confidence is a rule-based label, not a percentage
- **Decision:** LOW/MEDIUM/HIGH from evidence kinds. No invented probabilities (matches the proposal's guidance).
- **Status:** Accepted.

### D-11 Human approval is mandatory; SentinelAI never merges or deploys
- **Decision:** PR/branch creation requires an approval bound to a patch hash and verification result. No auto-merge, no deployment, no production access.
- **Status:** Accepted.

### D-12 Two delivery modes: local branch (default) and GitHub PR (optional)
- **Decision:** local mode always works (branch plus `.patch` file); GitHub mode needs a repo-scoped fine-grained token.
- **Consequences:** the demo works without GitHub setup. Status: Accepted.

### D-13 SSE for live updates
- **Decision:** one-way server events with resume via `Last-Event-ID`; WebSockets are not needed.
- **Status:** Accepted.

### D-14 Provider-agnostic LLM adapter with operator-level keys
- **Decision:** `run_agent(task, tools, model)` with Gemini, Anthropic, OpenAI, Ollama, and a scripted `fake` provider; keys are environment variables of the operator; per-user daily quotas and a global kill switch control cost.
- **Consequences:** users do not bring keys in MVP (bring-your-own-key is P2). Local models are experimental. Status: Accepted.

### D-15 GSAP and Lenis stay on the landing page only
- **Context:** product screens contain log viewers, diff panes, and feeds that need native inner scrolling.
- **Decision:** `/app/**` uses framer-motion for subtle micro-interactions only.
- **Status:** Accepted.

### D-16 The demo service lives in its own nested git repository, generated by a script
- **Decision:** `demo/template/` holds source; `scripts/seed_demo.py` creates `demo/checkout-service/` as a separate git repo with a deterministic history (healthy commit, then buggy release via `inject_bug.py`). The nested repo is git-ignored by the parent.
- **Consequences:** realistic SHAs, diffs, and branches for the product to analyze. Status: Accepted.

### D-17 Windows-first developer experience, cross-platform scripts
- **Decision:** helper scripts are Python or npm scripts, not bash-only; docs show PowerShell commands; paths are handled with `pathlib`.
- **Status:** Accepted.

### D-18 Hosting, domain, CI/CD, and deployment are deferred
- **Decision:** no production Compose/Kubernetes/cloud files until the MVP is complete and the user asks.
- **Status:** Accepted.

### D-19 The UI shows actions and evidence, not raw model reasoning
- **Decision:** the activity feed shows tool calls, summaries, and results; hidden reasoning is not stored or displayed.
- **Consequences:** safer, cleaner, and still auditable. Status: Accepted.

### D-20 Admin UI after the product works; admin API now
- **Decision:** roles, audit log, quotas, kill switch, and admin endpoints are built in Phase 1; the admin screens come in Phase 8.
- **Status:** Accepted.

### D-21 Incident detection is rule-based for MVP
- **Decision:** windowed error-rate thresholds plus fingerprint grouping; no ML anomaly detection.
- **Consequences:** explainable and testable; may miss slow-burn or latency incidents (P2). Status: Accepted.

### D-22 Python-only target projects in MVP
- **Decision:** one language, `pytest`, `ruff`, `bandit`. Other languages are P2.
- **Status:** Accepted.

### D-23 Project-level request body capture is opt-in and redacted
- **Decision:** failing-request samples are stored only when `capture_request_bodies` is true, after redaction, and are only sent to the LLM in redacted form.
- **Status:** Accepted.

---

## Open questions (default shown; change by adding a decision)

| Question | Default |
|---|---|
| Default LLM provider/model | Set in `.env`; hosted model recommended for demos |
| Use GitHub for the demo PR? | Optional; local branch mode is the default |
| Light theme for product screens | After MVP (P1) |
| pgvector similarity | After MVP (P2); Postgres full-text first |
