# Source Mapping

This document maps every meaningful file from each legacy source repository into the `openclaw-upwork-suite` monorepo structure under `apps/*` and `packages/*`.

## Mapping Definition

| Legacy Repository | Path in Monorepo | Purpose in Monorepo |
|---|---|---|
| `upwork-job-scouter` | `apps/orchestrator` | Core system, pollers, central DB, workers |
| `openclaw-upwork-job-scouter` | `apps/scout-agent` | Agent finding jobs and generating initial drafts |
| `openclaw-review-manager` | `apps/review-agent` | Agent managing human-in-the-loop approvals |
| `openclaw-client-manager` | `apps/client-agent` | Agent communicating with clients |
| Shared Upwork Logic | `packages/upwork-api` | Extracted canonical Upwork GraphQL client, job search, company selector, proposal submit |
| Shared Interfaces | `packages/contracts` | New explicit contract definitions (Phase 2) |
| Database Schemas | `packages/db` | Extracted canonical SQLite schema + typed client |

---

## File-by-File Mapping

### `upwork-job-scouter` → `apps/orchestrator`

| Original Path | Destination | Action | Notes |
|---|---|---|---|
| src/upwork/graphql.ts | `packages/upwork-api/src/graphql.ts` | MERGE | See RISK-001. Keep `upworkGraphQL<T>()` as the low-level HTTP primitive. |
| src/upwork/queries.ts | `packages/upwork-api/src/queries.ts` | MERGE | `MARKETPLACE_JOB_SEARCH_QUERY` string constant. |
| src/types.ts | `packages/contracts/src/types.ts` | MOVE | All shared TypeScript interfaces. |
| src/config.ts | `apps/orchestrator/src/config.ts` | MOVE | Runtime config; not shared. |
| src/index.ts | `apps/orchestrator/src/index.ts` | MOVE | Main entry point wiring poll + notify + draft. |
| src/scheduler/poller.ts | `apps/orchestrator/src/scheduler/poller.ts` | MOVE | Polling cycle. Uses `upworkGraphQL` from `packages/upwork-api`. |
| src/db/schema.ts | `packages/db/src/schema.sql` | MOVE | Canonical DDL. See RISK-004. |
| src/db/store.ts | `apps/orchestrator/src/db/store.ts` | MOVE | `Store` class using `packages/db`. Orchestrator is the only writer. |
| src/tools/proposal_submit.ts | `packages/upwork-api/src/proposal-submit.ts` | MERGE | See RISK-002. Keep orchestrator's raw-mutation-only version. |
| src/tools/proposal_generate.ts | `apps/orchestrator/src/tools/proposal-generate.ts` | MOVE | Template-based draft generation. |
| src/tools/capability_match_openclaw.ts | `apps/orchestrator/src/tools/capability-match.ts` | MOVE | Keyword-matching scorer. |
| src/tools/approval_prompt.ts | `apps/orchestrator/src/tools/approval-prompt.ts` | MOVE | Human-readable approval card builder. |
| src/review/review_service.ts | `apps/orchestrator/src/review/review-service.ts` | MOVE | Business-logic wrapper around `Store` for review operations. |
| src/review/telegram.ts | `apps/orchestrator/src/review/telegram.ts` | MERGE | See RISK-003. Keep as canonical — full `node-telegram-bot-api` implementation with `/pending`, `/drafts`, and all callback handlers. |
| src/review/notifier.ts | `apps/orchestrator/src/review/notifier.ts` | MOVE | Proactive Telegram alerts for new pending jobs. |
| src/review/cli.ts | `apps/orchestrator/src/review/cli.ts` | MOVE | Manual review CLI (`next`, `approve-draft`, `approve-submit`, `reject`). |
| src/workers/draft_worker.ts | `apps/orchestrator/src/workers/draft-worker.ts` | MOVE | Generates and persists drafts for approved jobs. |
| src/workers/submit_worker.ts | `apps/orchestrator/src/workers/submit-worker.ts` | MOVE | Submits approved drafts to Upwork. Contains own `safeCheck` (blocklist differs from scout-agent version — see RISK-002). |
| src/workers/message_runner.ts | `apps/orchestrator/src/workers/message-runner.ts` | MOVE | Processes pending client threads, builds reply drafts. Defines `client_threads` / `client_reply_drafts` / `client_thread_summaries` / `client_escalations` DDL. See RISK-005. |
| src/workers/review_runner.ts | `apps/orchestrator/src/workers/review-runner.ts` | MOVE | Internal automated review (hype phrases, method leakage). Defines `internal_review_queue` / `internal_review_decisions` DDL. See RISK-006. |
| graphql/search_jobs.graphql | `packages/upwork-api/graphql/search-jobs.graphql` | MERGE | See RISK-008. |

### `openclaw-upwork-job-scouter` → `apps/scout-agent`

| Original Path | Destination | Action | Notes |
|---|---|---|---|
| tools/upwork_graphql.ts | `packages/upwork-api/src/agent-graphql.ts` | MERGE | See RISK-001. The `ToolResult<T>` wrapper, `executeUpworkGraphQL`, `upworkSearchJobs`, `upworkCompanySelector`, and `normalizeSearchJobs` functions are more feature-rich. Extract into `packages/upwork-api`. Remove from scout-agent workspace — agents should call `packages/upwork-api` not re-implement it. |
| tools/proposal_submit.ts | DELETE | DEPRECATE | See RISK-002. The scout-agent version has `safeCheck` + DB write (`upworkMarkSubmitted`) that would bypass orchestrator state. Replace with calls to orchestrator via `packages/contracts`. |
| tools/telegram_review.ts | DELETE | DEPRECATE | See RISK-003. Simpler `fetch()`-based Telegram sender, missing `/pending` and `/drafts` commands. Replace with calls to `apps/orchestrator/src/review/telegram.ts` via contract. |
| tools/upwork_store.ts | DELETE | DEPRECATE | See RISK-011. Direct `better-sqlite3` DB access from scout-agent violates minimal disclosure. Scout agent should only read/write via orchestrator contracts. |
| graphql/search_jobs.graphql | `packages/upwork-api/graphql/search-jobs.graphql` | MERGE | See RISK-008. Byte-for-byte identical to `upwork-job-scouter/graphql/search_jobs.graphql`. Canonical copy goes to `packages/upwork-api`. |

### `openclaw-client-manager` → `apps/client-agent`

| Original Path | Destination | Action | Notes |
|---|---|---|---|
| tools/client_messages.ts | `packages/db/src/client-messages.ts` | MERGE | See RISK-005. DB schema (4 tables: `client_threads`, `client_reply_drafts`, `client_thread_summaries`, `client_escalations`) is IDENTICAL to `message_runner.ts`. Consolidate schema into `packages/db`. Keep tool wrappers (`loadClientThread`, `saveClientReplyDraft`, `saveClientThreadSummary`, `saveClientEscalation`) as the canonical API. **Critical**: client-agent must NOT have raw `better-sqlite3` access — only through this typed API. See RISK-010. |

### `openclaw-review-manager` → `apps/review-agent`

| Original Path | Destination | Action | Notes |
|---|---|---|---|
| tools/review_queue.ts | `packages/db/src/review-queue.ts` | MERGE | See RISK-006. DB schema (`internal_review_queue`, `internal_review_decisions`) is IDENTICAL to `review_runner.ts`. Consolidate schema into `packages/db`. **BUG (RISK-007)**: Line 63 queries `application_drafts` table which does not exist. Fix to query `proposals` table before migration. Tool wrappers (`loadReviewQueue`, `saveReviewDecision`, `markReviewReleased`, `markReviewBlocked`) become the canonical interface. |

---

## Data File Mapping

| Source | Destination | Notes |
|---|---|---|
| `upwork-job-scouter/data/capabilities.json` | `apps/orchestrator/data/capabilities.json` | Loaded by `poller.ts` and `draft_worker.ts` at runtime. |
| `upwork-job-scouter/data/search_profiles.json` | `apps/orchestrator/data/search-profiles.json` | Search query profiles for the poller. |

---

## Non-Migrated Files (Internal / Build)

| Path | Reason |
|---|---|
| `upwork-job-scouter/.env.example` | Environment template; recreate in `apps/orchestrator`. |
| `upwork-job-scouter/tsconfig.json` | Per-repo config; will be replaced by monorepo root config. |
| `openclaw-upwork-job-scouter/.env.example` | Same; recreate per new workspace. |
| `openclaw-client-manager/.env.example` | Same. |
| `openclaw-review-manager/.env.example` | Same. |

---

## Package-to-Source Ownership Matrix

```
packages/upwork-api/
  ← upwork-job-scouter/src/upwork/graphql.ts
  ← upwork-job-scouter/src/upwork/queries.ts
  ← upwork-job-scouter/graphql/search_jobs.graphql
  ← openclaw-upwork-job-scouter/tools/upwork_graphql.ts  (merge: agent wrapper functions)
  ← openclaw-upwork-job-scouter/graphql/search_jobs.graphql  (dedup → single canonical copy)

packages/db/
  ← upwork-job-scouter/src/db/schema.ts
  ← upwork-job-scouter/src/workers/message_runner.ts  (DB schema portion only)
  ← upwork-job-scouter/src/workers/review_runner.ts  (DB schema portion only)
  ← openclaw-client-manager/tools/client_messages.ts  (DB schema portion only; also tool wrappers)
  ← openclaw-review-manager/tools/review_queue.ts  (DB schema portion + tool wrappers; BUG-FIX first)

packages/contracts/
  ← upwork-job-scouter/src/types.ts

apps/orchestrator/
  ← upwork-job-scouter/src/index.ts
  ← upwork-job-scouter/src/config.ts
  ← upwork-job-scouter/src/scheduler/poller.ts
  ← upwork-job-scouter/src/db/store.ts
  ← upwork-job-scouter/src/tools/proposal_submit.ts  (raw-mutation canonical)
  ← upwork-job-scouter/src/tools/proposal_generate.ts
  ← upwork-job-scouter/src/tools/capability_match_openclaw.ts
  ← upwork-job-scouter/src/tools/approval_prompt.ts
  ← upwork-job-scouter/src/review/review_service.ts
  ← upwork-job-scouter/src/review/telegram.ts  (full bot canonical)
  ← upwork-job-scouter/src/review/notifier.ts
  ← upwork-job-scouter/src/review/cli.ts
  ← upwork-job-scouter/src/workers/draft_worker.ts
  ← upwork-job-scouter/src/workers/submit_worker.ts
  ← upwork-job-scouter/src/workers/message_runner.ts  (logic; DB via packages/db)
  ← upwork-job-scouter/src/workers/review_runner.ts  (logic; DB via packages/db)

apps/scout-agent/
  ← openclaw-upwork-job-scouter/  (stripped: no local GraphQL, no local DB, no local submit)

apps/client-agent/
  ← openclaw-client-manager/  (stripped: no raw DB access — only typed API from packages/db)

apps/review-agent/
  ← openclaw-review-manager/  (stripped; fix RISK-007 before migration)
```
