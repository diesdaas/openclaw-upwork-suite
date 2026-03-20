// Canonical: @openclaw-upwork-suite/shared-types SubmissionGateRequest
import { Store } from "../db/store.js";
import { submitProposal } from "../tools/proposal_submit.js";
import type { ProposalDraft } from "@openclaw-upwork-suite/shared-types";
import { safeCheckProposal, enforceProposalMinLength } from "@openclaw-upwork-suite/policies";
import { createSubmissionGateRequest } from "@openclaw-upwork-suite/shared-types";

export async function runSubmitWorker(accessToken: string, tenantId: string) {
  const store = new Store();
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

      // Pre-submission gate: create BEFORE calling submitProposal
      let gateRequest = createSubmissionGateRequest(draft.draftId, draft.jobId);
      store.setState(`gate:${gateRequest.id}`, gateRequest);
      store.markQueued(row.upwork_job_id);

      let result;
      try {
        result = await submitProposal(draft, { humanApproved: true, accessToken, tenantId });
      } catch (err) {
        gateRequest.approvalStatus = "rejected";
        gateRequest.blockingReasons.push(err instanceof Error ? err.message : String(err));
        store.setState(`gate:${gateRequest.id}`, gateRequest);
        store.markSubmitFailed(row.upwork_job_id, err instanceof Error ? err.message : String(err));
        continue;
      }

      if (result?.queued) {
        gateRequest.approvalStatus = "approved";
        store.setState(`gate:${gateRequest.id}`, gateRequest);
        store.markSubmitted(row.upwork_job_id);
        store.updateFingerprintStatus(row.upwork_job_id, "submitted");
      } else {
        gateRequest.approvalStatus = "rejected";
        const reason = (result as { queued: boolean; reason?: string })?.reason ?? "Unknown submit response";
        gateRequest.blockingReasons.push(reason);
        store.setState(`gate:${gateRequest.id}`, gateRequest);
        store.markSubmitFailed(row.upwork_job_id, reason);
      }
    } catch (err) {
      // Catches safeCheck / enforceProposalMinLength errors
      store.markSubmitFailed(row.upwork_job_id, err instanceof Error ? err.message : String(err));
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSubmitWorker(process.env.UPWORK_ACCESS_TOKEN!, process.env.UPWORK_TENANT_ID!).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
