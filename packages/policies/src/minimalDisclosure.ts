export const BANNED_TERMS: RegExp[] = [
  /openclaw/gi,
  /sub-?agents?/gi,
  /runner/gi,
  /prompt(s)?/gi,
  /workflow(s)?/gi,
  /toolchain/gi,
  /automation layers?/gi,
  /internal process/gi,
  /orchestration/gi,
];

export function sanitizeDisclosure(text: string): string {
  let out = text;
  for (const pattern of BANNED_TERMS) {
    out = out.replace(pattern, "approach");
  }
  return out.replace(/\s+/g, " ").trim();
}

export function hasBannedTerms(text: string): boolean {
  return BANNED_TERMS.some((p) => p.test(text));
}

interface ClientReplyDraft {
  threadId: string;
  replyText: string;
  intent: string;
  unansweredQuestions: string[];
  escalationNeeded: boolean;
  confidentialityFlags: string[];
  createdBy: string;
}

export function sanitizeReply(draft: ClientReplyDraft, clientMessage: string): ClientReplyDraft {
  const sanitized = sanitizeDisclosure(draft.replyText);

  if (/how exactly|step by step|what is your process|how do you do it/i.test(clientMessage)) {
    return {
      ...draft,
      replyText: "I use a structured approach, but the immediate next step is to confirm the setup and the main constraint. To move forward, please share the current setup and the main blocker.",
      escalationNeeded: true,
    };
  }

  return { ...draft, replyText: sanitized };
}
