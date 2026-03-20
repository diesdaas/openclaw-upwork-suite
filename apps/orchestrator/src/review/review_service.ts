import { Store } from "../db/store";
import type { ApprovalDecision } from "../types";

export class ReviewService {
  private store: Store;

  constructor(filename = "data/state.sqlite") {
    this.store = new Store(filename);
    this.store.init();
  }

  listPending() {
    return this.store.listPendingReviewDetailed();
  }

  listDrafts() {
    return this.store.listUnnotifiedDrafts();
  }

  markDraftNotified(jobId: string) {
    this.store.markNotificationSent(jobId, "draft_ready");
  }

  approveDraft(jobId: string, notes = "") {
    const decision: ApprovalDecision = {
      jobId,
      makesSense: true,
      approvedToDraft: true,
      approvedToSubmit: false,
      notes
    };
    this.store.saveReview(decision);
    this.store.updateFingerprintStatus(jobId, "seen");
  }

  approveSubmit(jobId: string, notes = "") {
    const decision: ApprovalDecision = {
      jobId,
      makesSense: true,
      approvedToDraft: true,
      approvedToSubmit: true,
      notes
    };
    this.store.saveReview(decision);
  }

  reject(jobId: string, notes = "") {
    const decision: ApprovalDecision = {
      jobId,
      makesSense: false,
      approvedToDraft: false,
      approvedToSubmit: false,
      notes
    };
    this.store.saveReview(decision);
    this.store.updateFingerprintStatus(jobId, "dismissed");
  }
}
