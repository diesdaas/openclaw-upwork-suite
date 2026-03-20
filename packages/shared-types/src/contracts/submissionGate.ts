export type SubmissionGateStatus = "pending" | "approved" | "rejected";

export interface SubmissionGateRequest {
  id: string;
  draftId: string;
  jobId: string;
  approvalStatus: SubmissionGateStatus;
  blockingReasons: string[];
  requestedAt: Date;
}

export interface SubmissionGateDecision {
  requestId: string;
  decision: "approved" | "rejected";
  reasons: string[];
  decidedBy: string;
  decidedAt: Date;
}

export interface SubmissionResult {
  jobId: string;
  draftId: string;
  submittedAt?: Date;
  upworkProposalId?: string;
  status: "queued" | "submitted" | "failed";
  failureReason?: string;
}

export function createSubmissionGateRequest(
  draftId: string,
  jobId: string,
): SubmissionGateRequest {
  return {
    id: crypto.randomUUID(),
    draftId,
    jobId,
    approvalStatus: "pending",
    blockingReasons: [],
    requestedAt: new Date(),
  };
}
