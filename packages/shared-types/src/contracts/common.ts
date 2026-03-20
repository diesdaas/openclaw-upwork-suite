export const SCHEMA_VERSION = "v1alpha1";

export type CapabilityCategory = "agent" | "skill" | "tool" | "integration" | "infra";

export interface Capability {
  id: string;
  name: string;
  category: CapabilityCategory;
  description: string;
  inputs: string[];
  outputs: string[];
  keywords: string[];
  evidence: string[];
  confidence: number;
  active: boolean;
}

export interface UpworkJob {
  id: string;
  title: string;
  description: string;
  skills: string[];
  budgetUsd?: number;
  hourlyMin?: number;
  hourlyMax?: number;
  url?: string;
  postedAt?: string;
}

export interface SearchProfile {
  id: string;
  name: string;
  query: string;
  enabled: boolean;
}

export interface ToolResult<T = unknown> {
  ok: boolean;
  tool: string;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

export interface MatchResult {
  jobId: string;
  capabilityFit: number;
  deliveryRisk: number;
  proposalStrength: number;
  reasons: string[];
  matchedCapabilities: string[];
  missingCapabilities: string[];
  recommended: boolean;
}

export interface ApprovalDecision {
  jobId: string;
  makesSense: boolean;
  approvedToDraft: boolean;
  approvedToSubmit: boolean;
  notes?: string;
}

export interface ThreadSummary {
  confirmedRequirements: string[];
  missingInformation: string[];
  blockers: string[];
  assumptions: string[];
  nextSteps: string[];
}

export interface Escalation {
  escalate: boolean;
  reasons: string[];
}
