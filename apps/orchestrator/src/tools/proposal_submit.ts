import type { ProposalDraft } from "@openclaw-upwork-suite/shared-types";

export async function submitProposal(
  draft: ProposalDraft,
  opts: { humanApproved: boolean; accessToken: string; tenantId: string }
) {
  if (!opts.humanApproved) {
    throw new Error("Blocked: explicit human approval required.");
  }

  // PLACEHOLDER: replace mutation + fetch with real Upwork GraphQL call
  if (process.env.ENABLE_REAL_SUBMISSION !== "true") {
    return { queued: false, reason: "real submission disabled — set ENABLE_REAL_SUBMISSION=true" };
  }

  const mutation = `
  mutation SubmitProposal($input: SubmitProposalInput!) {
    submitProposal(input: $input) {
      id
    }
  }`;

  const variables = {
    input: {
      jobPostingId: draft.jobId,
      coverLetter: draft.coverLetter
    }
  };

  return { queued: true, mutation, variables };
}
