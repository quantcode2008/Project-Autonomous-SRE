# SentinelAI: Setup and Manual Steps

Version 1.0 · 2026-10-16. Local development only (Windows PowerShell commands shown; macOS/Linux equivalents are analogous).

## 1. Prerequisites (you install these once)

| Tool | Why | Check |
|---|---|---|
| Node.js LTS | web, api | `node -v` |
| Python 3.12 | engine, demo service | `python --version` |
| Git | repo manager, demo repo | `git --version` |
| Docker Desktop (WSL2 backend on Windows) | Postgres, Redis, sandbox | `docker version` and Docker Desktop shows "running" |
| ripgrep (optional) | faster code search; the engine falls back to Python search without it | `rg --version` |

## 2. Accounts and keys you provide manually

| Item | Required? | Notes |
|---|---|---|
| LLM provider API key (Gemini, Anthropic, or OpenAI) | **Yes** for real investigations | Check the provider's current free tier and limits; keep the key only in `.env`. A hosted model is strongly recommended for the demo. |
| Ollama + a local model | Optional | Experimental: small local models are unreliable at tool calling. |
| GitHub fine-grained token | Optional | Needed only for real GitHub PRs. Scope: one repository; permissions: Contents (read/write) and Pull requests (read/write). Local branch mode needs nothing. |

Everything else (database, Redis, auth secrets, internal token, encryption key) is generated locally.

## 3. Environment variables (root `.env`, copy from `.env.example`)

```
# ---- shared ----
NODE_ENV=development
DATABASE_URL=postgresql://sentinel:CHANGE_ME@localhost:5432/sentinel   # api appends ?schema=platform, engine sets search_path=engine
POSTGRES_USER=sentinel
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=sentinel
REDIS_URL=redis://localhost:6379/0
INTERNAL_SERVICE_TOKEN=            # 32+ random bytes, hex
ENCRYPTION_KEY=                    # 32 random bytes, base64 (AES-256-GCM)

# ---- web ----
NEXT_PUBLIC_API_URL=http://localhost:4000
WEB_ORIGIN=http://localhost:3000

# ---- api ----
API_PORT=4000
BETTER_AUTH_SECRET=                # 32+ random bytes
BETTER_AUTH_URL=http://localhost:4000
ENGINE_URL=http://127.0.0.1:8000

# ---- engine ----
ENGINE_PORT=8000
ENGINE_BIND=127.0.0.1
ENGINE_DATA_DIR=./engine_data
DEMO_REPO_PATH=./demo/checkout-service
ALLOWED_LOCAL_REPO_BASE=./demo

# ---- LLM ----
LLM_PROVIDER=gemini                # gemini | anthropic | openai | ollama | fake
LLM_MODEL=                         # set to a current model id from your provider
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434

# ---- budgets and limits ----
BUDGET_MAX_TOKENS_PER_INCIDENT=500000
BUDGET_MAX_TOOL_CALLS_PER_AGENT_RUN=40
BUDGET_MAX_WALL_MINUTES=15
FIX_MAX_ATTEMPTS=4
CRITIC_MAX_ROUNDS=3
PATCH_MAX_FILES=5
PATCH_MAX_CHANGED_LINES=150
DEFAULT_DAILY_INVESTIGATIONS=5

# ---- sandbox ----
SANDBOX_MEMORY_MB=512
SANDBOX_CPUS=1
SANDBOX_PIDS=256
SANDBOX_TIMEOUT_S=120
SANDBOX_TMPFS_MB=256
RUNNER_IMAGE=sentinel-runner:py312

# ---- optional delivery ----
GITHUB_TOKEN=
```

Generate secrets (PowerShell or any shell with Node):
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"      # INTERNAL_SERVICE_TOKEN, BETTER_AUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"   # ENCRYPTION_KEY
```
Never commit `.env`. Use different values per environment later.

## 4. First-time setup

```
git clone <your repo> sentinelai   # or open the folder you created
cd sentinelai
copy .env.example .env             # then fill in the values above
npm install
python -m venv services/engine/.venv
services/engine/.venv/Scripts/Activate.ps1
pip install -r services/engine/requirements.txt
npm run infra:up
npm run db:migrate                 # prisma migrate + alembic upgrade (created in T0.x/T1.2/T3.1)
```

## 5. Daily run

```
npm run infra:up
npm run dev:all
```
or in separate terminals: `dev:web`, `dev:api`, `dev:engine`, `dev:worker`.

Celery on Windows: the worker command must use the threads pool, for example
`celery -A app.worker worker --pool=threads --concurrency=4 -l info`. If it misbehaves, run the worker in WSL2 (see D-05).

## 6. Demo flow

```
npm run demo:seed       # creates demo/checkout-service (nested git repo) and prints setup info
# In the web app: sign up, then create the Demo project and copy the ingest key into the demo service env
npm run demo:traffic    # healthy traffic; Command Center shows steady metrics
npm run demo:inject     # commits the buggy release and sends the deploy event
# Watch the incident appear and the investigation run; approve when ready
npm run demo:restore    # (after approval) apply the fix branch, redeploy, and the incident auto-resolves
```

## 7. Manual checks per phase (what you verify yourself)

| Phase | You verify |
|---|---|
| 0 | `npm run infra:up` healthy; `/health` on engine; landing unchanged |
| 1 | Sign up, verify via console link, sign in; admin promotion works |
| 2 | Landing CTA to sign-up; onboarding wizard; design tokens approval |
| 3 | `demo:inject` creates exactly one incident |
| 4 | Investigation cites sensible evidence; top hypothesis is the pricing function |
| 5 | Reproduction fails on baseline with the matching error; try a sandbox network call and see it blocked |
| 6 | Diff is small and sensible; gates are green; approval creates a local branch |
| 7 | Benchmark report numbers look plausible and are not cherry-picked |
| 8 | Admin screens, accessibility, security checklist |

## 8. Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| `docker` errors or sandbox cannot start | Docker Desktop is not running or WSL2 backend is off |
| Port already in use | Stop the other process or change the port in `.env` |
| Cookies not sent from web to api | `WEB_ORIGIN` mismatch, missing `credentials: "include"`, or cookie `sameSite`/`secure` mismatch in dev |
| Engine returns 401 to api | `INTERNAL_SERVICE_TOKEN` differs between api and engine |
| No incident appears | Ingest key wrong or revoked; traffic not reaching 20 requests in the window; check `/connection-status` |
| Agents do nothing | Kill switch on, quota used up, or `LLM_PROVIDER`/key missing |
| `ripgrep` missing | Install it or rely on the built-in fallback (slower) |
| Windows path issues in scripts | Use the provided Python scripts, not shell scripts |

## 9. Data you can safely delete

`engine_data/` (mirrors, workspaces, artifacts), the Docker volume for Postgres/Redis (resets all data), `demo/checkout-service/` (recreated by `demo:seed`).
