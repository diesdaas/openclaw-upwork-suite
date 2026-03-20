# Legacy Code Consolidation Candidates

These files and patterns have been identified as candidates for deprecation, consolidation, or deletion during the integration phase. Each entry specifies the intended action, rationale, prerequisites, and concerns.

---

## Consolidated into `packages/upwork-api`

### `upwork-job-scouter/src/upwork/graphql.ts`

| Field | Value |
|---|---|
| **Candidate** | `upwork-job-scouter/src/upwork/graphql.ts` |
| **Action** | MERGE into `packages/upwork-api/src/graphql.ts` |
| **Rationale** | Low-level HTTP primitive for Upwork GraphQL API. Keep but wrap: the agent workspace version (`tools/upwork_graphql.ts`) is more feature-rich with `ToolResult<T>` wrapping, input validation, and non-JSON detection. Merge the best features from both. |
| **Prerequisite** | Resolve RISK-001 — decide whether the canonical API returns `Promise<T>` or `Promise<ToolResult<T>>`. |
| **Notes** | The orchestrator's workers (`poller.ts` line 56) expect `Promise<T>`. Wrapping the new canonical to return `ToolResult<T>` requires updating all callers. Alternatively, keep two export levels: internal `executeUpworkGraphQL` returning `ToolResult`, and a `upworkGraphQL` convenience wrapper that unwraps it to `Promise<T>`. |

### `upwork-job-scouter/src/upwork/queries.ts`

| Field | Value |
|---|---|
| **Candidate** | `upwork-job-scouter/src/upwork/queries.ts` |
| **Action** | MERGE into `packages/upwork-api/src/queries.ts` |
| **Rationale** | Single file containing the `MARKETPLACE_JOB_SEARCH_QUERY` GraphQL string constant. Has a duplicate in `openclaw-upwork-job-scouter/graphql/search_jobs.graphql` (see RISK-008). |
| **Prerequisite** | Resolve RISK-008 — consolidate GraphQL query files first to avoid duplication. |
| **Notes** | [NEEDS_DECISION] Should GraphQL query strings live in `.graphql` files (loaded at runtime) or as `.ts` string constants? The agent workspace's `upwork_graphql.ts` already supports loading `.graphql` files (line 46-51, `maybeLoadQueryFile`). The orchestrator uses inline strings via `queries.ts`. Standardize on one approach. |

### `openclaw-upwork-job-scouter/tools/upwork_graphql.ts`

| Field | Value |
|---|---|
| **Candidate** | `openclaw-upwork-job-scouter/tools/upwork_graphql.ts` |
| **Action** | MERGE into `packages/upwork-api/src/agent-graphql.ts` |
| **Rationale** | This file contains the richer implementation: `ToolResult<T>` wrapper, `executeUpworkGraphQL`, `upworkSearchJobs`, `upworkCompanySelector`, `normalizeSearchJobs`. These are the right abstractions for agent consumption. Move to `packages/upwork-api` as the canonical agent-facing API. |
| **Prerequisite** | Resolve RISK-001. Delete the original after merge. |
| **Notes** | The `normalizeSearchJobs` function (lines 182-199) handles three different Upwork GraphQL response shapes (`marketplaceJobPostingsSearch`, `searchMarketplaceJobPostings`, `jobPostingsSearch`). This flexibility is valuable. Keep it. |

### `upwork-job-scouter/graphql/search_jobs.graphql`

| Field | Value |
|---|---|
| **Candidate** | `upwork-job-scouter/graphql/search_jobs.graphql` |
| **Action** | MERGE into `packages/upwork-api/graphql/search-jobs.graphql` |
| **Rationale** | Byte-for-byte identical to `openclaw-upwork-job-scouter/graphql/search_jobs.graphql`. One canonical copy in `packages/upwork-api` eliminates drift. |
| **Prerequisite** | — |
| **Notes** | The `packages/upwork-api/src/agent-graphql.ts` already has an inline fallback query string (lines 221-235) if the file is not found. The migration is safe. |

### `openclaw-upwork-job-scouter/graphql/search_jobs.graphql`

| Field | Value |
|---|---|
| **Candidate** | `openclaw-upwork-job-scouter/graphql/search_jobs.graphql` |
| **Action** | DELETE (deduplicated into `packages/upwork-api/graphql/search-jobs.graphql`) |
| **Rationale** | Identical to the orchestrator's copy. No value in keeping two. |
| **Prerequisite** | Confirm the canonical copy is in place in `packages/upwork-api` before deleting. |
| **Notes** | — |

---

## Consolidated into `packages/db`

### `upwork-job-scouter/src/db/schema.ts`

| Field | Value |
|---|---|
| **Candidate** | `upwork-job-scouter/src/db/schema.ts` |
| **Action** | MOVE to `packages/db/src/schema.sql` |
| **Rationale** | This is the canonical DDL. Contains `app_state`, `job_fingerprints`, `jobs_raw`, `assessments`, `user_reviews`, `proposals`, `polling_runs`. All agents must reference this schema, not define their own DDL. |
| **Prerequisite** | Define the `packages/db` package structure. Create a typed client (`createStore()`) that initializes this schema and provides methods. |
| **Notes** | The orchestrator's `Store` class (`src/db/store.ts`) will become a thin wrapper over `packages/db`'s typed client. No logic changes needed, just import path updates. |

### `upwork-job-scouter/src/workers/message_runner.ts` (DB schema portion)

| Field | Value |
|---|---|
| **Candidate** | `upwork-job-scouter/src/workers/message_runner.ts` (lines 43-72, the `db()` function's CREATE TABLE statements) |
| **Action** | MERGE schema into `packages/db`. Keep the business-logic functions (lines 74-297) in `apps/orchestrator/src/workers/message-runner.ts`. |
| **Rationale** | The four client-thread tables (`client_threads`, `client_reply_drafts`, `client_thread_summaries`, `client_escalations`) are defined here and also in `openclaw-client-manager/tools/client_messages.ts`. Consolidate once in `packages/db`. |
| **Prerequisite** | RISK-005 must be resolved. |
| **Notes** | The business logic in `message_runner.ts` (intent classification, summary building, reply drafting, escalation detection, disclosure sanitization) is sophisticated and must be preserved. Only the DDL and raw SQL are moved. |

### `upwork-job-scouter/src/workers/review_runner.ts` (DB schema portion)

| Field | Value |
|---|---|
| **Candidate** | `upwork-job-scouter/src/workers/review_runner.ts` (lines 23-44, the `db()` function's CREATE TABLE statements) |
| **Action** | MERGE schema into `packages/db`. Keep the business-logic functions (`inspect`, `loadPending`, `saveDecision`, `runReviewRunner`) in `apps/orchestrator/src/workers/review-runner.ts`. |
| **Rationale** | `internal_review_queue` and `internal_review_decisions` are also defined in `openclaw-review-manager/tools/review_queue.ts`. Consolidate schema in `packages/db`. |
| **Prerequisite** | RISK-006 must be resolved. RISK-007 must be fixed first. |
| **Notes** | The `inspect` function (lines 70-143) contains the blocklist for hype phrases and internal-method leakage. This is security-relevant logic and must be preserved exactly. |

### `openclaw-client-manager/tools/client_messages.ts`

| Field | Value |
|---|---|
| **Candidate** | `openclaw-client-manager/tools/client_messages.ts` |
| **Action** | MERGE tool wrappers into `packages/db/src/client-messages.ts`. DELETE the raw `db()` function and `better-sqlite3` instantiation. |
| **Rationale** | The four tool functions (`loadClientThread`, `saveClientReplyDraft`, `saveClientThreadSummary`, `saveClientEscalation`) are the right API surface for the client-agent. But they must use a scoped store from `packages/db`, not raw `new Database(...)`. |
| **Prerequisite** | RISK-010 must be resolved. Define a `createClientMessagingStore()` factory in `packages/db` that only exposes these four operations. The client-agent imports from `packages/db` — never directly from `better-sqlite3`. |
| **Notes** | The DDL in this file (lines 20-44) is byte-for-byte identical to `message_runner.ts` lines 46-70. Move the DDL to `packages/db/schema.sql` and remove from both locations. |

### `openclaw-review-manager/tools/review_queue.ts`

| Field | Value |
|---|---|
| **Candidate** | `openclaw-review-manager/tools/review_queue.ts` |
| **Action** | MERGE tool wrappers into `packages/db/src/review-queue.ts`. **FIX BUG (RISK-007) first.** |
| **Rationale** | Functions `loadReviewQueue`, `saveReviewDecision`, `markReviewReleased`, `markReviewBlocked` provide the right API surface for the review-agent. Fix the `application_drafts` → `proposals` table reference before migration. |
| **Prerequisite** | **BUG FIX**: Change line 63 from `FROM application_drafts` to `FROM proposals`. Verify `draft_json` column name matches the orchestrator's `proposals` schema. RISK-007 is critical. |
| **Notes** | The DDL (lines 29-45) duplicates `review_runner.ts` lines 26-43. Move to `packages/db/schema.sql` and remove from both locations. |

---

## Consolidated into `apps/orchestrator`

### `upwork-job-scouter/src/tools/proposal_submit.ts`

| Field | Value |
|---|---|
| **Candidate** | `upwork-job-scouter/src/tools/proposal_submit.ts` |
| **Action** | MERGE into `packages/upwork-api/src/proposal-submit.ts` as the canonical raw-mutation version |
| **Rationale** | The orchestrator version (`submitProposal`) is the correct canonical: it only returns the mutation and variables, leaving actual execution and state management to the orchestrator. The scout-agent version adds `safeCheck` and DB writes that belong in the orchestrator's `submit_worker.ts`. |
| **Prerequisite** | RISK-002. Merge the superior `safeCheck` blocklist (with `"we built the exact same thing"`) from `openclaw-upwork-job-scouter/tools/proposal_submit.ts` into `submit_worker.ts`. Then delete the scout-agent version. |
| **Notes** | The orchestrator's `submit_worker.ts` already has its own `safeCheck`. The blocklists differ slightly. Harmonize on the scout-agent's blocklist (which includes `"we built the exact same thing"`). |

### `upwork-job-scouter/src/review/telegram.ts`

| Field | Value |
|---|---|
| **Candidate** | `upwork-job-scouter/src/review/telegram.ts` |
| **Action** | MERGE into `apps/orchestrator/src/review/telegram.ts` as the canonical Telegram implementation |
| **Rationale** | Full `node-telegram-bot-api` bot with `/pending`, `/drafts` commands and all callback handlers. Strictly more capable than the scout-agent's `tools/telegram_review.ts`. The scout-agent version should be deleted. |
| **Prerequisite** | RISK-003. |
| **Notes** | [NEEDS_DECISION] Does the scout-agent need ANY Telegram capability? If not, the scout-agent workspace should have zero Telegram code. If yes, it should use the orchestrator's Telegram bot via a contract call, not a separate implementation. |

### `upwork-job-scouter/src/db/store.ts`

| Field | Value |
|---|---|
| **Candidate** | `upwork-job-scouter/src/db/store.ts` |
| **Action** | MOVE to `apps/orchestrator/src/db/store.ts`, refactoring to use `packages/db` internally |
| **Rationale** | `Store` class is the central database access layer for the orchestrator. Move it as-is, then refactor `import Database from "better-sqlite3"` and `import { schemaSql } from "./schema"` to import from `packages/db` instead. All methods (`upsertRawJob`, `saveAssessment`, `saveDraft`, `markSubmitted`, etc.) remain the same. |
| **Prerequisite** | `packages/db` must be created and `schema.sql` must be in place. |
| **Notes** | The `Store` class methods are tightly coupled to the schema column names (e.g., `capability_fit`, `delivery_risk`, `proposal_strength`). Any schema change in `packages/db` must be reflected here. Consider generating typed `Store` methods from the schema definition. |

---

## Deprecated / Deleted

### `openclaw-upwork-job-scouter/tools/proposal_submit.ts`

| Field | Value |
|---|---|
| **Candidate** | `openclaw-upwork-job-scouter/tools/proposal_submit.ts` |
| **Action** | DELETE |
| **Rationale** | The scout-agent version adds a `safeCheck` and `upworkMarkSubmitted` DB write that bypasses orchestrator state. The orchestrator's `submit_worker.ts` handles safe-checking (with a slightly different blocklist). Agents should not submit proposals or write DB state directly. |
| **Prerequisite** | RISK-002 must be resolved. Ensure `submit_worker.ts` has the correct merged `safeCheck` blocklist before deleting this file. |
| **Notes** | — |

### `openclaw-upwork-job-scouter/tools/telegram_review.ts`

| Field | Value |
|---|---|
| **Candidate** | `openclaw-upwork-job-scouter/tools/telegram_review.ts` |
| **Action** | DELETE |
| **Rationale** | Missing `/pending` and `/drafts` command handlers. Simpler layout. The orchestrator's `telegram.ts` is strictly more capable. Scout agents should not send Telegram messages directly — they should submit review events to the orchestrator. |
| **Prerequisite** | RISK-003. |
| **Notes** | — |

### `openclaw-upwork-job-scouter/tools/upwork_store.ts`

| Field | Value |
|---|---|
| **Candidate** | `openclaw-upwork-job-scouter/tools/upwork_store.ts` |
| **Action** | DELETE |
| **Rationale** | RISK-004 (schema divergence), RISK-009 (`job_status` table mismatch), RISK-011 (scout-agent DB writes bypass orchestrator). The scout-agent should have zero direct database access. All state writes go through the orchestrator via `packages/contracts`. |
| **Prerequisite** | RISK-004, RISK-009, RISK-011. Define the contract API that scout-agents use to submit job/assessment/draft data before deleting this. |
| **Notes** | This is a significant removal — 340 lines of DB tooling. Ensure the Phase 2 contract definitions cover all the operations this file provides, so the scout-agent is not left without a way to record state. |

---

## Bug Fixes Required Before Migration

### `openclaw-review-manager/tools/review_queue.ts` — Wrong table name

| Field | Value |
|---|---|
| **Candidate** | `openclaw-review-manager/tools/review_queue.ts` line 63 |
| **Action** | FIXED ✅ |
| **Before** | `SELECT upwork_job_id, draft_json, updated_at FROM application_drafts` |
| **After** | `SELECT upwork_job_id, draft_json, updated_at FROM proposals` (openclaw-review-manager commit `5392078`) |
| **Rationale** | `application_drafts` table does not exist. The orchestrator uses `proposals` table. This query would crash at runtime with `SQLITE_ERROR: no such table: application_drafts`. |
| **Prerequisite** | None — fixed in-place in source repo. |
| **Notes** | Also verify `draft_json` column name: the orchestrator's `proposals` table (schema.ts line 55) has `draft_json TEXT`. Column name match confirmed. `updated_at` column also exists in `proposals`. The fix is a one-line change on line 63. |

### `upwork-job-scouter/src/workers/submit_worker.ts` — Incomplete safeCheck blocklist

| Field | Value |
|---|---|
| **Candidate** | `upwork-job-scouter/src/workers/submit_worker.ts` line 7 |
| **Action** | FIXED ✅ |
| **Before** | `["guarantee", "guaranteed results", "top 1%", "24/7 available"]` |
| **After** | `["guarantee", "guaranteed results", "top 1%", "24/7 available", "we built the exact same thing"]` (upwork-job-scouter commit `f239ad8`) |
| **Rationale** | Harmonizes blocklist with scout-agent version. Both submit paths now block the same 5 phrases. |
| **Prerequisite** | RISK-002 resolved. |
| **Notes** | Scope unchanged: checks `${draft.coverLetter}\n${draft.firstMilestone}` (both fields). |

---

## Open Questions — Resolved ✅

All 5 open decisions are now locked. These are **not** blockers for Phase 2.

### Decision 1: Submit ownership ✅

**Locked:** `apps/orchestrator` owns the real Upwork submission call. `submit_worker` only prepares, validates, and emits a `SubmissionGateRequest`. No worker submits directly. The `submitProposal` function returns mutation/variables; `submit_worker` calls it and the orchestrator handles the actual API call. See `docs/contracts/submission-gate.md`.

### Decision 2: Scout-agent data flow ✅

**Locked:** `apps/orchestrator` invokes or pulls the scout. Scout returns canonical results and handoffs. Scout does not own cross-module routing. Transitional persistence adapters are allowed, but ownership remains orchestrator-centric. Scout-agent's DB write tools (`upwork_store.ts`) are deprecated — deleted during migration.

### Decision 3: Telegram ownership ✅

**Locked:** Telegram belongs exclusively to `apps/orchestrator`. No agent communicates with Telegram directly. `openclaw-upwork-job-scouter/tools/telegram_review.ts` is deleted during migration. Agents submit review events via `packages/contracts`; orchestrator handles all Telegram delivery.

### Decision 4: `job_fingerprints` vs `job_status` ✅

**Locked:** Keep them as separate tables.
- `job_fingerprints`: dedupe / identity — tracks job hash, first/last seen, canonical lifecycle status (`new`, `updated`, `seen`, `dismissed`, `drafted`, `submitted`)
- `job_status`: workflow / lifecycle state — owned exclusively by orchestrator; scout-agent never writes this

Scout-agent's `job_status` table in `upwork_store.ts` is deprecated — deleted during migration. All status writes go through orchestrator.

### Decision 5: Client message pipeline ✅

**Locked:** `apps/orchestrator` owns ingestion, thread handling, release/send decisions, and transport. `client-manager` only drafts replies and extracts structure. `review-manager` gates replies before release.

Functions `buildReply`, `classifyIntent`, `buildSummary`, `sanitizeDisclosure`, `buildEscalation` remain in `apps/orchestrator/src/workers/message-runner.ts`. Client-manager uses them via contract calls — they are not moved to the agent workspace.
