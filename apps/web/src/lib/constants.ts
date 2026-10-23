import type { PipelineStep, RoleContent, FAQItem, BentoFeature, Integration, TerminalLine } from '@/types'

/* ─── Pipeline ─── */
export const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'detect',
    title: 'Detect',
    description: 'Monitors logs, metrics, and traces in real time. Catches anomalies before your users do.',
    icon: '🔍',
  },
  {
    id: 'investigate',
    title: 'Investigate',
    description: 'Traces the root cause across services, commits, and deploys. Builds a causal evidence chain.',
    icon: '🔬',
  },
  {
    id: 'reproduce',
    title: 'Reproduce',
    description: 'Spins up a sandboxed environment and replays the failure. Confirms the bug is real.',
    icon: '🔄',
  },
  {
    id: 'fix',
    title: 'Fix',
    description: 'Generates a targeted fix with tests, opens a PR with a confidence score and audit trail.',
    icon: '🔧',
  },
  {
    id: 'prevent',
    title: 'Prevent',
    description: 'Adds regression tests and monitoring rules. The same bug never reaches production again.',
    icon: '🛡️',
  },
]

/* ─── Roles ─── */
export const ROLES: RoleContent[] = [
  {
    id: 'developer',
    label: 'Developer',
    headline: 'Ship features, not hotfixes.',
    benefits: [
      'PRs with root-cause analysis, not just stack traces',
      'Regression tests auto-generated from real incidents',
      'Sandboxed reproduction — no more "works on my machine"',
    ],
    cta: 'Start shipping faster',
  },
  {
    id: 'sre',
    label: 'SRE',
    headline: 'Reclaim your on-call nights.',
    benefits: [
      'Automated incident response in under 60 seconds', /* placeholder */
      'Full audit trail from alert to verified fix',
      'Error budgets protected by autonomous prevention',
    ],
    cta: 'Protect your SLOs',
  },
  {
    id: 'devops',
    label: 'DevOps',
    headline: 'Pipelines that heal themselves.',
    benefits: [
      'Integrates with your existing CI/CD and observability stack',
      'Zero-config Docker sandbox for safe reproduction',
      'Deploys fixes with rollback-safe confidence scores',
    ],
    cta: 'Automate your reliability',
  },
  {
    id: 'startup',
    label: 'Startup',
    headline: 'Enterprise reliability, startup speed.',
    benefits: [
      'An SRE team on autopilot — no headcount needed', /* placeholder */
      'Faster incident resolution means faster growth',
      'Free tier available for early-stage teams', /* placeholder */
    ],
    cta: 'Get early access',
  },
]

/* ─── FAQ ─── */
export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How does SentinelAI detect bugs before users report them?',
    answer: 'SentinelAI continuously monitors your logs, metrics, and distributed traces using AI-powered anomaly detection. It correlates signals across services to identify issues the moment they surface — often before they impact real users.', /* placeholder */
  },
  {
    id: 'faq-2',
    question: 'Does SentinelAI have access to my source code?',
    answer: 'SentinelAI reads your codebase to generate targeted fixes and regression tests. All access is scoped, auditable, and follows the principle of least privilege. Self-hosted and air-gapped deployments are available for enterprise teams.', /* placeholder */
  },
  {
    id: 'faq-3',
    question: 'How does the sandboxed reproduction work?',
    answer: 'When SentinelAI identifies a bug, it spins up an isolated Docker environment mirroring your production setup, replays the failing scenario, and confirms the root cause. No risk to your live systems.', /* placeholder */
  },
  {
    id: 'faq-4',
    question: 'What integrations are supported?',
    answer: 'SentinelAI integrates with GitHub, GitLab, Docker, Kubernetes, OpenTelemetry, Prometheus, Grafana, PagerDuty, Slack, and more. Custom integrations are available via webhook and API.', /* placeholder */
  },
  {
    id: 'faq-5',
    question: 'What does the confidence score on a PR mean?',
    answer: 'Every fix PR includes a confidence score (0-100%) based on test coverage, reproduction success rate, and code-change risk analysis. Your team sets the threshold for auto-merge vs. manual review.', /* placeholder */
  },
]

/* ─── Bento Features ─── */
export const BENTO_FEATURES: BentoFeature[] = [
  {
    id: 'root-cause',
    title: 'Root-cause evidence',
    description: 'AI-generated causal chain from symptom to source, with links to the exact commit and config change.',
    icon: 'search',
    span: 'wide',
  },
  {
    id: 'sandbox',
    title: 'Docker sandbox reproduction',
    description: 'Every bug reproduced in an isolated container before any fix is attempted.',
    icon: 'container',
    span: 'normal',
  },
  {
    id: 'regression',
    title: 'Regression tests',
    description: 'Automatically generated tests that lock in the fix and prevent recurrence.',
    icon: 'test',
    span: 'normal',
  },
  {
    id: 'pr-confidence',
    title: 'PR with confidence score',
    description: 'Every pull request includes a 0-100% confidence score based on reproduction, tests, and risk.',
    icon: 'gauge',
    span: 'wide',
  },
  {
    id: 'audit',
    title: 'Full audit trail',
    description: 'Every decision SentinelAI makes is logged, explainable, and reviewable by your team.',
    icon: 'log',
    span: 'normal',
  },
  {
    id: 'permissions',
    title: 'Granular permissions',
    description: 'Control what SentinelAI can access, fix, and deploy. Principle of least privilege built in.',
    icon: 'lock',
    span: 'normal',
  },
]

/* ─── Integrations ─── */
export const INTEGRATIONS: Integration[] = [
  { name: 'GitHub', icon: 'github' },
  { name: 'Docker', icon: 'docker' },
  { name: 'OpenTelemetry', icon: 'opentelemetry' },
  { name: 'Prometheus', icon: 'prometheus' },
  { name: 'Grafana', icon: 'grafana' },
  { name: 'Slack', icon: 'slack' },
  { name: 'Kubernetes', icon: 'kubernetes' },
  { name: 'PagerDuty', icon: 'pagerduty' },
]

/* ─── Terminal Lines ─── */
export const TERMINAL_LINES: TerminalLine[] = [
  { text: '[09:14:02] ALERT  Latency spike detected on /api/checkout  p99 > 2400ms', type: 'error', delay: 0 },
  { text: '[09:14:03] INFO   Investigating... correlating traces across 4 services', type: 'info', delay: 800 },
  { text: '[09:14:05] INFO   Root cause: N+1 query in OrderService.getLineItems()', type: 'info', delay: 1600 },
  { text: '[09:14:06] INFO   Commit: a3f2c91 — "Add eager loading for line items"', type: 'info', delay: 2200 },
  { text: '[09:14:08] INFO   Spinning up sandbox... Docker image: checkout-service:a3f2c91', type: 'info', delay: 2800 },
  { text: '[09:14:12] SUCCESS  Bug reproduced in sandbox — p99 latency: 2,847ms', type: 'success', delay: 3600 },
  { text: '[09:14:14] INFO   Generating fix... adding .includes(:line_items) to query', type: 'info', delay: 4200 },
  { text: '[09:14:16] INFO   Running test suite... 847 passed, 0 failed, 3 new regression tests', type: 'info', delay: 4800 },
  { text: '[09:14:18] SUCCESS  Fix verified — p99 latency: 142ms (↓ 95%)', type: 'success', delay: 5400 },
  { text: '[09:14:19] SUCCESS  PR #1847 opened — Confidence: 96% — Ready for review', type: 'success', delay: 6000 },
]

/* ─── Trust Metrics (all placeholders) ─── */
export const TRUST_METRICS = [
  { value: '< 60s', label: 'Mean time to detect', placeholder: true },
  { value: '94%', label: 'Auto-fix success rate', placeholder: true },
  { value: '0', label: 'False positive deploys', placeholder: true },
]

/* ─── Trust Logos (placeholders) ─── */
export const TRUST_LOGOS = [
  'Acme Corp',
  'Nebula Systems',
  'Quantum Labs',
  'Apex Engineering',
  'Stratos Cloud',
]

/* ─── Navigation ─── */
export const NAV_LINKS = [
  { label: 'How it works', href: '#pipeline' },
  { label: 'Features', href: '#features' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'FAQ', href: '#faq' },
]

/* ─── Footer Links ─── */
export const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Integrations', href: '#integrations' },
    { label: 'Pricing', href: '#' }, /* placeholder */
    { label: 'Changelog', href: '#' }, /* placeholder */
  ],
  company: [
    { label: 'About', href: '#' }, /* placeholder */
    { label: 'Blog', href: '#' }, /* placeholder */
    { label: 'Careers', href: '#' }, /* placeholder */
    { label: 'Contact', href: '#' }, /* placeholder */
  ],
  resources: [
    { label: 'Documentation', href: '#' }, /* placeholder */
    { label: 'API Reference', href: '#' }, /* placeholder */
    { label: 'Status', href: '#' }, /* placeholder */
    { label: 'Security', href: '#' }, /* placeholder */
  ],
  legal: [
    { label: 'Privacy', href: '#' }, /* placeholder */
    { label: 'Terms', href: '#' }, /* placeholder */
  ],
}
