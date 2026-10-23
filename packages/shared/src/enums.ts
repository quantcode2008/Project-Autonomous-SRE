// SentinelAI Shared Enums

export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const
export type Role = (typeof Role)[keyof typeof Role]

export const RepoProvider = {
  LOCAL: 'LOCAL',
  GITHUB: 'GITHUB',
} as const
export type RepoProvider = (typeof RepoProvider)[keyof typeof RepoProvider]

export const ProjectKind = {
  DEMO: 'DEMO',
  CUSTOM: 'CUSTOM',
} as const
export type ProjectKind = (typeof ProjectKind)[keyof typeof ProjectKind]

export const Severity = {
  SEV1: 'SEV1',
  SEV2: 'SEV2',
  SEV3: 'SEV3',
} as const
export type Severity = (typeof Severity)[keyof typeof Severity]

export const IncidentStatus = {
  DETECTED: 'DETECTED',
  INVESTIGATING: 'INVESTIGATING',
  REPRODUCING: 'REPRODUCING',
  REPAIRING: 'REPAIRING',
  VERIFYING: 'VERIFYING',
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  PR_CREATED: 'PR_CREATED',
  RESOLVED: 'RESOLVED',
  ESCALATED: 'ESCALATED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  DISMISSED: 'DISMISSED',
} as const
export type IncidentStatus = (typeof IncidentStatus)[keyof typeof IncidentStatus]

export const EvidenceKind = {
  LOG_RANGE: 'LOG_RANGE',
  TRACE: 'TRACE',
  METRIC: 'METRIC',
  DEPLOY_DIFF: 'DEPLOY_DIFF',
  CODE_LOCATION: 'CODE_LOCATION',
  SANDBOX_RUN: 'SANDBOX_RUN',
  TEST_RESULT: 'TEST_RESULT',
  SCAN_RESULT: 'SCAN_RESULT',
} as const
export type EvidenceKind = (typeof EvidenceKind)[keyof typeof EvidenceKind]

export const HypothesisStatus = {
  PROPOSED: 'PROPOSED',
  SUPPORTED: 'SUPPORTED',
  REFUTED: 'REFUTED',
  CONFIRMED: 'CONFIRMED',
} as const
export type HypothesisStatus = (typeof HypothesisStatus)[keyof typeof HypothesisStatus]

export const ConfidenceLabel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const
export type ConfidenceLabel = (typeof ConfidenceLabel)[keyof typeof ConfidenceLabel]

export const GateStatus = {
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  WARNING: 'WARNING',
  SKIPPED: 'SKIPPED',
} as const
export type GateStatus = (typeof GateStatus)[keyof typeof GateStatus]

export const VerificationOverall = {
  PASSED: 'PASSED',
  PASSED_WITH_WARNINGS: 'PASSED_WITH_WARNINGS',
  FAILED: 'FAILED',
} as const
export type VerificationOverall = (typeof VerificationOverall)[keyof typeof VerificationOverall]

export const DeliveryMode = {
  LOCAL: 'LOCAL',
  GITHUB: 'GITHUB',
} as const
export type DeliveryMode = (typeof DeliveryMode)[keyof typeof DeliveryMode]

export const MemoryOutcome = {
  RESOLVED: 'RESOLVED',
  ESCALATED: 'ESCALATED',
  DISMISSED: 'DISMISSED',
  FAILED: 'FAILED',
} as const
export type MemoryOutcome = (typeof MemoryOutcome)[keyof typeof MemoryOutcome]
