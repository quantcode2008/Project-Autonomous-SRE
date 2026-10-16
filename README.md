SentinelAI is an AI-native reliability platform that watches a software system, investigates incidents, reproduces
failures inside an isolated sandbox, proposes a code patch, generates regression tests, stress-tests the fix, and
prepares a pull request.
Why it stands out!
        This is not an AI chatbot wrapped around a code editor. It demonstrates agent orchestration, tool calling,
        code intelligence, observability, containerized execution, automated testing, risk analysis, and Git
        workflow integration in one coherent system.
01> Detect
   Correlate logs, metrics, traces, and deployments into a single incident.
02> Investigate
   Use specialized agents to gather evidence and rank likely root causes.
03> Reproduce
   Build an isolated environment and replay the failing request.
04> Repair
  Generate a focused patch plus a regression test.
05> Verify
   Run tests, security checks, performance checks, and adversarial cases.
06> Deliver
   Create a branch / PR with evidence, risk, and confidence.




# SentinelAI

**Autonomous Software Reliability Engineer.** Detect. Investigate. Reproduce. Repair. Verify.

SentinelAI turns production incidents into evidence-backed diagnoses, reproducible failures, validated patches with regression tests, and review-ready branches or pull requests. A human approves every external write. Nothing is merged or deployed automatically.

## Status

Local development build (hosting and deployment are intentionally deferred). Build progress is tracked in `docs/TASKS.md`.

## Documentation

| Doc | Purpose |
|---|---|
| `AGENTS.md` | Rules for AI coding agents working in this repo |
| `docs/PRD.md` | Product requirements |
| `docs/ARCHITECTURE.md` | System design and boundaries |
| `docs/DATA_MODEL.md` | Database schemas |
| `docs/API_CONTRACT.md` | Public, internal, and ingest APIs |
| `docs/AGENT_SYSTEM.md` | Pipeline, agents, tools, gates |
| `docs/SECURITY.md` | Threat model and sandbox spec |
| `docs/UI_SPEC.md` | Screens and design direction |
| `docs/TESTING_AND_EVAL.md` | Tests and benchmark |
| `docs/DECISIONS.md` | Decision log |
| `docs/TASKS.md` | Phased task list |
| `docs/SETUP.md` | Env vars, setup, demo flow |

## Quickstart

See `docs/SETUP.md`. In short: install Node, Python 3.12, Git, and Docker Desktop; copy `.env.example` to `.env`; run `npm install`, `npm run infra:up`, then `npm run dev:all`.

## Stack

Next.js, TypeScript, Tailwind, TanStack Query, React Flow | Express, Better Auth, Prisma, Zod | FastAPI, SQLAlchemy, Celery, Redis, Docker SDK | PostgreSQL 16 | Provider-agnostic LLM adapter.

## Safety principles

Sandbox-first execution with no network; permissions enforced in code; evidence required for every claim; reproduction required before repair; human approval required before any branch or PR.
