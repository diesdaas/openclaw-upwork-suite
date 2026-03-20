import type { MatchResult } from "@openclaw-upwork-suite/shared-types";
import type { JobDetail } from "../types";

export function buildApprovalPrompt(job: JobDetail, match: MatchResult) {
  return {
    jobId: job.id,
    message: [
      `Job found: ${job.title}`,
      `URL: ${job.url ?? "n/a"}`,
      `Capability fit: ${match.capabilityFit.toFixed(2)}`,
      `Delivery risk: ${match.deliveryRisk.toFixed(2)}`,
      `Matched capabilities: ${match.matchedCapabilities.join(", ") || "none"}`,
      "",
      "Frage 1: Macht dieser Job Sinn für uns? (yes/no)",
      "Frage 2: Proposal-Draft erstellen? (yes/no)",
      "Frage 3: Submit weiter manuell bestätigen? (yes/no, default yes)"
    ].join("\n")
  };
}
