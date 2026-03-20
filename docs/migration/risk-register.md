# Risk Register

Documented risks identified during Phase 1 source inspection of `upwork-job-scouter`, `openclaw-upwork-job-scouter`, `openclaw-client-manager`, and `openclaw-review-manager`.

---

## RISK-001: Two Divergent Upwork GraphQL Clients

**Description:** Two files implement Upwork GraphQL HTTP clients with different interfaces, return types, and capabilities.

**Evidence:**

- `upwork-job-scouter/src/upwork/graphql.ts` (26 lines): Exports `upworkGraphQL<T>()` returning `Promise<T>`. Uses `GqlResponse<T>` with `{data?, errors?}`. Raw `fetch()` + `.json()`. No input validation. No non-JSON detection.
- `openclaw-upwork-job-scouter/tools/upwork_graphql.ts` (274 lines): Exports `executeUpworkGraphQL<T>()` returning `ToolResult<T>` with `{ok, tool, data?, error?, meta?}`. Full input validation (missing query/token/tenant). Non-JSON detection (`text = await res.text(); JSON.parse(text)` at lines 91-103). Additional helpers: `upworkSearchJobs`, `upworkCompanySelector`, `normalizeSearchJobs`. GraphQL error formatting with classification extension.

**Impact:** Medium. The agent workspace version is strictly superior (better error handling, typed result wrapper, helpers). The orchestrator version is a footgun — any non-JSON error from Upwork (e.g., 5xx, rate-limit HTML) will throw an uncaught exception rather than a handled error. Conversely, if the agent version is used as the canonical, the orchestrator's workers (`poller.ts` line 56) will break since they expect `Promise<T>` not `Promise<ToolResult<T>>`.

**Mitigation:** Extract `executeUpworkGraphQL` from the agent version as the canonical low-level HTTP primitive in `packages/upwork-api`. Have the orchestrator's `upworkGraphQL` call it internally and unwrap the `ToolResult`. Keep the helper functions (`upworkSearchJobs`, `upworkCompanySelector`, `normalizeSearchJobs`) in `packages/upwork-api`. Test both call-paths before finalizing.

**Status:** Open.

---

## RISK-002: Two Divergent Proposal Submit Implementations

**Description:** The proposal submission logic is implemented twice with different capabilities and safety guarantees.

**Evidence:**

- `upwork-job-scouter/src/tools/proposal_submit.ts` (27 lines): `submitProposal()` returns `{queued: true, mutation, variables}`. **No DB write.** No `safeCheck`. Requires `opts.humanApproved: true` guard but does nothing with it.
- `openclaw-upwork-job-scouter/tools/proposal_submit.ts` (125 lines): `upworkSubmitProposal()` calls `executeUpworkGraphQL` (from agent workspace) + `upworkMarkSubmitted` (from agent's `upwork_store.ts`). Full input validation. `safeCheck()` blocks: `"guaranteed results"`, `"top 1%"`, `"24/7 available"`, `"we built the exact same thing"`, minimum 80 chars. Returns `ToolResult<SubmitOutput>` with `{queued, submitted, response}`. Writes to `drafts` table via `upworkMarkSubmitted`.
- `upwork-job-scouter/src/workers/submit_worker.ts` (51 lines): `runSubmitWorker()` has its own `safeCheck` with different blocklist: `"guarantee"`, `"guaranteed results"`, `"top 1%"`, `"24/7 available"` — missing `"we built the exact same thing"`. Also throws on cover-letter < 80 chars.

**Impact:** High. The scout-agent version's `safeCheck` (line 35-51) blocks an extra phrase (`"we built the exact same thing"`) that the orchestrator's submit-worker does not. The scout-agent version bypasses orchestrator state by writing directly to `drafts` table (via `upwork_store.ts`), which uses a different schema than the orchestrator's `proposals` table. If both were deployed, the scout agent could mark a job as submitted in its own DB without the orchestrator knowing.

**Mitigation:** Choose `submit_worker.ts` as the canonical submit path (orchestrator is the only entity that should write submission state). Merge the superior `safeCheck` blocklist from the scout-agent version into `submit_worker.ts`. Delete the scout-agent `proposal_submit.ts` and `upwork_store.ts`. Enforce via `packages/contracts` that only the orchestrator can call the submit mutation.

**Status:** Open.

---

## RISK-003: Two Divergent Telegram Review Implementations

**Description:** The human-in-the-loop Telegram notification and interaction layer exists in two forms with different capabilities.

**Evidence:**

- `upwork-job-scouter/src/review/telegram.ts` (95 lines): Full `node-telegram-bot-api` bot with `polling: true`. Commands: `/pending` (line 66-69), `/drafts` (line 71-74). Callback handlers for `draft:`, `reject:`, `submit:` (line 76-93). Two-row inline keyboard: `[Makes sense + Draft] [Reject]` for pending; `[Approve Submit] [Reject]` for drafts. Includes `ensureAllowed(chatId)` auth check.
- `openclaw-upwork-job-scouter/tools/telegram_review.ts` (94 lines): `fetch()`-based HTTP calls to Telegram API directly. **No `/pending` or `/drafts` command handlers.** Single inline keyboard layout: `[Makes sense + Draft] [Reject]` / `[Approve Submit]` — but `[Approve Submit]` and `[Reject]` are on separate rows, unlike the orchestrator. No polling loop. No auth check. No draft preview.

**Impact:** Medium. The scout-agent version lacks the interactive command handlers (`/pending`, `/drafts`) that reviewers use to retrieve lists of items. If the scout-agent version were deployed as canonical, reviewers would lose the ability to query pending/draft items on demand. The orchestrator version is strictly more capable.

**Mitigation:** Keep `src/review/telegram.ts` as the canonical implementation in `apps/orchestrator`. Delete `tools/telegram_review.ts`. The scout agent should not send Telegram messages directly — it should submit review events to the orchestrator via `packages/contracts`, which handles Telegram delivery.

**Status:** Open.

---

## RISK-004: Duplicate Database Schema Definitions (jobs/drafts/assessments)

**Description:** The `jobs_raw`, `assessments`, `reviews`, and `drafts` table schemas are defined independently in two places with near-identical DDL.

**Evidence:**

- `upwork-job-scouter/src/db/schema.ts` (lines 19-42): `jobs_raw` table with columns `upwork_job_id`, `fetched_at`, `title`, `description`, `raw_json`, `expires_at`. `assessments` table with typed columns `capability_fit REAL`, `delivery_risk REAL`, `proposal_strength REAL`, `recommended INTEGER`, etc.
- `openclaw-upwork-job-scouter/tools/upwork_store.ts` (lines 33-66): `jobs_raw` table with columns `upwork_job_id`, `fetched_at`, `raw_json`, `expires_at` (missing `title` and `description` columns). `assessments` table stores entire object as `assessment_json TEXT` (untyped). `reviews` table stores entire object as `review_json TEXT`. `drafts` table with `draft_json` and `status TEXT`.
- `upwork-job-scouter/src/db/store.ts`: `Store` class uses typed column access (e.g., `a.capability_fit`, `r.makes_sense`) matching `schema.ts`.
- `openclaw-upwork-job-scouter/tools/upwork_store.ts`: Stores JSON blobs in TEXT columns, no typed column access.

**Impact:** High. Schema divergence: the scout-agent version lacks `title`/`description` in `jobs_raw`, and stores `assessments`/`reviews` as opaque JSON blobs rather than typed columns. If the scout-agent writes job data and the orchestrator reads it, `Store.listPendingReviewDetailed()` (which JOINs on `a.capability_fit`, `jr.title`, `jr.url`) will get NULL values for those columns. This would silently break the review workflow.

**Mitigation:** Consolidate all DB schema definitions into `packages/db`. The orchestrator's `schema.ts` is the canonical schema with typed columns. Scout-agent should NOT write to these tables directly — it should submit structured events to the orchestrator. Delete `upwork_store.ts` from the scout-agent workspace.

**Status:** Open.

---

## RISK-005: Duplicate Client-Thread Schema in message_runner and client_messages

**Description:** The four client-messaging tables (`client_threads`, `client_reply_drafts`, `client_thread_summaries`, `client_escalations`) are defined with identical DDL in both the orchestrator and the client-agent.

**Evidence:**

- `upwork-job-scouter/src/workers/message_runner.ts` (lines 46-70): Inline DDL defining all four tables. `thread_json TEXT`, `draft_json TEXT`, `summary_json TEXT`, `escalation_json TEXT` — all stored as JSON blobs.
- `openclaw-client-manager/tools/client_messages.ts` (lines 20-44): Identical DDL for all four tables, byte-for-byte the same CREATE statements.

**Impact:** Low (to migrate) / Medium (architectural). The DDL is identical, so no immediate runtime conflict. However, having two codebases define the same schema means both could open `data/state.sqlite` with `better-sqlite3` and write concurrently, corrupting state. The client-agent currently has full raw `better-sqlite3` access (see RISK-010).

**Mitigation:** Move the schema to `packages/db`. Client-agent gets a typed API (`loadClientThread`, `saveClientReplyDraft`, `saveClientThreadSummary`, `saveClientEscalation`) from `packages/db` — NOT raw `Database` access. Enforce read/write permissions via the API layer.

**Status:** Open.

---

## RISK-006: Duplicate internal_review_queue Schema in review_runner and review_queue

**Description:** The internal review pipeline tables (`internal_review_queue`, `internal_review_decisions`) are defined with identical DDL in both the orchestrator and the review-agent.

**Evidence:**

- `upwork-job-scouter/src/workers/review_runner.ts` (lines 26-43): Inline DDL. `internal_review_queue` with `item_id TEXT PRIMARY KEY`, `item_type TEXT NOT NULL`, `source_id TEXT NOT NULL`, `payload_json TEXT NOT NULL`, `status TEXT NOT NULL`, `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL`. `internal_review_decisions` with `item_id`, `decision_json TEXT NOT NULL`, `updated_at`.
- `openclaw-review-manager/tools/review_queue.ts` (lines 29-45): Identical DDL, byte-for-byte the same CREATE statements.

**Impact:** Low (DDL identical). Same concurrent-write risk as RISK-005 if both processes access the same DB file.

**Mitigation:** Consolidate schema into `packages/db`. Review-agent uses typed API from `packages/db` (functions already exist in `review_queue.ts` — just move the schema). **Fix RISK-007 first** before consolidating.

**Status:** Open.

---

## RISK-007: `review_queue.ts` References Non-Existent `application_drafts` Table

**Description:** The review-agent's `loadReviewQueue` function queries a table named `application_drafts` which does not exist in the orchestrator's schema.

**Evidence:**

- `openclaw-review-manager/tools/review_queue.ts` line 61-64:
  ```ts
  const proposalRows = conn.prepare(`
    SELECT upwork_job_id, draft_json, updated_at
    FROM application_drafts
  `).all()
  ```
- The orchestrator's `schema.ts` defines `proposals` table (line 53-59) but **no `application_drafts` table**.
- `upwork-job-scouter/src/db/store.ts` also uses `proposals` table throughout (e.g., lines 133-141, 150-154).

**Impact:** Critical (runtime crash). When `loadReviewQueue` executes, the SQLite query on line 63 will fail with `SQLITE_ERROR: no such table: application_drafts`. This will cause the review-agent to crash on every invocation.

**Mitigation:** Change line 63 of `review_queue.ts` from `FROM application_drafts` to `FROM proposals`. Also adjust column names: `draft_json` exists in `proposals`, but `updated_at` should reference `updated_at` column (which exists in `proposals`). Verify column names match the orchestrator's `proposals` schema (`upwork_job_id`, `draft_json`, `submit_status`, `submitted_at`, `updated_at`). **Fix before migration.**

**Status:** Open.

---

## RISK-008: Duplicate GraphQL Query Files

**Description:** The `search_jobs.graphql` file is present in both source repos with byte-for-byte identical content.

**Evidence:**

- `upwork-job-scouter/graphql/search_jobs.graphql` (13 lines): `query SearchJobs($query: String!, $first: Int!) { marketplaceJobPostingsSearch(...) { edges { node { id title description createdDateTime url } } } }`
- `openclaw-upwork-job-scouter/graphql/search_jobs.graphql` (13 lines): Identical content, verified byte-for-byte match.

**Impact:** Low. No runtime conflict since both are identical. Wastes storage. Indicates copy-paste drift risk — future edits to one may not propagate to the other.

**Mitigation:** Consolidate to `packages/upwork-api/graphql/search-jobs.graphql` as the single canonical copy. Delete both source copies. The `packages/upwork-api/src/agent-graphql.ts` already has an inline fallback query string if the file is missing (lines 221-235), so this is safe to dedupe.

**Status:** Open.

---

## RISK-009: `upwork_store.ts` Defines `job_status` Table Absent from Orchestrator

**Description:** The scout-agent's local store defines a `job_status` table that does not exist in the orchestrator's schema.

**Evidence:**

- `openclaw-upwork-job-scouter/tools/upwork_store.ts` lines 62-66:
  ```ts
  CREATE TABLE IF NOT EXISTS job_status (
    upwork_job_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  ```
- `upwork-job-scouter/src/db/schema.ts`: No `job_status` table defined.
- `upwork-job-scouter/src/db/store.ts` uses `job_fingerprints` table (lines 66-77) instead for tracking job status, with `last_status TEXT NOT NULL`.

**Impact:** Medium. The scout-agent uses `job_status` to track job lifecycle independently of the orchestrator. If the scout-agent writes a status update to `job_status` and the orchestrator later reads it, the orchestrator will ignore it (no such table). This creates silent divergence: the scout-agent thinks a job is in state X, the orchestrator has no record.

**Mitigation:** Delete `upwork_store.ts` from the scout-agent workspace. All job state tracking must go through the orchestrator's `job_fingerprints` table via `packages/contracts` API calls. The scout agent should never track job status locally.

**Status:** Open.

---

## RISK-010: Client-Agent Has Full Direct DB Access via `better-sqlite3`

**Description:** `openclaw-client-manager/tools/client_messages.ts` opens a raw `Database` connection and executes arbitrary SQL, giving the client-agent full read/write access to the entire SQLite database.

**Evidence:**

- `openclaw-client-manager/tools/client_messages.ts` line 18-45: `function db()` creates a `new Database(DB_FILE)` connection and executes raw CREATE TABLE statements.
- Lines 56-68, 104-112, 137-145, 170-178: Direct `.prepare().get()` and `.prepare().run()` calls with raw SQL strings.
- `DB_FILE` defaults to `process.env.UPWORK_SCOUT_DB || "data/state.sqlite"` — the same file used by the orchestrator.

**Impact:** High (architectural violation). The minimal-disclosure invariant for agent workspaces requires that agents only access data relevant to their specific task. The client-agent currently has access to:
- All job data in `jobs_raw`
- All assessments
- All proposal drafts
- All client thread data (which it legitimately needs)
- **But also** all internal review queue state, all user reviews, all fingerprints

This is a principle violation: an agent with direct DB access can read any table. If the client-agent workspace is compromised or a prompt-injection attack succeeds, the attacker has full database access.

**Mitigation:** Replace raw `Database` access in `client_messages.ts` with a typed API client from `packages/db` that only exposes the 4 client-thread operations (`loadClientThread`, `saveClientReplyDraft`, `saveClientThreadSummary`, `saveClientEscalation`). The `packages/db` package exports a `createClientMessagingStore()` factory that validates and scopes all operations to client-thread tables. The client-agent workspace must import from `packages/db` — never directly instantiate `better-sqlite3`.

**Status:** Open.

---

## RISK-011: Scout-Agent Has Its Own DB Write Tools

**Description:** The scout-agent workspace has multiple functions that write directly to SQLite, enabling it to bypass orchestrator state management.

**Evidence:**

- `openclaw-upwork-job-scouter/tools/upwork_store.ts`: Functions `upworkGetJobState`, `upworkSaveRawJob`, `upworkSaveAssessment`, `upworkSaveReview`, `upworkSaveDraft`, `upworkMarkSubmitted`, `upworkCleanupExpiredRawJobs` — all write directly to SQLite.
- `openclaw-upwork-job-scouter/tools/proposal_submit.ts` line 107: `await upworkMarkSubmitted({ jobId: input.jobId })` — writes submitted status to local DB.

**Impact:** High. The scout-agent could write job data, assessments, reviews, drafts, and submission status to its own SQLite file (`data/state.sqlite`) without the orchestrator knowing. If both processes run against the same DB file (or even separate files), the orchestrator's `Store` class would not reflect the scout-agent's writes, creating split-brain state. Additionally, the scout-agent's store schema diverges from the orchestrator's (RISK-004, RISK-009).

**Mitigation:** Delete `upwork_store.ts` from the scout-agent workspace. Replace with calls to the orchestrator via `packages/contracts`. The orchestrator's `Store` class (via `apps/orchestrator/src/db/store.ts`) is the single writer of record. Scout-agent operations that need to record state must do so by calling orchestrator APIs (Phase 2 contract definitions will specify these).

**Status:** Open.

---

## Risk Summary Table

| ID | Description | Severity | Status |
|---|---|---|---|
| RISK-001 | Two divergent Upwork GraphQL clients | Medium | Open |
| RISK-002 | Two divergent proposal submit implementations | High | Open |
| RISK-003 | Two divergent Telegram review implementations | Medium | Open |
| RISK-004 | Duplicate DB schema: jobs/drafts/assessments | High | Open |
| RISK-005 | Duplicate client-thread schema in message_runner and client_messages | Medium | Open |
| RISK-006 | Duplicate internal_review_queue schema in review_runner and review_queue | Low | Open |
| RISK-007 | `review_queue.ts` queries non-existent `application_drafts` table | **Critical** | Open |
| RISK-008 | Duplicate GraphQL query files | Low | Open |
| RISK-009 | `upwork_store.ts` defines `job_status` table absent from orchestrator | Medium | Open |
| RISK-010 | Client-agent has full direct DB access via `better-sqlite3` | High | Open |
| RISK-011 | Scout-agent has its own DB write tools | High | Open |
