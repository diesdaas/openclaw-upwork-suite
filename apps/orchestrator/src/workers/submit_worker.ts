// Canonical: @openclaw-upwork-suite/shared-types SubmissionGateRequest
import { Store } from "../db/store.js";
import { submitProposal } from "../tools/proposal_submit.js";
import type { ProposalDraft } from "@openclaw-upwork-suite/shared-types";
import { safeCheckProposal, enforceProposalMinLength } from "@openclaw-upwork-suite/policies";
import { createSubmissionGateRequest } from "@openclaw-upwork-suite/shared-types";

export async function runSubmitWorker(accessToken: string, tenantId: string) {
  const store = new Store("data/state.sqlite");
  store.init();

  const jobs = store.getApprovedSubmitJobs();

  for (const row of jobs) {
    try {
      const draft = JSON.parse(row.draft_json) as ProposalDraft;

      // safe-check via canonical policy — includes "we built the exact same thing"
      const text = `${draft.coverLetter}\n${draft.firstMilestone ?? ""}`;
      const check = safeCheckProposal(text);
      if (!check.allowed) {
        const phrase = check.blockedPhrases[0];
        throw new Error(`Safe-check blocked phrase: ${phrase}`);
      }
      if (!enforceProposalMinLength(draft.coverLetter)) {
        throw new Error("Cover letter too short");
      }

      store.markQueued(row.upwork_job_id);

      const result = await submitProposal(draft, {
        humanApproved: true,
        accessToken,
        tenantId
      });

      if (result?.queued) {
        // Emit SubmissionGateRequest — orchestrator owns Upwork submission call
        const gateRequest = createSubmissionGateRequest(draft.draftId, draft.jobId);
        gateRequest.approvalStatus = "approved";
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
