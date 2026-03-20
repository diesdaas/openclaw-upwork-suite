import type { Capability, MatchResult } from "@openclaw-upwork-suite/shared-types";
import type { JobDetail } from "../types";
import { newProposalDraft } from "@openclaw-upwork-suite/shared-types";

export function generateProposalDraft(
  job: JobDetail,
  match: MatchResult,
  capabilities: Capability[]
) {
  const evidence = capabilities
    .filter(c => match.matchedCapabilities.includes(c.name))
    .flatMap(c => c.evidence)
    .slice(0, 3);

  const coverLetter = [
    `Hi,`,
    ``,
    `your project looks like a strong fit for my current OpenClaw and automation capabilities.`,
    `I focus on practical delivery: reviewing the setup, reproducing the bottleneck, stabilizing the core workflow, and then improving reliability and maintainability.`,
    ``,
    `Relevant strengths for this job: ${match.matchedCapabilities.join(", ")}.`,
    evidence.length ? `Relevant evidence: ${evidence.join(" | ")}.` : "",
    ``,
    `Suggested first milestone: audit the setup, identify blockers, create a stable baseline, and return a concrete remediation plan.`,
    ``,
    `Best,`
  ].filter(Boolean).join("\n");

  return newProposalDraft({
    jobId: job.id,
    coverLetter,
    firstMilestone: "Audit workflow, reproduce issue, stabilize baseline, propose next implementation steps.",
    assumptions: [
      "Client can share workflow details or repo access.",
      "Required integrations are available during delivery."
    ],
    createdBy: "orchestrator"
  });
}
