import type { MatchResult } from "./common.js";

export interface ScoutToWriterHandoff {
  jobId: string;
  jobSummary: string;
  normalizedJobDescription: string;
  matchedCapabilities: string[];
  evidence: string[];
  deliveryRisks: string[];
  assumptions: string[];
  approvalState: "pending" | "approved" | "rejected";
  metadata: Record<string, unknown>;
}

export interface ScoutHandoffMetadata {
  capabilityFit: number;
  deliveryRisk: number;
  proposalStrength: number;
  sourcedFrom: string;
  searchedAt: string;
}
