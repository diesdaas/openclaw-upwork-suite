export type ReviewItemType = "proposal" | "client_reply" | "profile_update";
export type ReviewStatus = "pending" | "in_progress" | "completed" | "blocked";
export type ReviewPriority = "low" | "medium" | "high" | "critical";
export type ReviewDecisionValue = "pass" | "revise" | "escalate" | "block";

export interface ReviewQueueItem {
  itemId: string;
  itemType: ReviewItemType;
  sourceModule: string;
  sourceId: string;
  payloadReference?: string;
  embeddedPayload?: Record<string, unknown>;
  priority: ReviewPriority;
  reviewStatus: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewDecision {
  itemId: string;
  decision: ReviewDecisionValue;
  issues: string[];
  rationale: string;
  allowedNextStep: string;
  reviewer: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewGateResult {
  allowed: boolean;
  issues: string[];
  allowedNextStep?: string;
}
