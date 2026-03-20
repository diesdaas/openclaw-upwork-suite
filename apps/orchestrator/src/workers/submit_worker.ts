// Canonical contract: @openclaw-upwork-suite/shared-types SubmissionGateRequest
// TODO: Replace with direct import once monorepo pnpm workspace is configured
// import type { SubmissionGateRequest } from "@openclaw-upwork-suite/shared-types/contracts/submissionGate.js";

type SubmissionGateRequest = {
  id: string;
  draftId: string;
  jobId: string;
  approvalStatus: "pending" | "approved" | "rejected";
  blockingReasons: string[];
  requestedAt: Date;
};

function createSubmissionGateRequest(draftId: string, jobId: string): SubmissionGateRequest {
  return {
    id: crypto.randomUUID(),
    draftId,
    jobId,
    approvalStatus: "pending",
    blockingReasons: [],
    requestedAt: new Date(),
  };
}

import { Store } from "../db/store.js";
import { submitProposal } from "../tools/proposal_submit.js";
import type { ProposalDraft } from "../types.js";

function safeCheck(draft: ProposalDraft) {
  const text = `${draft.coverLetter}\n${draft.firstMilestone}`.toLowerCase();
  const blockedPhrases = [
    "guarantee",
    "guaranteed results",
    "top 1%",
    "24/7 available",
    "we built the exact same thing"
  ];
  const hit = blockedPhrases.find(p => text.includes(p));
  if (hit) throw new Error(`Safe-check blocked phrase: ${hit}`);
  if (!draft.coverLetter || draft.coverLetter.length < 80) throw new Error("Cover letter too short");
}

export async function runSubmitWorker(accessToken: string, tenantId: string) {
  const store = new Store("data/state.sqlite");
  store.init();

  const jobs = store.getApprovedSubmitJobs();

  for (const row of jobs) {
    try {
      const draft = JSON.parse(row.draft_json) as ProposalDraft;
      safeCheck(draft);
      store.markQueued(row.upwork_job_id);

      const result = await submitProposal(draft, {
        humanApproved: true,
        accessToken,
        tenantId
      });

      if (result?.queued) {
        const gateRequest = createSubmissionGateRequest(row.upwork_job_id, row.upwork_job_id);
        gateRequest.approvalStatus = "approved";
        gateRequest.blockingReasons = [];
        store.setState(`gate:${gateRequest.id}`, gateRequest);
        store.markSubmitted(row.upwork_job_id);
        store.updateFingerprintStatus(row.upwork_job_id, "submitted");
      } else {
        store.markSubmitFailed(row.upwork_job_id, "Unknown submit response");
      }
    } catch (err) {
      store.markSubmitFailed(
        row.upwork_job_id,
        err instanceof Error ? err.message : String(err)
      );
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSubmitWorker(process.env.UPWORK_ACCESS_TOKEN!, process.env.UPWORK_TENANT_ID!).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
