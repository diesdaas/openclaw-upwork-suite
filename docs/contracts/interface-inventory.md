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

| Property | Canonical | Code (orchestrator) | Gap? |
|---|---|---|---|
| draftId | ✅ string | ❌ MISSING | Must add in Phase 3 adapter |
| jobId | ✅ string | ✅ | |
| version | ✅ number | ❌ MISSING (code has no version) | Must add in Phase 3 adapter |
| coverLetter | ✅ string | ✅ | |
| firstMilestone | ✅ string | ✅ | |
| assumptions | ✅ string[] | ✅ | |
| qualityFlags | ✅ string[] | ❌ MISSING | Must add in Phase 3 adapter |
| approvalState | ✅ `"draft"\|"pending_review"\|"approved"\|"rejected"` | ❌ MISSING | Must add in Phase 3 adapter |
| createdBy | ✅ string | ❌ MISSING | Must add in Phase 3 adapter |
| createdAt | ✅ Date | ❌ MISSING | Must add in Phase 3 adapter |
| updatedAt | ✅ Date | ❌ MISSING | Must add in Phase 3 adapter |
| subject | ❌ extra | ✅ (code-only) | Extra in code; canonical has no `subject` — ignore in adapter |

**Status**: PARTIAL — canonical is richer. 5 canonical fields absent from code. `subject?` is extra in code.

**Canonical source**: docs/contracts/precanonical-contract-list.md §2
**Code implementations**:
- `upwork-job-scouter/src/types.ts:39-45` (interface — simplified)
- `upwork-job-scouter/src/db/store.ts:133-142` — `saveDraft()` stores `draft_json` as JSON string; no version/timestamps

**Phase 3 adapter required**: Map legacy `ProposalDraft` → canonical `ProposalDraft`. Add `draftId` (generate UUID), `version` (init to 1), `approvalState` (default `"draft"`), `qualityFlags` (default `[]`), `createdBy` (from env/config). Drop `subject` silently.

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
| relatedEntityId | ✅ string | ❌ MISSING (code has `jobId?` instead) | Must rename in Phase 3 adapter |
| relatedEntityType | ✅ `"job"\|"proposal"\|"project"` | ❌ MISSING | Must add in Phase 3 adapter |
| clientIdentityMetadata | ✅ Record<string, unknown> | ❌ MISSING | Must add in Phase 3 adapter |
| messages | ✅ ClientMessage[] | ✅ inline `{role, text, at?}` | Canonical shape differs; adapter maps to `ClientMessage` |
| approvedFacts | ✅ string[] | ✅ string[] | |
| projectStatus | ✅ `"active"\|"archived"\|"pending"` | ✅ `string?` (code is untyped) | Code accepts any string; canonical is union |
| disclosurePolicyLevel | ✅ `"low"\|"medium"\|"high"\|"strict"` | ❌ MISSING | Must add in Phase 3 adapter |
| createdAt | ✅ Date | ❌ MISSING | Must add in Phase 3 adapter |
| updatedAt | ✅ Date | ❌ MISSING | Must add in Phase 3 adapter |

**Status**: PARTIAL — canonical has 11 fields; code has 8 properties. Naming conflict resolved: `jobId?` → `relatedEntityId` + `relatedEntityType` (Phase 2 locked default).

**Canonical source**: docs/contracts/precanonical-contract-list.md §3
**Code implementation**: `upwork-job-scouter/src/workers/message_runner.ts:3-14` (inline type)
**Storage**: Stored as JSON in `client_threads` table (`thread_json` column)

**Phase 3 adapter required**: Map `jobId?` → `relatedEntityId` (value); `relatedEntityType` (infer from context, default `"job"`). Add `clientIdentityMetadata`, `disclosurePolicyLevel`, `createdAt`, `updatedAt`. Map inline `{role, text, at?}` → `ClientMessage[]`.

---

### 7. ClientReplyDraft

| Property | Canonical | Code (ReplyDraft) | Gap? |
|---|---|---|---|
| threadId | ✅ string | ✅ string | |
| replyText | ✅ string | ❌ named `reply` in code | Must rename in Phase 3 adapter |
| intent | ✅ string | ✅ string | |
| unansweredQuestions | ✅ string[] | ✅ string[] | |
| escalationNeeded | ✅ boolean | ✅ boolean | |
| confidentialityFlags | ✅ string[] | ❌ MISSING | Must add in Phase 3 adapter |
| createdBy | ✅ string | ❌ MISSING | Must add in Phase 3 adapter |
| createdAt | ✅ Date | ❌ MISSING | Must add in Phase 3 adapter |
| updatedAt | ✅ Date | ❌ MISSING | Must add in Phase 3 adapter |

**Status**: PARTIAL — Naming conflict resolved: `replyText` is canonical (Phase 2 locked default). 4 canonical fields missing from code.

**Canonical source**: docs/contracts/precanonical-contract-list.md §4
**Code implementation**: `upwork-job-scouter/src/workers/message_runner.ts:16-22` (inline type)
**Storage**: Stored as JSON in `client_reply_drafts` table (`draft_json` column)

**Phase 3 adapter required**: Rename `reply` → `replyText`. Add `confidentialityFlags` (default `[]`), `createdBy` (from env/config), `createdAt`, `updatedAt`.

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

| Property | Canonical | Code | Gap? |
|---|---|---|---|
| itemId | ✅ string | ✅ string | |
| itemType | ✅ `"proposal"\|"client_reply"\|"profile_update"` | ✅ `"proposal"\|"client_reply"` | Naming conflict resolved: canonical is `client_reply` (Phase 2 locked default); `profile_update` not yet used in code |
| sourceId | ✅ string | ✅ string | |
| payload | ✅ `Record<string, unknown>` | ✅ `any` | |
| sourceModule | ✅ string | ❌ MISSING | Must add in Phase 3 adapter |
| payloadReference | ✅ string? | ❌ MISSING | Must add in Phase 3 adapter |
| embeddedPayload | ✅ `Record<string, unknown>` | ❌ MISSING | Must add in Phase 3 adapter |
| priority | ✅ `"low"\|"medium"\|"high"\|"critical"` | ❌ MISSING | Must add in Phase 3 adapter |
| reviewStatus | ✅ `"pending"\|"in_progress"\|"completed"\|"blocked"` | ❌ MISSING (code uses `status` in DB) | Must rename in Phase 3 adapter |
| createdAt | ✅ Date | ❌ MISSING | Must add in Phase 3 adapter |
| updatedAt | ✅ Date | ❌ MISSING | Must add in Phase 3 adapter |

**Status**: PARTIAL — Naming conflict resolved: canonical uses `client_reply` (Phase 2 locked default). 8 canonical fields missing from code.

**Canonical source**: docs/contracts/precanonical-contract-list.md §5
**Code implementation**: `upwork-job-scouter/src/workers/review_runner.ts:3-8` (inline type)
**Storage**: `internal_review_queue` table via `loadPending()` at line 46

**Phase 3 adapter required**: Add all 8 missing canonical fields. Map `status` (DB column) → `reviewStatus`. `sourceModule` inferred from caller context.

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

| Property | Canonical | Code (review manager) | Gap? |
|---|---|---|---|
| itemId | ✅ string | ✅ string | |
| itemType | ✅ `"proposal"\|"client_reply"\|"profile_update"` | ✅ `"proposal"\|"client_reply"` | Naming conflict resolved: `client_reply` (Phase 2 locked default) |
| sourceId | ✅ string | ✅ string | |
| payload | ✅ `Record<string, unknown>` | ✅ `unknown` | |
| reviewStatus | ✅ `"pending"\|"in_progress"\|"completed"\|"blocked"` | ❌ named `status` in code | Must rename in Phase 3 adapter |
| createdAt | ✅ Date | ✅ `createdAt: string` | |
| sourceModule | ✅ string | ❌ MISSING | Must add in Phase 3 adapter |
| payloadReference | ✅ string? | ❌ MISSING | Must add in Phase 3 adapter |
| embeddedPayload | ✅ `Record<string, unknown>` | ❌ MISSING | Must add in Phase 3 adapter |
| priority | ✅ `"low"\|"medium"\|"high"\|"critical"` | ❌ MISSING | Must add in Phase 3 adapter |
| updatedAt | ✅ Date | ❌ MISSING | Must add in Phase 3 adapter |

**Status**: PARTIAL — Naming conflicts resolved: `client_reply` and `reviewStatus` are canonical (Phase 2 locked defaults). 5 canonical fields missing from code.

**Canonical source**: docs/contracts/precanonical-contract-list.md §5
**Code implementation**: `openclaw-review-manager/tools/review_queue.ts:11-18`
**Storage**: `internal_review_queue` table; loaded via `loadReviewQueue()` at line 49

**Phase 3 adapter required**: Rename `status` → `reviewStatus`. Add `sourceModule`, `payloadReference`, `embeddedPayload`, `priority`, `updatedAt`.

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

### Interfaces needing migration adapters (Phase 3)
| # | Interface | Canonical Source | Code Location | Gap | Adapter Needed |
|---|---|---|---|---|---|
| 3 | `ProposalDraft` | §2 | orchestrator | 5 canonical fields missing (`draftId`, `version`, `approvalState`); `subject?` extra in code | YES — map legacy → canonical; add missing fields |
| 6 | `ClientThread` | §3 | message_runner | 4 canonical fields missing; `jobId?` → `relatedEntityId` + `relatedEntityType` | YES — rename field + add missing |
| 7 | `ClientReplyDraft` | §4 | message_runner | 4 canonical fields missing; `reply` → `replyText` | YES — rename field + add missing |
| 10 | `QueueItem` | §5 | review_runner | 8 canonical fields missing; `client_reply` not yet used in code | YES — add missing + standardize item type |
| 11 | `ReviewDecision` | §6 | review_runner | 4 canonical fields missing; `itemId` is DB key not object field | YES — embed itemId + add missing |
| 17 | `ReviewItem` | §5 | review manager | 5 canonical fields missing; `status` → `reviewStatus` | YES — rename field + add missing |

### Internal-only interfaces (recommend keeping non-canonical)
- `ThreadSummary` — internal summarization output
- `Escalation` — internal escalation signal
- `GraphQLResponse<T>` — internal GraphQL wrapper
- `SubmitOutput` — tool return type

### Naming conflicts — all resolved ✅

All naming conflicts are resolved by locked Phase 2 defaults. No open decisions remain.

| Conflict | Resolution |
|---|---|
| `client_reply` vs `reply` | ✅ Canonical: `client_reply` (Phase 2 default) |
| `reply` vs `replyText` | ✅ Canonical: `replyText` (Phase 2 default) |
| `relatedId` vs `jobId` | ✅ Canonical: `relatedEntityId` + `relatedEntityType` (Phase 2 default) |
| `status` vs `reviewStatus` | ✅ Canonical: `reviewStatus` (Phase 2 default) |

### Missing required fields — all resolved ✅

| Contract | Missing Fields | Resolution |
|---|---|---|
| `ProposalDraft` | `draftId`, `version`, `approvalState`, `qualityFlags`, `createdBy` | ✅ All added to canonical in precanonical-contract-list.md §2 |
| `ClientThread` | `relatedEntityType`, `approvedFacts`, `disclosurePolicyLevel`, `projectStatus` | ✅ All added to canonical in precanonical-contract-list.md §3 |
