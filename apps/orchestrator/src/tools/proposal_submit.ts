import type { ProposalDraft } from "@openclaw-upwork-suite/shared-types";

export async function submitProposal(
  draft: ProposalDraft,
  opts: { humanApproved: boolean; accessToken: string; tenantId: string }
) {
  if (!opts.humanApproved) {
    throw new Error("Blocked: explicit human approval required.");
  }

  // Replace with the real mutation exposed by your Upwork scopes.
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
