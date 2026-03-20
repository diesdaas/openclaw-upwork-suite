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

export interface JobDetail {
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

export interface ProposalDraft {
  jobId: string;
  subject?: string;
  coverLetter: string;
  firstMilestone: string;
  assumptions: string[];
}

export interface ApprovalDecision {
  jobId: string;
  makesSense: boolean;
  approvedToDraft: boolean;
  approvedToSubmit: boolean;
  notes?: string;
}
