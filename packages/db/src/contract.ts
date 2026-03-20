export type JobFingerprintStatus = "new" | "updated" | "seen" | "dismissed" | "drafted" | "submitted";
export type JobWorkflowStatus = "new" | "in_progress" | "awaiting_review" | "submitted" | "archived";

export type ReviewItemType = "proposal" | "client_reply" | "profile_update";
export type ReviewStatus = "pending" | "in_progress" | "completed" | "blocked";
export type ReviewPriority = "low" | "medium" | "high" | "critical";

interface ClientThread {
  threadId: string;
  relatedEntityId: string;
  relatedEntityType: string;
  messages: unknown[];
  approvedFacts: string[];
  projectStatus: string;
  disclosurePolicyLevel: string;
}

interface ReviewQueueItem {
  itemId: string;
  itemType: ReviewItemType;
  sourceModule: string;
  sourceId: string;
  priority: ReviewPriority;
  reviewStatus: ReviewStatus;
}

export interface Store {
  init(): void;
  saveJobFingerprint(jobId: string, hash: string, status: JobFingerprintStatus): void;
  saveProposalDraft(draftId: string, jobId: string, draft: unknown): void;
  saveSubmissionResult(requestId: string, result: unknown): void;
  getProposalDraft(draftId: string): unknown | null;
}

export interface ClientMessagingStore {
  loadThread(threadId: string): ClientThread | null;
  saveReplyDraft(draft: unknown): void;
  saveEscalation(threadId: string, escalation: unknown): void;
}

export interface ReviewQueueStore {
  enqueueItem(item: Omit<ReviewQueueItem, "createdAt" | "updatedAt">): void;
  loadPending(limit?: number): ReviewQueueItem[];
  saveDecision(itemId: string, decision: unknown): void;
  markReleased(itemId: string): void;
  markBlocked(itemId: string, reason: string): void;
}

export function createStore(_db: unknown): Store {
  return {
    init() {},
    saveJobFingerprint() {},
    saveProposalDraft() {},
    saveSubmissionResult() {},
    getProposalDraft() { return null; },
  };
}

export function createClientMessagingStore(_db: unknown, _threadId?: string): ClientMessagingStore {
  return {
    loadThread() { return null; },
    saveReplyDraft() {},
    saveEscalation() {},
  };
}

export function createReviewQueueStore(_db: unknown): ReviewQueueStore {
  return {
    enqueueItem() {},
    loadPending() { return []; },
    saveDecision() {},
    markReleased() {},
    markBlocked() {},
  };
}
