# Source Repository Inventory

This document is the Phase 1 audit of all 4 source repositories planned for migration into the `openclaw-upwork-suite` monorepo. It is a complete file-level inventory with architectural roles, key types, and known duplicates.

---

## 1. `upwork-job-scouter` — Orchestrator (Core Engine)

**Role:** Central backend: polling, scheduling, database of record, human-in-the-loop review, proposal drafting, submission. All agents feed into or are coordinated by this service.

**Top-level files:**
```
.env                     # Environment config (tokens, credentials)
.env.example             # Template
data/                    # Runtime data: state.sqlite, capabilities.json, search_profiles.json
docs/                    # Architecture and migration docs
graphql/                 # GraphQL query files
node_modules/
package.json
README.md
RUNBOOK.md
tsconfig.json
src/                     # Main source (see below)
```

**`src/` directory — file-level inventory:**

| File | Lines | Purpose | Key Exports / Types |
|---|---|---|---|
| `src/index.ts` | — | Main entry point; wires polling + notification + draft | — |
| `src/config.ts` | 15 | Runtime config from env vars | `config` object: `upwork.apiBase`, `polling.intervalMinutes`, `gates.minCapabilityFit`, etc. |
| `src/types.ts` | 53 | Shared domain types | `Capability`, `JobDetail`, `MatchResult`, `ProposalDraft`, `ApprovalDecision` |
| `src/upwork/graphql.ts` | 26 | Low-level Upwork GraphQL HTTP client | `upworkGraphQL<T>()` returning `Promise<T>`; `GqlResponse<T>` = `{data?, errors?}` |
| `src/upwork/queries.ts` | 15 | GraphQL query string constants | `MARKETPLACE_JOB_SEARCH_QUERY` |
| `src/scheduler/poller.ts` | 111 | Polling cycle + cron scheduler | `runPollingCycle()`, `startPolling()` |
| `src/db/schema.ts` | 72 | Canonical SQLite DDL | `schemaSql` — 7 tables: `app_state`, `job_fingerprints`, `jobs_raw`, `assessments`, `user_reviews`, `proposals`, `polling_runs` |
| `src/db/store.ts` | 286 | `Store` class — ORM-like DB access | `init()`, `upsertRawJob()`, `saveAssessment()`, `saveDraft()`, `markSubmitted()`, `markSubmitFailed()`, `getApprovedDraftJobsDetailed()`, `getApprovedSubmitJobs()`, `listPendingReviewDetailed()`, `setState()`, `getState()`, etc. (~20 methods) |
| `src/tools/proposal_generate.ts` | 37 | Template-based proposal draft generator | `generateProposalDraft(job, match, capabilities) → ProposalDraft` |
| `src/tools/proposal_submit.ts` | 27 | Raw Upwork submit mutation builder | `submitProposal(draft, opts) → {queued, mutation, variables}`; requires `humanApproved: true`; no DB write |
| `src/tools/capability_match_openclaw.ts` | 43 | Keyword-based job-to-capability scorer | `matchJobToCapabilities(job, capabilities) → MatchResult` |
| `src/tools/approval_prompt.ts` | 18 | Human-readable approval card builder | `buildApprovalPrompt(job, match) → {jobId, message}` |
| `src/review/review_service.ts` | 58 | `ReviewService` class — review operations | `listPending()`, `listDrafts()`, `approveDraft()`, `approveSubmit()`, `reject()` |
| `src/review/telegram.ts` | 95 | Telegram bot (full `node-telegram-bot-api` with polling) | Commands: `/pending`, `/drafts`; callback handlers for `draft:`, `reject:`, `submit:`; `ensureAllowed(chatId)` auth |
| `src/review/notifier.ts` | — | [not inspected] Proactive Telegram alerts | — |
| `src/review/cli.ts` | — | [not inspected] Manual review CLI | — |
| `src/workers/draft_worker.ts` | 38 | Generates and persists drafts for approved jobs | `runDraftWorker()` |
| `src/workers/submit_worker.ts` | 51 | Submits approved drafts to Upwork | `runSubmitWorker()`; own `safeCheck()` (blocklist: guarantee/guaranteed results/top 1%/24/7 available) |
| `src/workers/message_runner.ts` | 309 | Processes pending client threads, builds reply drafts | `runMessageRunner()`; defines inline DDL for 4 client-thread tables; functions: `classifyIntent()`, `buildSummary()`, `buildReply()`, `sanitizeDisclosure()`, `buildEscalation()` |
| `src/workers/review_runner.ts` | 189 | Internal automated review (hype/leak detection) | `runReviewRunner()`; defines inline DDL for `internal_review_queue` / `internal_review_decisions`; `inspect()` function with blocklists |
| `graphql/search_jobs.graphql` | 13 | `SearchJobs` query — `marketplaceJobPostingsSearch` | Byte-for-byte identical to scout-agent's copy |

**Data files (`data/`):**
| File | Purpose |
|---|---|
| `data/capabilities.json` | Array of `Capability` objects with `name`, `keywords`, `evidence`, `confidence`, `active` |
| `data/search_profiles.json` | Array of `{id, name, query}` search profile objects |

**Known duplicates within this repo:**
- GraphQL query string defined in both `src/upwork/queries.ts` (string constant) AND `graphql/search_jobs.graphql` (file) — same content
- `safeCheck()` blocklist in `submit_worker.ts` differs from scout-agent's `safeCheck()` in `openclaw-upwork-job-scouter/tools/proposal_submit.ts`

---

## 2. `openclaw-upwork-job-scouter` — Scout Agent Workspace

**Role:** OpenClaw agent profile for discovering jobs, matching to capabilities, and drafting proposals. Agent workspace with its own tool registry, skills, and SOUL.

**Top-level files:**
```
.git/
AGENTS.md          # Agent coordination instructions
MEMORY.md          # Agent memory / persistent context
SOUL.md            # Agent persona and values
USER.md            # User interaction guidelines
TOOLS.md           # Tool documentation
tool-registry.json # OpenClaw tool registry
README.md
RUNBOOK.md
skills/            # OpenClaw skill definitions
profiles/          # Agent profile JSON files
tools/             # Tool implementations
graphql/           # GraphQL query files
```

**`tools/` directory — file-level inventory:**

| File | Lines | Purpose | Key Exports / Types |
|---|---|---|---|
| `tools/upwork_graphql.ts` | 274 | Feature-rich Upwork GraphQL client | `ToolResult<T>`, `GraphQLResponse<T>`, `executeUpworkGraphQL<T>()`, `upworkCompanySelector()`, `upworkSearchJobs()`, `normalizeSearchJobs()` |
| `tools/proposal_submit.ts` | 125 | Proposal submit tool with safe-check | `ToolResult<T>`, `upworkSubmitProposal()`; `safeCheck()` blocks: guaranteed results, top 1%, 24/7 available, we built the exact same thing; calls `upworkGraphQL` + `upworkMarkSubmitted()` (DB write) |
| `tools/telegram_review.ts` | 94 | Telegram send-review tool (fetch-based) | `ToolResult<T>`, `telegramSendReview()`; buttons: [Makes sense + Draft] [Reject] [Approve Submit]; no command handlers, no polling |
| `tools/upwork_store.ts` | 340 | Agent-side job/assessment/review/draft DB tool | `ToolResult<T>`, `upworkGetJobState()`, `upworkSaveRawJob()`, `upworkSaveAssessment()`, `upworkSaveReview()`, `upworkSaveDraft()`, `upworkMarkSubmitted()`, `upworkCleanupExpiredRawJobs()`; creates its own SQLite schema with `job_status` table (absent from orchestrator) |

**`graphql/` directory:**
| File | Lines | Purpose |
|---|---|---|
| `graphql/search_jobs.graphql` | 13 | Byte-for-byte identical to `upwork-job-scouter/graphql/search_jobs.graphql` |

**`profiles/` directory:**
| File | Purpose |
|---|---|
| `profiles/upwork-scout.json` | Agent profile: name `upwork-scout`, temperature 0.2, max_tokens 120, skills: `upwork_search`, `capability_match`, `job_review`, `proposal_writer`, `proposal_submit_guard` |

**Known duplicates / conflicts:**
- `upwork_graphql.ts` vs `upwork-job-scouter/src/upwork/graphql.ts` — divergent implementations (see RISK-001)
- `proposal_submit.ts` vs `upwork-job-scouter/src/tools/proposal_submit.ts` — divergent (see RISK-002); agent version writes to DB directly
- `telegram_review.ts` vs `upwork-job-scouter/src/review/telegram.ts` — divergent (see RISK-003); agent version missing commands and polling
- `upwork_store.ts` defines `jobs_raw`, `assessments`, `reviews`, `drafts`, `job_status` tables — schema diverges from orchestrator (see RISK-004, RISK-009); also directly writes to DB
- `graphql/search_jobs.graphql` vs `upwork-job-scouter/graphql/search_jobs.graphql` — byte-for-byte identical (see RISK-008)
- `review_queue.ts` in review-agent queries `application_drafts` table which does NOT exist (see RISK-007)

---

## 3. `openclaw-client-manager` — Client Manager Agent Workspace

**Role:** OpenClaw agent profile for handling client communication post-proposal. Minimal-disclosure — must only see client message threads, not full job/assessment data.

**Top-level files:**
```
.git/
AGENTS.md, MEMORY.md, SOUL.md, USER.md, TOOLS.md
tool-registry.json
profiles/           # Agent profile
tools/              # Tool implementations
skills/             # Skill definitions
```

**`tools/` directory — file-level inventory:**

| File | Lines | Purpose | Key Exports / Types |
|---|---|---|---|
| `tools/client_messages.ts` | 192 | Client thread management tool | `ToolResult<T>`, `loadClientThread()`, `saveClientReplyDraft()`, `saveClientThreadSummary()`, `saveClientEscalation()`; defines inline DDL for 4 client-thread tables using raw `better-sqlite3` — **full DB access** (see RISK-010) |

**`profiles/` directory:**
| File | Purpose |
|---|---|
| `profiles/client-manager.json` | Agent profile: name `client-manager`, temperature 0.15, max_tokens 140, skills: `requirement_clarifier`, `client_reply_writer`, `escalation_gate` |

**Known duplicates / conflicts:**
- DDL for `client_threads`, `client_reply_drafts`, `client_thread_summaries`, `client_escalations` is **byte-for-byte identical** to `message_runner.ts` lines 46-70 (see RISK-005)
- Full `better-sqlite3` instantiation with raw SQL — violates minimal disclosure invariant (see RISK-010)

---

## 4. `openclaw-review-manager` — Review Manager Agent Workspace

**Role:** OpenClaw agent profile for internal review gate — presents proposal drafts and client reply drafts for automated and human review.

**Top-level files:**
```
.git/
AGENTS.md, MEMORY.md, SOUL.md, USER.md, TOOLS.md
tool-registry.json
profiles/           # Agent profile
tools/              # Tool implementations
skills/             # Skill definitions
```

**`tools/` directory — file-level inventory:**

| File | Lines | Purpose | Key Exports / Types |
|---|---|---|---|
| `tools/review_queue.ts` | 245 | Review queue management tool | `ToolResult<T>`, `ReviewItem`, `loadReviewQueue()`, `saveReviewDecision()`, `markReviewReleased()`, `markReviewBlocked()`; defines inline DDL for `internal_review_queue` / `internal_review_decisions`; ✅ **RISK-007 FIXED** (commit `5392078`): line 63 now queries `proposals` (was `application_drafts`) |

**`profiles/` directory:**
| File | Purpose |
|---|---|
| `profiles/review-manager.json` | Agent profile: name `review-manager`, temperature 0.1, max_tokens 140, skills: `review_queue_router`, `review_decider`, `safe_send_gate` |

**Known duplicates / conflicts:**
- DDL for `internal_review_queue` / `internal_review_decisions` is **byte-for-byte identical** to `review_runner.ts` lines 26-43 (see RISK-006)
- **CRITICAL BUG**: `loadReviewQueue()` line 63 queries `FROM application_drafts` — this table does not exist in the orchestrator schema; should be `FROM proposals` (see RISK-007)

---

## Duplicate Pattern Summary

| Pattern | Locations | Risk |
|---|---|---|
| Upwork GraphQL client | `src/upwork/graphql.ts` vs `tools/upwork_graphql.ts` | RISK-001 |
| Proposal submit logic | `src/tools/proposal_submit.ts` vs `tools/proposal_submit.ts` | RISK-002 |
| Telegram review bot | `src/review/telegram.ts` vs `tools/telegram_review.ts` | RISK-003 |
| jobs/assessments/drafts schema | `src/db/store.ts` vs `tools/upwork_store.ts` | RISK-004 |
| Client-thread tables DDL | `message_runner.ts` vs `client_messages.ts` | RISK-005 |
| Internal review queue DDL | `review_runner.ts` vs `review_queue.ts` | RISK-006 |
| `application_drafts` vs `proposals` | `review_queue.ts:63` | ✅ RISK-007 FIXED |
| GraphQL query file | Both repos have identical `graphql/search_jobs.graphql` | RISK-008 |
| `job_status` vs `job_fingerprints` | `tools/upwork_store.ts` defines `job_status` absent from orchestrator | RISK-009 |
| Raw DB access in agent | `client_messages.ts` instantiates `better-sqlite3` directly | RISK-010 |
| Scout-agent DB writes | `tools/upwork_store.ts` writes directly to SQLite | RISK-011 |
