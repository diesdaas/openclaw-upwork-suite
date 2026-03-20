export interface ClientMessage {
  messageId: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export type ProjectStatus = "active" | "archived" | "pending";
export type DisclosurePolicyLevel = "low" | "medium" | "high" | "strict";
export type RelatedEntityType = "job" | "proposal" | "project";

export interface ClientThread {
  threadId: string;
  relatedEntityId: string;
  relatedEntityType: RelatedEntityType;
  clientIdentityMetadata: Record<string, unknown>;
  messages: ClientMessage[];
  approvedFacts: string[];
  projectStatus: ProjectStatus;
  disclosurePolicyLevel: DisclosurePolicyLevel;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientReplyDraft {
  threadId: string;
  replyText: string;
  intent: string;
  unansweredQuestions: string[];
  escalationNeeded: boolean;
  confidentialityFlags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export function newClientReplyDraft(
  threadId: string,
  replyText: string,
  intent: string,
  createdBy: string,
): ClientReplyDraft {
  const now = new Date();
  return {
    threadId,
    replyText,
    intent,
    unansweredQuestions: [],
    escalationNeeded: false,
    confidentialityFlags: [],
    createdBy,
    createdAt: now,
    updatedAt: now,
  };
}
