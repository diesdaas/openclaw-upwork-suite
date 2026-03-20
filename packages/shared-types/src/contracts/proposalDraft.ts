export type ApprovalState = "draft" | "pending_review" | "approved" | "rejected";

export interface ProposalDraft {
  draftId: string;
  jobId: string;
  version: number;
  coverLetter: string;
  firstMilestone: string;
  assumptions: string[];
  qualityFlags: string[];
  approvalState: ApprovalState;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalDraftCreate {
  jobId: string;
  coverLetter: string;
  firstMilestone: string;
  assumptions: string[];
  createdBy: string;
}

export interface ProposalDraftUpdate {
  draftId: string;
  version: number;
  coverLetter: string;
  firstMilestone: string;
  assumptions: string[];
}

export function newProposalDraft(input: ProposalDraftCreate): ProposalDraft {
  const now = new Date();
  return {
    draftId: crypto.randomUUID(),
    jobId: input.jobId,
    version: 1,
    coverLetter: input.coverLetter,
    firstMilestone: input.firstMilestone,
    assumptions: input.assumptions,
    qualityFlags: [],
    approvalState: "draft",
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
}
