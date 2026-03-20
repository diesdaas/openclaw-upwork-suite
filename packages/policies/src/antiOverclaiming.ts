export const BLOCKED_PROPOSAL_PHRASES: string[] = [
  "guarantee",
  "guaranteed results",
  "top 1%",
  "24/7 available",
  "we built the exact same thing",
];

export const BLOCKED_REPLY_PHRASES: string[] = [
  "fixed price",
  "deadline",
  "guarantee",
];

export interface SafeCheckResult {
  allowed: boolean;
  blockedPhrases: string[];
}

export function safeCheckProposal(text: string): SafeCheckResult {
  const lower = text.toLowerCase();
  const blocked = BLOCKED_PROPOSAL_PHRASES.filter((p) => lower.includes(p));
  return { allowed: blocked.length === 0, blockedPhrases: blocked };
}

export function safeCheckReply(text: string): SafeCheckResult {
  const lower = text.toLowerCase();
  const blocked = BLOCKED_REPLY_PHRASES.filter((p) => lower.includes(p));
  return { allowed: blocked.length === 0, blockedPhrases: blocked };
}

export function enforceProposalMinLength(coverLetter: string, min = 80): boolean {
  return coverLetter.trim().length >= min;
}
