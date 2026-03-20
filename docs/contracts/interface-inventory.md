# Interface Inventory

Phase 1 contract audit for `openclaw-upwork-suite`. Maps implicit (code) interfaces to canonical (precanonical list) interfaces, identifying gaps and divergence.

---

## Group A: Core Engine — `upwork-job-scouter/src/`

### 1. JobDetail

| Property | Canonical | Code (orchestrator) | Code (agent) | Gap? |
|---|---|---|---|---|
| id | — | `id: string` | — | [NEEDS_DECISION] Not in precanonical |
| title | — | `title: string` | — | [NEEDS_DECISION] Not in precanonical |
| description | — | `description: string` | — | [NEEDS_DECISION] Not in precanonical |
| skills | — | `skills: string[]` | — | [NEEDS_DECISION] Not in precanonical |
| budgetUsd | — | `budgetUsd?: number` | — | [NEEDS_DECISION] Not in precanonical |
| hourlyMin | — | `hourlyMin?: number` | — | [NEEDS_DECISION] Not in precanonical |
| hourlyMax | — | `hourlyMax?: number` | — | [NEEDS_DECISION] Not in precanonical |
| url | — | `url?: string` | — | [NEEDS_DECISION] Not in precanonical |
| postedAt | — | `postedAt?: string` | — | [NEEDS_DECISION] Not in precanonical |

**Status**: NOT YET CANONICAL — defined in `src/types.ts` but has no entry in precanonical list. Needs canonicalization.

**Code implementations**:
- `upwork-job-scouter/src/types.ts:16-26` (TypeScript interface)
- `upwork-job-scouter/src/db/store.ts` — used by `upsertRawJob()`, `hashJob()`, `seenState()`, `upsertFingerprint()` (all accept `Pick<JobDetail, ...>`)

---

### 2. MatchResult

| Property | Canonical | Code (orchestrator) | Code (agent) | Gap? |
|---|---|---|---|---|
| jobId | — | `jobId: string` | — | [NEEDS_DECISION] Not in precanonical |
| capabilityFit | — | `capabilityFit: number` | — | [NEEDS_DECISION] Not in precanonical |
| deliveryRisk | — | `deliveryRisk: number` | — | [NEEDS_DECISION] Not in precanonical |
| proposalStrength | — | `proposalStrength: number` | — | [NEEDS_DECISION] Not in precanonical |
| reasons | — | `reasons: string[]` | — | [NEEDS_DECISION] Not in precanonical |
| matchedCapabilities | — | `matchedCapabilities: string[]` | — | [NEEDS_DECISION] Not in precanonical |
| missingCapabilities | — | `missingCapabilities: string[]` | — | [NEEDS_DECISION] Not in precanonical |
| recommended | — | `recommended: boolean` | — | [NEEDS_DECISION] Not in precanonical |

**Status**: NOT YET CANONICAL — defined in `src/types.ts` but has no entry in precanonical list. Needs canonicalization.

**Code implementations**:
- `upwork-job-scouter/src/types.ts:28-37` (TypeScript interface)
- `upwork-job-scouter/src/db/store.ts:85-111` — `saveAssessment()` persists this to `assessments` table, serializing arrays as JSON (`reasons_json`, `matched_capabilities_json`, `missing_capabilities_json`)

---

### 3. ProposalDraft

| Property | Canonical | Code (orchestrator) | Code (agent) | Gap? |
|---|---|---|---|---|
| jobId | ✅ string | ✅ | ✅ | |
| coverLetter | ✅ string | ✅ | — | |
| firstMilestone | ✅ string | ✅ | — | |
| assumptions | ✅ string[] | ✅ | — | |
| subject | ❌ | ✅ (code-only) | — | Extra field in code; canonical has no `subject` |
| draftVersion | ✅ number | ❌ MISSING | — | Must add |
| qualityFlags | ✅ string[] | ❌ MISSING | — | Must add |
| createdBy | ✅ string | ❌ MISSING | — | Must add |
| createdAt | ✅ Date | ❌ MISSING | — | Must add |
| updatedAt | ✅ Date | ❌ MISSING | — | Must add |

**Status**: PARTIAL — canonical is richer. The code version in `src/types.ts` is a simplified subset. 5 canonical fields absent from code.

**Canonical source**: docs/contracts/precanonical-contract-list.md §2
**Code implementations**:
- `upwork-job-scouter/src/types.ts:39-45` (interface — simplified)
- `upwork-job-scouter/src/db/store.ts:133-142` — `saveDraft()` stores `draft_json` as JSON string, does NOT store version/timestamps
- `openclaw-upwork-job-scouter/tools/proposal_submit.ts` — `SubmitInput` is the submit-side type (has `rateAmount`, `approved`); `SubmitOutput` is the result type
- `openclaw-upwork-job-scouter/tools/upwork_store.ts` — `upworkSaveDraft()` stores `draft_json` as JSON

**[NEEDS_DECISION]**: Should `subject` be added to canonical? It exists in code but not in precanonical. Decide whether it's a legitimate field or code-only artifact.

---

### 4. ApprovalDecision

| Property | Canonical | Code (orchestrator) | Code (agent) | Gap? |
|---|---|---|---|---|
| jobId | — | `jobId: string` | — | [NEEDS_DECISION] Not in precanonical |
| makesSense | — | `makesSense: boolean` | — | [NEEDS_DECISION] Not in precanonical |
| approvedToDraft | — | `approvedToDraft: boolean` | — | [NEEDS_DECISION] Not in precanonical |
| approvedToSubmit | — | `approvedToSubmit: boolean` | — | [NEEDS_DECISION] Not in precanonical |
| notes | — | `notes?: string` | — | [NEEDS_DECISION] Not in precanonical |

**Status**: NOT YET CANONICAL — defined in `src/types.ts` but has no entry in precanonical list. This is the Telegram-mediated human review decision. Needs canonicalization.

**Code implementations**:
- `upwork-job-scouter/src/types.ts:47-53` (TypeScript interface)
- `upwork-job-scouter/src/db/store.ts:113-131` — `saveReview()` persists to `user_reviews` table; maps `makes_sense`, `approved_to_draft`, `approved_to_submit`, `notes`, `reviewed_at`

---

## Group B: Core Engine — Store Class (`src/db/store.ts`)

### 5. Store

| Method | Canonical | Code | Gap? |
|---|---|---|---|
| init() | — | `init()` | [NEEDS_DECISION] Not canonical; ORM-level method |
| beginRun() | — | `beginRun()` → runId | [NEEDS_DECISION] Not canonical |
| finishRun(id, patch) | — | `finishRun()` | [NEEDS_DECISION] Not canonical |
| upsertRawJob(job: JobDetail) | — | ✅ | [NEEDS_DECISION] Not canonical |
| seenState(job) | — | ✅ → "new\|updated\|seen" | [NEEDS_DECISION] Not canonical |
| upsertFingerprint(job, status) | — | ✅ | [NEEDS_DECISION] Not canonical |
| updateFingerprintStatus(jobId, status) | — | ✅ | [NEEDS_DECISION] Not canonical |
| saveAssessment(match: MatchResult) | — | ✅ | [NEEDS_DECISION] Not canonical |
| saveReview(decision: ApprovalDecision) | — | ✅ | [NEEDS_DECISION] Not canonical |
| saveDraft(draft: ProposalDraft) | — | ✅ | [NEEDS_DECISION] Not canonical |
| markQueued(jobId) | — | ✅ | [NEEDS_DECISION] Not canonical |
| markSubmitted(jobId) | — | ✅ | [NEEDS_DECISION] Not canonical |
| markSubmitFailed(jobId, reason) | — | ✅ | [NEEDS_DECISION] Not canonical |
| listPendingReviewDetailed() | — | ✅ → raw rows | [NEEDS_DECISION] Not canonical |
| getApprovedDraftJobsDetailed() | — | ✅ → raw rows | [NEEDS_DECISION] Not canonical |
| getApprovedSubmitJobs() | — | ✅ → raw rows | [NEEDS_DECISION] Not canonical |
| listDraftedNotSubmitted() | — | ✅ → raw rows | [NEEDS_DECISION] Not canonical |
| cleanupExpiredRawJobs() | — | ✅ → result | [NEEDS_DECISION] Not canonical |
| setState(key, value) | — | ✅ | [NEEDS_DECISION] Not canonical |
| getState(key) | — | ✅ → T\|null | [NEEDS_DECISION] Not canonical |
| markNotificationSent(jobId, kind) | — | ✅ | [NEEDS_DECISION] Not canonical |
| wasNotificationSent(jobId, kind) | — | ✅ → boolean | [NEEDS_DECISION] Not canonical |
| listUnnotifiedPendingReview() | — | ✅ → filtered rows | [NEEDS_DECISION] Not canonical |
| listUnnotifiedDrafts() | — | ✅ → filtered rows | [NEEDS_DECISION] Not canonical |

**Status**: NOT YET CANONICAL — the entire Store class is implicit. The class is not described in the precanonical list. It is the de-facto ORM for the SQLite backend.

**Note**: Return types of `list*` and `get*` methods are raw SQL rows (arrays of plain objects) — not typed as any formal interface. `getApprovedDraftJobsDetailed()` returns `{ upwork_job_id, raw_json, match_json }` where `match_json` is a JSON string, not a parsed object. These row types need to be formalized.

**Code implementation**: `upwork-job-scouter/src/db/store.ts:6-286` (entire class)

---

## Group C: Message Runner — Inline Types (`src/workers/message_runner.ts`)

### 6. ClientThread

| Property | Canonical | Code (orchestrator) | Gap? |
|---|---|---|---|
| threadId | ✅ string | ✅ string | |
| relatedId | ✅ string | ❌ MISSING | Must add (`jobId?` exists but is not `relatedId`) |
| clientIdentityMetadata | ✅ Record<string, unknown> | ❌ MISSING | Must add |
| messages | ✅ ClientMessage[] | ✅ `Array<{role, text, at?}>` but different shape | Canonical uses `ClientMessage` with `messageId`, `senderId`, `timestamp`; code uses inline `{role, text, at?}` |
| approvedFacts | ✅ string[] | ✅ string[] | |
| projectStatus | ✅ 'active'\|'archived'\|'pending' | ✅ `string?` (code is untyped string) | Code accepts any string; canonical is a union |
| disclosurePolicyLevel | ✅ 'low'\|'medium'\|'high'\|'strict' | ❌ MISSING | Must add |
| createdAt | ✅ Date | ❌ MISSING | Must add |
| updatedAt | ✅ Date | ❌ MISSING | Must add |

**Status**: PARTIAL — canonical has 10 fields; code has 7 properties (6 data + 1 extra). `relatedId` is missing (code has `jobId?` instead), `clientIdentityMetadata`, `disclosurePolicyLevel`, `createdAt`, `updatedAt` all missing. `messages` shape diverges from canonical `ClientMessage[]`.

**Canonical source**: docs/contracts/precanonical-contract-list.md §3
**Code implementation**: `upwork-job-scouter/src/workers/message_runner.ts:3-14` (inline type)
**Storage**: Stored as JSON in `client_threads` table (`thread_json` column) via `loadPendingThreads()` at line 86

**[NEEDS_DECISION]**: Code has `jobId?` where canonical specifies `relatedId`. Are these the same concept? Should canonical use `jobId` for clarity?

---

### 7. ReplyDraft

| Property | Canonical (ClientReplyDraft) | Code (ReplyDraft) | Gap? |
|---|---|---|---|
| threadId | ✅ string | ✅ string | |
| replyText | ✅ string | ❌ named `reply` in code | Field name mismatch |
| intent | ✅ string | ✅ string | |
| unansweredQuestions | ✅ string[] | ✅ string[] | |
| escalationNeeded | ✅ boolean | ✅ boolean | |
| confidentialityFlags | ✅ string[] | ❌ MISSING | Must add |
| createdBy | ✅ string | ❌ MISSING | Must add |
| createdAt | ✅ Date | ❌ MISSING | Must add |
| updatedAt | ✅ Date | ❌ MISSING | Must add |

**Status**: PARTIAL — 1 field name mismatch (`reply` vs `replyText`), 4 canonical fields missing.

**Canonical source**: docs/contracts/precanonical-contract-list.md §4
**Code implementation**: `upwork-job-scouter/src/workers/message_runner.ts:16-22` (inline type)
**Storage**: Stored as JSON in `client_reply_drafts` table (`draft_json` column) via `saveReplyDraft()` at line 243

**[NEEDS_DECISION]**: Canonical `replyText` vs code `reply`. Standardize on one name across all code before canonicalizing.

---

### 8. ThreadSummary

| Property | Canonical | Code | Gap? |
|---|---|---|---|
| confirmedRequirements | — | `confirmedRequirements: string[]` | [NEEDS_DECISION] Not canonical |
| missingInformation | — | `missingInformation: string[]` | [NEEDS_DECISION] Not canonical |
| blockers | — | `blockers: string[]` | [NEEDS_DECISION] Not canonical |
| assumptions | — | `assumptions: string[]` | [NEEDS_DECISION] Not canonical |
| nextSteps | — | `nextSteps: string[]` | [NEEDS_DECISION] Not canonical |

**Status**: NOT YET CANONICAL — purely internal type in `message_runner.ts`. Not referenced in precanonical list. `buildSummary()` at line 109 generates this; stored in `client_thread_summaries` table.

**Code implementation**: `upwork-job-scouter/src/workers/message_runner.ts:24-30` (inline type)
**Storage**: `client_thread_summaries` table via `saveSummary()` at line 255

**[NEEDS_DECISION]**: Should this be canonical? It's an internal summarization output, not a cross-agent contract. Recommend treating as internal-only unless a downstream agent needs it.

---

### 9. Escalation

| Property | Canonical | Code | Gap? |
|---|---|---|---|
| escalate | — | `escalate: boolean` | [NEEDS_DECISION] Not canonical |
| reasons | — | `reasons: string[]` | [NEEDS_DECISION] Not canonical |

**Status**: NOT YET CANONICAL — inline type in `message_runner.ts`. Generated by `buildEscalation()` at line 225. Stored in `client_escalations` table.

**Code implementation**: `upwork-job-scouter/src/workers/message_runner.ts:32-35` (inline type)
**Storage**: `client_escalations` table via `saveEscalation()` at line 267

**[NEEDS_DECISION]**: Not a cross-agent contract — derived signal used internally. Suggest keeping as internal-only.

---

## Group D: Review Runner — Inline Types (`src/workers/review_runner.ts`)

### 10. QueueItem

| Property | Canonical (ReviewQueueItem) | Code | Gap? |
|---|---|---|---|
| itemId | ✅ string | ✅ string | |
| itemType | ✅ 'proposal'\|'reply'\|'profile_update' | ✅ 'proposal'\|'client_reply' | `client_reply` vs canonical `reply`; canonical also has `profile_update` |
| sourceId | ✅ string | ✅ string | |
| payload | ✅ `Record<string, unknown>` | ✅ `any` | |
| sourceModule | ✅ string | ❌ MISSING | Must add |
| payloadReference | ✅ string? | ❌ MISSING | Must add |
| embeddedPayload | ✅ `Record<string, unknown>` | ❌ MISSING (uses payload directly) | Canonical has both `payloadReference` and `embeddedPayload` |
| priority | ✅ 'low'\|'medium'\|'high'\|'critical' | ❌ MISSING | Must add |
| reviewStatus | ✅ 'pending'\|'in_progress'\|'completed'\|'blocked' | ❌ MISSING (uses `status` in DB) | Different field name (`reviewStatus` vs code's DB `status` column) |
| createdAt | ✅ Date | ❌ MISSING (DB has `created_at`) | Must add |
| updatedAt | ✅ Date | ❌ MISSING (DB has `updated_at`) | Must add |

**Status**: PARTIAL — 3 fields match; 8 canonical fields missing or diverged.

**Canonical source**: docs/contracts/precanonical-contract-list.md §5
**Code implementation**: `upwork-job-scouter/src/workers/review_runner.ts:3-8` (inline type)
**Storage**: `internal_review_queue` table via `loadPending()` at line 46

**[NEEDS_DECISION]**: `client_reply` vs `reply` naming inconsistency. Canonical says `reply`, code says `client_reply`. Also `profile_update` type in canonical doesn't exist in code.

---

### 11. ReviewDecision

| Property | Canonical | Code (orchestrator) | Gap? |
|---|---|---|---|
| itemId | ✅ string | ❌ MISSING | Must add — code does NOT include `itemId` in the decision object itself |
| decision | ✅ 'pass'\|'revise'\|'escalate'\|'block' | ✅ 'pass'\|'revise'\|'escalate' | Code lacks `'block'` |
| issues | ✅ string[] | ✅ string[] | |
| rationale | ✅ string | ✅ string | |
| allowedNextStep | ✅ string | ✅ string | |
| reviewer | ✅ string | ❌ MISSING | Must add |
| createdAt | ✅ Date | ❌ MISSING | Must add |
| updatedAt | ✅ Date | ❌ MISSING | Must add |

**Status**: PARTIAL — `itemId` not embedded in decision object in code (it's the DB key); `block` decision missing; 4 canonical timestamp/actor fields missing.

**Canonical source**: docs/contracts/precanonical-contract-list.md §6
**Code implementation**: `upwork-job-scouter/src/workers/review_runner.ts:10-15` (inline type); `inspect()` at line 70 generates decisions
**Storage**: `internal_review_decisions` table via `saveDecision()` at line 145

**[NEEDS_DECISION]**: Should `itemId` be part of the decision object or the storage key? Code uses it as the table key; canonical embeds it in the object. Decide on approach.

---

## Group E: Scout Agent Tools — `openclaw-upwork-job-scouter/tools/`

### 12. ToolResult<T>

| Property | Canonical | Code (agent) | Gap? |
|---|---|---|---|
| ok | — | `ok: boolean` | [NEEDS_DECISION] Not canonical |
| tool | — | `tool: string` | [NEEDS_DECISION] Not canonical |
| data | — | `data?: T` | [NEEDS_DECISION] Not canonical |
| error | — | `error?: string` | [NEEDS_DECISION] Not canonical |
| meta | — | `meta?: Record<string, unknown>` | [NEEDS_DECISION] Not canonical |

**Status**: NOT YET CANONICAL — universal wrapper type used by every tool in the scout agent. Exists in 5 files with identical shape. Needs canonicalization.

**Code implementations** (all identical):
- `openclaw-upwork-job-scouter/tools/upwork_graphql.ts:4-10`
- `openclaw-upwork-job-scouter/tools/upwork_store.ts:3-9`
- `openclaw-upwork-job-scouter/tools/proposal_submit.ts:4-10`
- `openclaw-upwork-job-scouter/tools/telegram_review.ts:1-7`

**[NEEDS_DECISION]**: Should `ToolResult<T>` be the canonical tool-response envelope across all agents (scout, client-manager, review-manager)? Strong candidate for cross-agent canonicalization.

---

### 13. GraphQLResponse<T>

| Property | Canonical | Code | Gap? |
|---|---|---|---|
| data | — | `data?: T` | [NEEDS_DECISION] Not canonical |
| errors | — | `errors?: UpworkGraphQLError[]` | [NEEDS_DECISION] Not canonical |

**Status**: NOT YET CANONICAL — used internally by GraphQL execution in `upwork_graphql.ts`. Internal to the scout agent.

**Code implementation**: `openclaw-upwork-job-scouter/tools/upwork_graphql.ts:18-21`
**Used by**: `executeUpworkGraphQL()` at line 92

**[NEEDS_DECISION]**: Internal to scout agent; not a cross-agent contract. Recommend keeping as agent-private.

---

### 14. SearchJob

| Property | Canonical | Code | Gap? |
|---|---|---|---|
| id | — | `id: string` | [NEEDS_DECISION] Not canonical |
| title | — | `title: string` | [NEEDS_DECISION] Not canonical |
| description | — | `description: string` | [NEEDS_DECISION] Not canonical |
| url | — | `url?: string` | [NEEDS_DECISION] Not canonical |
| postedAt | — | `postedAt?: string` | [NEEDS_DECISION] Not canonical |

**Status**: NOT YET CANONICAL — the raw job type returned from GraphQL search before enrichment. Differs from `JobDetail` (orchestrator) by missing `skills`, `budgetUsd`, `hourlyMin`, `hourlyMax`. `JobDetail` enriches `SearchJob` with capability matching data.

**Code implementation**: `openclaw-upwork-job-scouter/tools/upwork_graphql.ts:23-29`
**Normalization**: `normalizeSearchJobs()` at line 182 maps GraphQL edges to `SearchJob[]`; `JobDetail` in orchestrator adds capability-match fields on top.

**[NEEDS_DECISION]**: Should `SearchJob` and `JobDetail` be two distinct canonical types (raw vs enriched), or should `SearchJob` be canonical and `JobDetail` be derived? Currently they diverge. Recommend: canonicalize `JobDetail` as the enriched form, and `SearchJob` as a scout-agent-internal raw type.

---

### 15. SubmitOutput

| Property | Canonical | Code | Gap? |
|---|---|---|---|
| queued | — | `queued: boolean` | [NEEDS_DECISION] Not canonical |
| submitted | — | `submitted: boolean` | [NEEDS_DECISION] Not canonical |
| response | — | `response?: unknown` | [NEEDS_DECISION] Not canonical |

**Status**: NOT YET CANONICAL — return type of `upworkSubmitProposal()`. The `queued` field is always `false` in the current implementation (line 113), suggesting it may be dead code or a planned feature.

**Code implementation**: `openclaw-upwork-job-scouter/tools/proposal_submit.ts:21-25`

**[NEEDS_DECISION]**: If `queued` is always `false`, should it be removed? Or is it part of a planned async submission flow?

---

### 16. JobState

| Property | Canonical | Code (agent) | Gap? |
|---|---|---|---|
| jobId | — | `jobId: string` | [NEEDS_DECISION] Not canonical |
| status | — | `status: "new"\|"updated"\|"seen"\|"dismissed"\|"drafted"\|"submitted"` | [NEEDS_DECISION] Not canonical |
| hasAssessment | — | `hasAssessment: boolean` | [NEEDS_DECISION] Not canonical |
| hasReview | — | `hasReview: boolean` | [NEEDS_DECISION] Not canonical |
| hasDraft | — | `hasDraft: boolean` | [NEEDS_DECISION] Not canonical |

**Status**: NOT YET CANONICAL — agent-side job state snapshot. Orchestrator uses `Store` class methods for equivalent queries. This type represents a query result, not a stored entity.

**Code implementation**: `openclaw-upwork-job-scouter/tools/upwork_store.ts:11-17`
**Used by**: `upworkGetJobState()` at line 71

**[NEEDS_DECISION]**: Similar to `Store` class — the agent has its own query path for state that the orchestrator queries via `Store`. Should canonical define a unified `JobState` contract, or keep them as separate implementations?

---

## Group F: Review Manager Tools — `openclaw-review-manager/tools/`

### 17. ReviewItem

| Property | Canonical (ReviewQueueItem) | Code (review manager) | Gap? |
|---|---|---|---|
| itemId | ✅ string | ✅ string | |
| itemType | ✅ 'proposal'\|'reply'\|'profile_update' | ✅ 'proposal'\|'client_reply' | Same `client_reply` vs `reply` mismatch as Group D |
| sourceId | ✅ string | ✅ string | |
| payload | ✅ `Record<string, unknown>` | ✅ `unknown` | |
| status | ❌ | ✅ 'pending'\|'released'\|'blocked' | Not in canonical; canonical uses `reviewStatus` |
| createdAt | ✅ Date | ✅ `createdAt: string` | |
| sourceModule | ✅ string | ❌ MISSING | Must add |
| payloadReference | ✅ string? | ❌ MISSING | Must add |
| embeddedPayload | ✅ `Record<string, unknown>` | ❌ MISSING | Must add |
| priority | ✅ 'low'\|'medium'\|'high'\|'critical' | ❌ MISSING | Must add |
| reviewStatus | ✅ 'pending'\|'in_progress'\|'completed'\|'blocked' | ❌ MISSING | Canonical has this; code uses `status` |
| updatedAt | ✅ Date | ❌ MISSING | Code reads `updated_at` from DB but doesn't include in type |

**Status**: PARTIAL — aligns more closely with canonical than the orchestrator's `QueueItem` (includes `createdAt`), but diverges on field names (`status` vs `reviewStatus`, `client_reply` vs `reply`), and is missing 5 canonical fields.

**Canonical source**: docs/contracts/precanonical-contract-list.md §5
**Code implementation**: `openclaw-review-manager/tools/review_queue.ts:11-18`
**Storage**: `internal_review_queue` table; loaded via `loadReviewQueue()` at line 49

**[NEEDS_DECISION]**: Same `client_reply` vs `reply` naming issue. Also `status` vs `reviewStatus` — one field name should be chosen and applied consistently.

---

## Summary: Gaps by Contract

### Interfaces with 0 canonical gaps
None identified in Phase 1 audit.

### Interfaces missing from precanonical list (need canonicalization)
| # | Interface | Source | Priority |
|---|---|---|---|
| 1 | `JobDetail` | orchestrator | HIGH — cross-agent job data |
| 2 | `MatchResult` | orchestrator | HIGH — assessment output passed to reviewers |
| 4 | `ApprovalDecision` | orchestrator | HIGH — Telegram-mediated gate |
| 5 | `Store` (class/methods) | orchestrator | MEDIUM — DB ORM interface |
| 12 | `ToolResult<T>` | scout agent | HIGH — universal agent response envelope |
| 14 | `SearchJob` | scout agent | MEDIUM — raw job type |
| 16 | `JobState` | scout agent | MEDIUM — job lifecycle state |

### Interfaces needing cross-agent canonicalization decisions
| # | Interface | Canonical Source | Code Location | Issue |
|---|---|---|---|---|
| 3 | `ProposalDraft` | §2 | orchestrator + agent | 5 fields missing in code; `subject` extra in code |
| 6 | `ClientThread` | §3 | message_runner | 4 canonical fields missing; `relatedId` vs `jobId` |
| 7 | `ReplyDraft` | §4 | message_runner | `reply` vs `replyText`; 4 fields missing |
| 10 | `QueueItem` | §5 | review_runner | 8 canonical fields missing; `client_reply` vs `reply` |
| 11 | `ReviewDecision` | §6 | review_runner | `itemId` not in object; `block` missing; 3 fields missing |
| 17 | `ReviewItem` | §5 | review manager | Same as QueueItem + `createdAt` present; 5 fields missing |

### Internal-only interfaces (recommend keeping non-canonical)
- `ThreadSummary` — internal summarization output
- `Escalation` — internal escalation signal
- `GraphQLResponse<T>` — internal GraphQL wrapper
- `SubmitOutput` — tool return type

### Naming conflicts to resolve
1. **`client_reply` vs `reply`** — Used in `QueueItem.itemType`, `ReviewItem.itemType`, canonical `ReviewQueueItem.itemType` uses `reply`. Must standardize.
2. **`reply` vs `replyText`** — `ReplyDraft` code uses `reply`; canonical `ClientReplyDraft` uses `replyText`. Must standardize.
3. **`relatedId` vs `jobId`** — `ClientThread` canonical has `relatedId`; code has `jobId?`. Semantic match but naming differs.
4. **`status` vs `reviewStatus`** — `ReviewItem` code uses `status`; canonical uses `reviewStatus`. Must standardize.
