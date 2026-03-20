# Precanonical Contract List

This document defines the stable schemas required to ensure safe data passing between the isolated agent modules.

## 1. ScoutToWriterHandoff
```typescript
export interface ScoutToWriterHandoff {
  jobId: string;
  jobSummary: string;
  normalizedJobDescription: string;
  matchedCapabilities: string[];
  evidence: string[];
  deliveryRisks: string[];
  assumptions: string[];
  approvalState: 'pending' | 'approved' | 'rejected';
  metadata: Record<string, unknown>;
}
```

## 2. ProposalDraft
```typescript
export interface ProposalDraft {
  jobId: string;
  draftVersion: number;
  coverLetter: string;
  firstMilestone: string;
  assumptions: string[];
  qualityFlags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 3. ClientThread
```typescript
export interface ClientMessage {
  messageId: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export interface ClientThread {
  threadId: string;
  relatedId: string; // related job or proposal id
  clientIdentityMetadata: Record<string, unknown>;
  messages: ClientMessage[];
  approvedFacts: string[];
  projectStatus: 'active' | 'archived' | 'pending';
  disclosurePolicyLevel: 'low' | 'medium' | 'high' | 'strict';
  createdAt: Date;
  updatedAt: Date;
}
```

## 4. ClientReplyDraft
```typescript
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
```

## 5. ReviewQueueItem
```typescript
export interface ReviewQueueItem {
  itemId: string;
  itemType: 'proposal' | 'reply' | 'profile_update';
  sourceModule: string;
  sourceId: string;
  payloadReference?: string;
  embeddedPayload?: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reviewStatus: 'pending' | 'in_progress' | 'completed' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}
```

## 6. ReviewDecision
```typescript
export interface ReviewDecision {
  itemId: string;
  decision: 'pass' | 'revise' | 'escalate' | 'block';
  issues: string[];
  rationale: string;
  allowedNextStep: string;
  reviewer: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 7. SubmissionGateRequest
```typescript
export interface SubmissionGateRequest {
  id: string; // proposal or item id
  approvalStatus: 'approved' | 'rejected' | 'pending';
  blockingReasons: string[];
  allowedAction: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 8. CommonEnvContract
```json
{
  "database": {
    "DATABASE_URL": "Primary connection string for PostgreSQL",
    "REDIS_URL": "Connection string for caching and queues"
  },
  "upworkAuth": {
    "UPWORK_API_KEY": "Upwork application key",
    "UPWORK_API_SECRET": "Upwork application secret",
    "UPWORK_ACCESS_TOKEN": "OAuth access token",
    "UPWORK_ACCESS_SECRET": "OAuth access secret"
  },
  "upworkContext": {
    "UPWORK_TENANT_ID": "Default tenant ID",
    "UPWORK_ORG_ID": "Default organization ID"
  },
  "telegram": {
    "TELEGRAM_BOT_TOKEN": "Bot token for notifications and approvals",
    "TELEGRAM_ADMIN_CHAT_ID": "Chat ID for the main admin/reviewer"
  },
  "modelConfig": {
    "OPENAI_API_KEY": "OpenAI API key",
    "ANTHROPIC_API_KEY": "Anthropic API key",
    "DEFAULT_MODEL": "Default model to use (e.g. gpt-4o)"
  },
  "featureFlags": {
    "ENABLE_AUTO_SUBMIT": "Boolean to enable/disable autonomous submission",
    "ENABLE_GHOST_MODE": "Boolean to run without making external state changes"
  },
  "runModes": {
    "APP_ENV": "development | staging | production",
    "LOG_LEVEL": "debug | info | warn | error"
  }
}
```

## 9. CommonDbContract
```markdown
| Module | Writes | Reads | Ephemeral vs Long-Lived | Authoritative Fields |
| :--- | :--- | :--- | :--- | :--- |
| **Scout** | `Jobs`, `Capabilities` | `Policies` | Long-lived | `jobId`, `jobSummary` |
| **Writer** | `ProposalDrafts` | `Jobs`, `ScoutHandoffs` | Ephemeral (until approved) | `draftVersion`, `coverLetter` |
| **Client Comm** | `ClientThreads`, `ReplyDrafts` | `Proposals`, `ClientIdentity` | Long-lived | `threadId`, `messages` |
| **Review Queue** | `ReviewItems`, `Decisions` | `Drafts`, `ClientThreads` | Ephemeral (resolved quickly) | `decision`, `reviewer` |
| **Submission** | `SubmissionLogs` | `Decisions`, `GateRequests` | Long-lived (Audit) | `approvalStatus`, `timestamp` |
```

## 10. PolicyContract
```typescript
export interface PolicyContract {
  antiOverclaiming: {
    maxYearsExperienceCap: number;
    forbiddenTerms: string[];
    requireEvidenceForSkills: boolean;
  };
  antiLeakMinimalDisclosure: {
    maskClientNames: boolean;
    redactFinancials: boolean;
    allowedPortfolioLinks: string[];
  };
  approvalGates: {
    requireHumanForFirstMessage: boolean;
    requireHumanForBudgetsOver: number;
    autoApproveFollowUps: boolean;
  };
  escalationTriggers: {
    clientAngrySentimentThreshold: number;
    unrecognizedRequirementsCount: number;
    budgetMismatchPercentage: number;
  };
  riskyPhraseChecks: {
    bannedPhrases: string[];
    competitorMentions: string[];
    urgencyRedFlags: string[];
  };
}
```