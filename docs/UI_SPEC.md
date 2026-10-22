# SentinelAI: UI Specification (product screens)

Version 1.0 · 2026-10-16. Applies to `/sign-in`, `/sign-up`, `/app/**`, and later `/admin/**`. The landing page (`/`) keeps its own scroll scenes and is not redesigned here.

## 1. Design direction

**Concept: "cold outage to warm resolution."** The landing hero moves from a cold, blue, glitchy world to a warm, calm one. The product uses the same story as a *state language*: incident states are cool and tense, verified states are warm and calm. It is a precise instrument for engineers, not a marketing page.

- **Mode:** dark-first (an ops console), with a light theme as a P1 follow-up. Do not ship both half-done.
- **Palette:** extend the landing tokens (deep navy, ice blue, warm amber, off-white). Add semantic status colors used sparingly: incident red, investigating amber, verified green, neutral slate. Read the existing tokens in `apps/web` first and extend them; do not invent a second palette.
- **Typography:** the landing's display face for page titles only; a refined sans for UI; a monospace for technical labels (IDs, SHAs, paths, logs, diffs). Use the existing font setup.
- **Texture:** restrained. Hairline borders, subtle grain only on hero-like empty states, no glassmorphism everywhere, no decorative gradients on data surfaces.
- **Density:** comfortable-compact. Tables and logs are scannable; whitespace is used to separate decision points (approve, reject).
- **Skills:** run ui-ux-pro-max-skill to extend the design system and verify accessibility; taste-skill to raise the visual quality of every screen; framer-motion for micro-interactions.

## 2. Interaction and motion rules

- Motion explains change: new evidence slides in, status chips cross-fade, stage stepper fills. 150-250 ms, ease-out.
- No Lenis, no GSAP, no parallax in `/app/**`. Inner scroll areas (logs, diffs, feeds) must scroll natively.
- Live feed: new items animate once; do not animate on re-render. Respect `prefers-reduced-motion` (no movement, instant states).
- Never animate numbers continuously; update counters at most once per second.
- Optimistic UI only for harmless actions (rename). Never for approve, cancel, or dismiss.

## 3. Global components

| Component | Notes |
|---|---|
| App shell | Left nav (Command Center, Incidents, Library, Settings), top bar with project switcher, kill-switch banner when paused, account menu |
| SeverityChip | SEV1/SEV2/SEV3 with icon + text (never color only) |
| StatusChip | Incident status with icon and label |
| StageStepper | Detect, Investigate, Reproduce, Repair, Verify, Approve, PR; current stage highlighted, failed/escalated shown explicitly |
| ConfidenceLabel | LOW/MEDIUM/HIGH with tooltip explaining the rule (no percentages) |
| EvidenceLink | Chip with kind icon and short ID; opens the evidence drawer |
| CodeBlock / DiffView | Monospace, line numbers, copy, keyboard scroll; diff via `react-diff-viewer-continued` or equivalent |
| LogViewer | Virtualized, search, level filter, follow/pause tail toggle |
| ActivityFeed | SSE feed with connection indicator and reconnect state |
| EmptyState / ErrorState / Skeleton | Required for every data view |
| ConfirmDialog | Focus trap, escape to close, destructive actions need explicit labels |

## 4. Screens

### 4.1 `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email`
Split layout: left a calm brand panel (reusing the hero image treatment as a plain image, no effects), right the form. Inline validation, show/hide password, clear error messages, loading states on submit. After sign-in redirect to the return URL or `/app`. Disabled accounts see a clear "account disabled" message.

### 4.2 `/app/onboarding`
Wizard (3 steps), resumable:
1. **Name your project.**
2. **Choose a source:** *Use the demo service* (one click; shows the three demo commands) or *Connect my repo* (provider, URL/path, branch, test command, `app_import`, optional token with a "stored encrypted, shown as last 4" note).
3. **Connect telemetry:** ingest key revealed once (copy button, warning), code snippet for `sentinel_client.py`, live **Waiting for first event** indicator (polls `connection-status`), then a success state with a button to the Command Center.

### 4.3 `/app` Command Center
- Header: project name, **health state** (HEALTHY/DEGRADED/INCIDENT, with a tooltip stating it is a heuristic), time window selector.
- KPI row: request rate, error rate, p95 latency, open incidents.
- Chart: requests and errors over time with **deployment markers**; hover shows exact values; keyboard-accessible data table alternative.
- Open incidents list: severity, title, service/route, onset, mini stage stepper, elapsed time.
- Recent deployments: SHA (monospace), message, time.
- Demo card (demo project only): the commands `npm run demo:traffic`, `npm run demo:inject`, `npm run demo:restore` with copy buttons.
- Refresh: polling every 10 s while the tab is visible.

### 4.4 `/app/incidents`
Filterable list (status, severity, search), cursor pagination, empty state explaining how incidents appear.

### 4.5 `/app/incidents/[id]` Investigation Workspace
Layout (desktop): header and stage stepper on top; main area with tabs; right column with the live **Activity Feed**. On tablet the feed becomes a drawer; on mobile tabs scroll horizontally and the feed is a bottom sheet.

Header: `INC-0007`, title, severity, status, elapsed timer, tokens and tool calls used, **Cancel** (when active), **Approve and create PR** (only when `AWAITING_APPROVAL`), kebab menu (Dismiss, Mark resolved, Re-run investigation).

Tabs:
1. **Timeline:** ordered entries (deploy, first error, detection, each stage change, key evidence) with evidence links.
2. **Evidence:** filter by kind, list with summaries; clicking opens a drawer with the artifact view (log range, trace waterfall, code snippet at SHA, deploy diff, sandbox run).
3. **Hypotheses:** ranked cards: statement, confidence label with rule tooltip, supporting and refuting evidence links, suspected files.
4. **Graph (P1):** React Flow root-cause graph: Deployment, Commit, File, Function, Trace, Error, Endpoint, Symptom. Edges show type; selecting an edge or node opens its evidence. Layout is deterministic; supports keyboard navigation and a list view alternative for accessibility.
5. **Reproduction:** captured request (redacted), baseline run output, **signature match** chip (expected vs actual), determinism indicator (3/3), the generated regression test.
6. **Patch:** side-by-side diff, rationale with evidence links, files and line counts, before/after run results.
7. **Verification:** gate table (G1-G8) with status icon + text, artifacts, critic classification table, risk notes (changed paths, interface changes, warnings, rollback note).
8. **Audit:** tool calls (agent, tool, summary, duration, status) and approvals.

**Approval modal:** shows overall result, gate summary, files changed, PR title (editable), delivery mode (Local branch or GitHub PR), required checkbox "I reviewed the diff and evidence", primary button **Approve and create PR**, secondary **Reject** (with note and "ask for another attempt" option). On success show the result card with branch/PR link and patch download.

States to design: investigating (active), reproduction failed (escalated with explanation), budget exhausted, cancelled, paused by kill switch, SSE reconnecting, engine unavailable.

### 4.6 `/app/library`
Searchable past incidents with outcome (Resolved, Escalated, Dismissed, Failed), fix summary, files, and date; "similar incidents" panel in the workspace.

### 4.7 `/app/projects/[id]/settings`
Sections: General, Repository (connect, verify, token last 4), Ingest keys (create, revoke), Detection thresholds, Execution (app import, test and lint commands, source dirs, protected paths), Privacy (capture request bodies, redact fields, retention), Danger zone (delete project).

### 4.8 `/app/settings`
Profile, password change, active sessions (P1), investigation quota usage.

### 4.9 `/admin/**` (Phase 8)
Users table (search, role, disable, quota), audit log explorer, platform stats, **kill switch** with confirm dialog. Visible only to ADMIN; server enforces.

## 5. Data fetching and state

- TanStack Query for all server state; one typed API client; global handler for 401 (redirect to sign-in with return URL) and 503 (paused banner).
- SSE hook with reconnect and `Last-Event-ID`, de-duplicating by `seq`.
- Forms: React Hook Form + Zod schemas from `packages/shared`.

## 6. Accessibility (WCAG 2.2 AA)

- Semantic landmarks, single `h1` per page, logical heading order, skip link.
- Visible focus appearance on every control; minimum target size 24x24 CSS px.
- Severity, status, and gate results always include an icon and text.
- Activity feed in a `role="log"` region with `aria-live="polite"`, throttled so screen readers are not flooded; provide a pause button.
- Charts have a table alternative; React Flow graph has a list alternative.
- Modals trap focus, restore it on close, and close on Escape.
- Color contrast at least 4.5:1 for text and 3:1 for UI components in the final theme.
- All motion respects `prefers-reduced-motion`.
- Run axe (or equivalent) on core screens in Phase 8.

## 7. Responsiveness

Desktop-first for the workspace (1280+), good at 1024, usable at 768, read-focused at 375. No horizontal page scroll; wide tables and code scroll inside their containers. Use fluid type (`clamp`) and container queries where helpful.

## 8. Performance

- Route-level code splitting; lazy load React Flow, diff viewer, and charts.
- Virtualize long logs and evidence lists.
- Avoid layout shift (reserve space for charts and feed).
- Target: Command Center interactive under 2 s on a mid-range laptop, measured.

## 9. Copy tone

Plain, precise, calm. Prefer "Reproduced on baseline" over "AI magic". Never claim certainty; say what the evidence shows. Mark anything AI-generated (patches, summaries) clearly.
