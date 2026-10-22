# SentinelAI: Testing and Evaluation

Version 1.0 · 2026-10-16.

## 1. Test strategy

| Layer | Tooling | What to cover |
|---|---|---|
| API unit/integration | Vitest + Supertest, test DB | Validation, auth failures, ownership, roles, disabled users, quotas, kill switch, key hashing, token encryption, SSE auth |
| Engine unit | pytest | Redaction, fingerprinting, stack parsing, detector windows, severity, state machine guards, gates logic, policy checks, evidence ID validation, confidence rules |
| Engine integration | pytest + Docker | Sandbox security, replay harness, signature matching, dependency image caching, git mirror/worktrees, delivery to a temp repo |
| Agent tests | pytest + `fake` LLM provider | Scripted tool-calling sequences, budget exhaustion, cancellation, prompt-injection fixtures, hallucinated IDs rejected |
| Contract | OpenAPI-generated types + fixtures | API and engine agree on shapes; ingest schema fixtures |
| Web unit | Vitest + Testing Library | Forms, hooks, SSE reducer, state views |
| E2E | Playwright | Sign up (dev link), sign in, demo project, incident via scripted inject, evidence, approval, PR result |
| Accessibility | axe via Playwright | Core screens, no critical violations |
| Performance | k6 (ingest), Lighthouse (landing), query timing | Targets from PRD section 8, reported as measured |

The default CI-style command `npm run test` runs everything except real-LLM and Docker-heavy suites; those run with `npm run test:full`.

## 2. Mandatory test cases (must exist before MVP sign-off)

1. Unauthenticated access to every protected route returns 401.
2. Cross-tenant access returns 404 for every resource type, including SSE and artifacts.
3. Non-admin gets 403 on every admin endpoint; last admin cannot be demoted.
4. Disabled user cannot sign in and an active session is rejected.
5. Ingest: invalid key, revoked key, oversized body, malformed events, partial acceptance, redaction applied.
6. Detector: threshold and minimum volume; one incident per fingerprint; attach new signals; auto-resolve rule.
7. State machine: every illegal transition is rejected; version conflict handled.
8. **G1 cannot be skipped:** repair is impossible without a reproduced baseline failure with matching signature.
9. Wrong-failure case: a test that fails for a different reason does not satisfy G1/G2.
10. Gates G2-G8 each have pass and fail fixtures; overall status computed correctly.
11. Critic classification matrix (IMPROVED, OK, PRE_EXISTING, INTRODUCED_REGRESSION).
12. Approval: rejects missing flag, stale hash, failed verification, non-owner, wrong status; creates branch only after valid approval.
13. Sandbox: no network, no host path, memory kill, timeout, PID limit, non-root.
14. Prompt injection fixtures in logs, code comments, and request payloads.
15. Budget exhaustion and cancellation mid-run leave a consistent incident and no orphan containers.
16. Quota and kill switch block new investigations with the right error codes.
17. Token encryption round trip; tokens never in API responses or logs.

## 3. Benchmark: seeded incidents

Location: `benchmarks/injected_incidents/<id>/` each with `incident.yaml`, `inject.patch` (applied to the healthy demo repo), `traffic.yaml` (request mix and failing ratio), `expected.yaml` (relevant file, symbol, failure signature, reference fix hint), and `notes.md`.

| ID | Fault | Expected relevant file/symbol | Failure signature |
|---|---|---|---|
| BM-01 | Null promotion dereference in checkout pricing (flagship demo) | `app/pricing.py: calculate_price` | `AttributeError: 'NoneType' ... discount_pct` |
| BM-02 | Off-by-one in pagination of order history | `app/orders.py: list_orders` | wrong slice (assertion in replay) or `IndexError` |
| BM-03 | Division by zero for empty cart total | `app/pricing.py: average_item_price` | `ZeroDivisionError` |
| BM-04 | Missing field handling in payload parsing | `app/schemas.py: parse_cart` | `KeyError: 'qty'` |
| BM-05 | Decimal/rounding error in tax calculation | `app/tax.py: compute_tax` | assertion mismatch on total |

MVP requires BM-01 to BM-03 working end to end; BM-04 and BM-05 are stretch. The existing demo test suite must pass on every injected revision (that is why the bug slips through).

## 4. Evaluation harness (`npm run eval`)

For each benchmark incident:
1. Reset the demo repo to healthy, apply the injection, send the deploy event, run traffic until detection.
2. Run the pipeline with the configured LLM (or `fake` for plumbing tests) up to `AWAITING_APPROVAL` (no approval needed for scoring).
3. Collect metrics from the database and artifacts.
4. Write `eval/results/<timestamp>.json` and `.md` with a table and per-incident links.

Metrics and definitions:

| Metric | Definition |
|---|---|
| Detection correctness | Exactly one incident with the expected fingerprint class; zero unrelated incidents |
| File attribution | Expected file in top-1 and top-3 hypotheses' suspected files |
| Reproduction | G1 satisfied |
| Regression guard | G2 satisfied (fails baseline, passes patched, matching signature) |
| Patch success | G1-G8 overall not FAILED |
| Introduced regressions | Count of INTRODUCED_REGRESSION critic cases that survived to the final verification (must be 0) |
| Time to verified patch | `AWAITING_APPROVAL` timestamp minus incident `detected_at` |
| Cost | Tokens in/out per agent and total; estimated USD from provider price table in config |
| Tool calls | Total and per agent |
| Audit completeness | `tool_calls` rows / executed tool invocations |
| Escalations | Count and reasons |

Run each benchmark at least 3 times and report successes out of runs, plus median and range for time and cost. Do not report a single lucky run as performance.

## 5. Demo reliability

- `scripts/seed_demo.py` is idempotent and deterministic (fixed commit messages, fixed timestamps where possible).
- A "known good" recorded run (screen capture and exported evidence JSON) exists as a fallback in case of provider outages.
- Pre-flight check script verifies Docker, Redis, Postgres, runner image, LLM key, demo service health, and prints a pass/fail table.

## 6. Quality gates before each phase sign-off

- Lint, typecheck, and tests for touched packages pass.
- The phase exit criterion in `TASKS.md` is demonstrated.
- gstack review and QA completed; open risks listed.
- Docs updated for changed behavior.
