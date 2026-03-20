import type { Capability, JobDetail, MatchResult } from "../types";
import { config } from "../config";

function includesAny(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.some(w => lower.includes(w.toLowerCase()));
}

export function matchJobToCapabilities(job: JobDetail, capabilities: Capability[]): MatchResult {
  const active = capabilities.filter(c => c.active);
  const matched = active.filter(c =>
    includesAny(`${job.title}\n${job.description}\n${job.skills.join(" ")}`, [...c.keywords, c.name])
  );

  const capabilityFit =
    active.length === 0 ? 0 : Math.min(1, matched.length / Math.max(3, active.length / 3));

  const riskyTerms = ["medical diagnosis", "legal advice", "adult", "gambling", "guaranteed results"];
  const deliveryRisk = includesAny(job.description, riskyTerms) ? 0.8 : 0.2;

  const evidenceCount = matched.reduce((n, c) => n + c.evidence.length, 0);
  const proposalStrength = Math.min(1, evidenceCount / 6);

  const recommended =
    capabilityFit >= config.gates.minCapabilityFit &&
    deliveryRisk <= config.gates.maxDeliveryRisk &&
    proposalStrength >= config.gates.minProposalStrength;

  return {
    jobId: job.id,
    capabilityFit,
    deliveryRisk,
    proposalStrength,
    reasons: [
      `Matched ${matched.length} active capabilities`,
      `Evidence count: ${evidenceCount}`,
      `Risk score: ${deliveryRisk.toFixed(2)}`
    ],
    matchedCapabilities: matched.map(c => c.name),
    missingCapabilities: [],
    recommended
  };
}
