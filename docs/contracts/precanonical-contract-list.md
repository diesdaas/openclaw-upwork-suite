# Precanonical Contract List

This document defines the stable schemas required to ensure safe data passing between the isolated agent modules.

```typescript
// scout_to_writer_handoff schema
export interface ScoutToWriterHandoff {
  jobId: string;
  jobDescription: string;
  clientRequirements: string[];
  scoutNotes?: string;
  recommendedCapabilities: string[];
}

// proposal_draft schema
export interface ProposalDraft {
  jobId: string;
  draftId: string;
  content: string;
  estimatedPrice?: number;
  status: 'drafted' | 'pending_review' | 'approved' | 'rejected' | 'submitted';
}

// client_thread schema
export interface ClientThread {
  threadId: string;
  clientId: string;
  jobId: string;
  status: 'active' | 'archived';
}

// client_reply_draft schema
export interface ClientReplyDraft {
  threadId: string;
  proposedMessage: string;
  contextUsed: string[];
  status: 'pending_review' | 'approved' | 'sent';
}

// review_decision schema
export interface ReviewDecision {
  itemId: string; // Could be a proposal draft ID or a reply draft ID
  itemType: 'proposal' | 'client_reply';
  decision: 'approve' | 'reject' | 'revise';
  feedback?: string;
}

// common env/config contract
export interface CommonEnvContract {
  OPENAI_API_KEY: string;
  DATABASE_URL: string;
  UPWORK_API_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
}

// common DB access contract
export interface CommonDbContract {
  getJob(id: string): Promise<any>;
  saveProposal(draft: ProposalDraft): Promise<void>;
  updateProposalStatus(id: string, status: string): Promise<void>;
  saveClientMessage(threadId: string, message: any): Promise<void>;
}

// SubmissionGateRequest
export interface SubmissionGateRequest {
  proposalId: string;
  jobId: string;
  reviewDecisionId: string; // Must reference a positive ReviewDecision
  finalContent: string;
}
```
