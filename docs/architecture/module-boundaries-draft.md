# Module Boundaries Draft

This document defines the precise boundaries for the `openclaw-upwork-suite` monorepo. It translates architectural invariants into concrete module structure, data flow, and enforcement strategy.

---

## Architectural Invariants (Non-Negotiable)

These hard rules are derived from the system requirements and must hold in the monorepo:

1. **Single source of truth for job/proposal state**: The orchestrator's `Store` class is the only writer to the canonical SQLite database. No agent workspace may write job/assessment/draft/submission state directly.

2. **Agent role separation**: Each app (`scout`, `client`, `review`) is a distinct agent identity with a scoped tool set. Agents must not import from each other's app code.

3. **Client-manager minimal disclosure**: The `client-agent` app may only access data relevant to active client conversations (client threads, reply drafts, summaries, escalations). It must NOT have access to `jobs_raw`, `assessments`, `proposals`, `job_fingerprints`, `polling_runs`, or `internal_review_queue`.

4. **Human approval gate**: No proposal is submitted to Upwork without an explicit human approval recorded in `user_reviews.approved_to_submit = 1`. The `submit_worker.ts` safe-check must block overclaiming phrases.

5. **Anti-overclaiming**: Client-facing text (cover letters, reply drafts) must not contain: "guarantee", "guaranteed results", "top 1%", "24/7 available", "we built the exact same thing". The `review_runner.ts` `inspect()` function enforces this automatically.

6. **Anti-leak**: Client-facing text must not expose internal methods: "openclaw", "sub-agent", "runner", "prompt", "toolchain", "workflow", "orchestration", "internal process". The `message_runner.ts` `sanitizeDisclosure()` function enforces this for client replies.

7. **No agent polling processes**: Telegram polling (`node-telegram-bot-api` with `polling: true`) must run in exactly one process — the orchestrator. No agent workspace may run its own polling bot.

---

## Monorepo Structure

```
openclaw-upwork-suite/
├── apps/
│   ├── orchestrator/       # Formerly upwork-job-scouter
│   ├── scout-agent/         # Formerly openclaw-upwork-job-scouter
│   ├── client-agent/        # Formerly openclaw-client-manager
│   └── review-agent/       # Formerly openclaw-review-manager
├── packages/
│   ├── contracts/           # Canonical TypeScript interfaces
│   ├── upwork-api/          # Upwork GraphQL client + helpers
│   └── db/                  # SQLite schema + typed store factories
├── package.json             # Workspace root
├── pnpm-workspace.yaml
├── turbo.json
└── docs/
```

### `apps/orchestrator`

The central service. All cron jobs, workers, and human-in-the-loop coordination live here.

**Canonical source files (move as-is, update import paths):**
```
src/
  index.ts                   # Main entry: wires polling + notifier + workers
  config.ts                 # Runtime env config (gates, polling interval, etc.)
  scheduler/
    poller.ts               # runPollingCycle() — fetches jobs, scores, notifies
  db/
    store.ts                # Store class — all DB reads/writes; imports from packages/db
  review/
    review_service.ts       # ReviewService — approveDraft/approveSubmit/reject
    telegram.ts              # Telegram bot (node-telegram-bot-api, /pending, /drafts, callbacks)
    notifier.ts              # Proactive Telegram notifications
    cli.ts                   # Manual review CLI
  tools/
    proposal_generate.ts     # generateProposalDraft() — template-based cover letter
    proposal_submit.ts       # submitProposal() — raw mutation builder (no DB write)
    capability_match.ts      # matchJobToCapabilities() — keyword scorer
    approval_prompt.ts       # buildApprovalPrompt() — human-readable card
  workers/
    draft_worker.ts          # runDraftWorker() — generates drafts for approved jobs
    submit_worker.ts         # runSubmitWorker() — submits approved drafts (safeCheck here)
    message_runner.ts        # runMessageRunner() — processes client threads
    review_runner.ts         # runReviewRunner() — hype/leak detector
data/
  state.sqlite               # Canonical SQLite database (all tables)
  capabilities.json           # Capability definitions
  search_profiles.json       # Poller search queries
```

**Boundary rules:**
- Imports `packages/upwork-api` for GraphQL calls
- Imports `packages/db` for schema and store factory
- Imports `packages/contracts` for shared interfaces
- Orchestrator is the ONLY process that opens `data/state.sqlite` for writing
- Telegram bot polling runs here and here only

### `apps/scout-agent`

Job-finding and proposal-drafting agent. **Stripped**: no local GraphQL client, no local DB, no local submit.

**Canonical source files (move as-is):**
```
profiles/
  upwork-scout.json          # Agent profile: temperature, skills, toolRegistry
skills/                      # OpenClaw skill definitions
tools/                       # Agent tool implementations (see below)
```

**Tools to DELETE from scout-agent** (migrated to packages or deprecated):
- `tools/upwork_graphql.ts` → merge into `packages/upwork-api/src/agent-graphql.ts`
- `tools/proposal_submit.ts` → DELETE (submit goes through orchestrator)
- `tools/telegram_review.ts` → DELETE (orchestrator owns Telegram)
- `tools/upwork_store.ts` → DELETE (orchestrator owns all DB state)

**Tools to ADD to scout-agent** (contract-based):
- `tools/submit-to-orchestrator.ts` — submits job/assessment data to orchestrator via contract (Phase 2)

**Boundary rules:**
- Imports `packages/upwork-api` for job search
- Imports `packages/contracts` for all data types
- **NEVER** imports `packages/db` directly (no raw SQLite)
- Calls orchestrator via contracts for state writes
- Zero Telegram code

### `apps/client-agent`

Client communication agent. **Minimal disclosure enforced**: scoped to client-thread operations only.

**Canonical source files (move as-is):**
```
profiles/
  client-manager.json        # Agent profile: temperature 0.15, skills
skills/                      # OpenClaw skill definitions
tools/
  client_messages.ts         # Tool wrappers — but refactored to use packages/db scoped API
```

**`tools/client_messages.ts` refactoring required:**
- Current: raw `new Database(...)` with full `better-sqlite3` access (RISK-010)
- Target: imports `createClientMessagingStore()` from `packages/db` — exposes only 4 operations

**Boundary rules:**
- Imports `packages/db` via scoped factory only (`createClientMessagingStore()`)
- **NEVER** imports `packages/db` raw (no `new Database(...)`)
- **NEVER** has access to `jobs_raw`, `assessments`, `proposals`, `job_fingerprints`, `internal_review_queue`
- **Only** accessible tables: `client_threads`, `client_reply_drafts`, `client_thread_summaries`, `client_escalations`
- Zero Telegram code

### `apps/review-agent`

Internal review gate. Presents proposal and reply drafts for automated/human review.

**Canonical source files (move as-is):**
```
profiles/
  review-manager.json        # Agent profile: temperature 0.1, skills
skills/                      # OpenClaw skill definitions
tools/
  review_queue.ts            # Tool wrappers — refactored to use packages/db scoped API
```

**`tools/review_queue.ts` refactoring required:**
- **BUG FIX FIRST**: Change line 63 `FROM application_drafts` → `FROM proposals` (RISK-007)
- Current: raw `new Database(...)`
- Target: imports `createReviewQueueStore()` from `packages/db`

**Boundary rules:**
- Imports `packages/db` via scoped factory only
- **NEVER** has access to `jobs_raw`, `client_threads` (review and client threads are separate domains)
- Zero Telegram code

### `packages/contracts`

Canonical TypeScript interfaces for all cross-agent data contracts.

**Intended contents:**
```
src/
  types.ts                   # Canonical domain types:
                              # JobDetail, MatchResult, ProposalDraft, ApprovalDecision,
                              # ScoutToWriterHandoff, ClientThread, ClientReplyDraft,
                              # ReviewQueueItem, ReviewDecision, SubmissionGateRequest,
                              # PolicyContract
  tool-result.ts             # ToolResult<T> — universal agent response envelope
  env-contract.ts            # CommonEnvContract — env var definitions
  db-contract.ts             # CommonDbContract — table ownership matrix
index.ts                      # Re-exports all contracts
```

**Canonical types sourced from:**
- `upwork-job-scouter/src/types.ts` → canonicalize `JobDetail`, `MatchResult`, `ProposalDraft`, `ApprovalDecision`
- `precanonical-contract-list.md` → canonicalize `ScoutToWriterHandoff`, `ClientThread`, `ClientReplyDraft`, `ReviewQueueItem`, `ReviewDecision`, `SubmissionGateRequest`, `PolicyContract`
- Scout agent `tools/*.ts` → canonicalize `ToolResult<T>`

**Gap priorities (from interface-inventory.md):**
| Priority | Type | Gap |
|---|---|---|
| HIGH | `JobDetail` | Not yet in precanonical list |
| HIGH | `MatchResult` | Not yet in precanonical list |
| HIGH | `ToolResult<T>` | Not yet canonical; used in every agent tool |
| HIGH | `ApprovalDecision` | Not yet in precanonical list |
| MEDIUM | `ProposalDraft` | Code is simplified subset; missing 5 canonical fields |
| MEDIUM | `ClientThread` | 4 canonical fields missing; `relatedId` vs `jobId` |
| MEDIUM | `ReviewQueueItem` | 8 canonical fields missing; `client_reply` vs `reply` |
| MEDIUM | `ReviewDecision` | `itemId` not in object; `block` missing |

### `packages/upwork-api`

Canonical Upwork GraphQL client and helpers.

**Intended contents:**
```
src/
  graphql.ts                 # executeUpworkGraphQL() — ToolResult<T> wrapper, full validation
  agent-graphql.ts           # upworkSearchJobs(), upworkCompanySelector(), normalizeSearchJobs()
  queries.ts                 # MARKETPLACE_JOB_SEARCH_QUERY (string constant)
  proposal-submit.ts         # submitProposal() — raw mutation builder
graphql/
  search-jobs.graphql        # Canonical .graphql file (single copy)
```

**Canonical source files:**
- `openclaw-upwork-job-scouter/tools/upwork_graphql.ts` → `src/graphql.ts` + `src/agent-graphql.ts`
- `upwork-job-scouter/src/upwork/graphql.ts` → merge features into `src/graphql.ts`
- `upwork-job-scouter/src/upwork/queries.ts` → `src/queries.ts`
- `upwork-job-scouter/graphql/search_jobs.graphql` → `graphql/search-jobs.graphql` (dedup)
- `openclaw-upwork-job-scouter/graphql/search_jobs.graphql` → DELETE (deduplicated)
- `upwork-job-scouter/src/tools/proposal_submit.ts` → `src/proposal-submit.ts`
- `openclaw-upwork-job-scouter/tools/proposal_submit.ts` → DELETE (merged)

**Boundary rules:**
- No `packages/db` imports — pure HTTP client
- No agent workspace imports
- Consumed by orchestrator and scout-agent only

### `packages/db`

Canonical SQLite schema and typed store factories.

**Intended contents:**
```
src/
  schema.sql                 # Canonical DDL — all 11 tables in one place
  create-store.ts            # createStore() — returns full Store class for orchestrator
  create-client-store.ts     # createClientMessagingStore() — scoped to 4 client tables
  create-review-store.ts     # createReviewQueueStore() — scoped to review queue tables
```

**Canonical source files:**
- `upwork-job-scouter/src/db/schema.ts` → `schema.sql`
- `upwork-job-scouter/src/db/store.ts` → orchestrator-only `createStore()` in `packages/db`
- `upwork-job-scouter/src/workers/message_runner.ts` (DDL portion) → `schema.sql`
- `upwork-job-scouter/src/workers/review_runner.ts` (DDL portion) → `schema.sql`
- `openclaw-client-manager/tools/client_messages.ts` (DDL + wrappers) → `createClientStore()`
- `openclaw-review-manager/tools/review_queue.ts` (DDL + wrappers + BUG FIX) → `createReviewStore()`

**Schema consolidation (11 tables total):**
| Table | Source | Consumers |
|---|---|---|
| `app_state` | schema.ts | Orchestrator only |
| `job_fingerprints` | schema.ts | Orchestrator only |
| `jobs_raw` | schema.ts | Orchestrator only |
| `assessments` | schema.ts | Orchestrator only |
| `user_reviews` | schema.ts | Orchestrator only |
| `proposals` | schema.ts | Orchestrator only |
| `polling_runs` | schema.ts | Orchestrator only |
| `client_threads` | message_runner.ts / client_messages.ts | Client-agent (scoped) |
| `client_reply_drafts` | message_runner.ts / client_messages.ts | Client-agent (scoped) |
| `client_thread_summaries` | message_runner.ts / client_messages.ts | Client-agent (scoped) |
| `client_escalations` | message_runner.ts / client_messages.ts | Client-agent (scoped) |
| `internal_review_queue` | review_runner.ts / review_queue.ts | Review-agent (scoped) |
| `internal_review_decisions` | review_runner.ts / review_queue.ts | Review-agent (scoped) |

**Boundary enforcement for agents:**
- `createClientMessagingStore()` validates thread ID before any DB operation — client-agent cannot query arbitrary job data
- `createReviewQueueStore()` validates item ID before any DB operation
- Agents import the factory function, not `better-sqlite3` directly
- Enforced by ESLint rule: no `import Database from "better-sqlite3"` in agent workspaces

---

## Data Flow Diagram

```
                    ┌─────────────────────────────────────────────────┐
                    │  apps/orchestrator                               │
                    │                                                 │
 Upwork GraphQL ───►│  scheduler/poller ──► jobs_raw ──► assessments │
                    │         │                        │               │
                    │         ▼                        ▼               │
                    │  review/telegram ◄── review_service ◄── user_   │
                    │         │                        │  reviews      │
                    │         │                        ▼               │
                    │  workers/draft_worker ──► proposals             │
                    │         │                        │               │
                    │         ▼                        ▼               │
                    │  workers/submit_worker ──► Upwork API (submit)  │
                    │                                                 │
                    │  workers/message_runner ◄── client_threads      │
                    │  (builds reply drafts)      (from packages/db)   │
                    │         │                                       │
                    │         ▼                                       │
                    │  workers/review_runner ◄── internal_review_queue│
                    │                                                 │
                    └──────────────┬──────────────────────────────────┘
                                   │ packages/contracts (interfaces)
                    ┌──────────────┼────────────────┬──────────────────┐
                    ▼              ▼                ▼                  ▼
          ┌────────────────┐ ┌──────────┐  ┌──────────────┐  ┌─────────────┐
          │ apps/scout-    │ │ packages │  │ apps/client-  │  │ apps/review-│
          │ agent          │ │ /upwork  │  │ agent         │  │ agent       │
          │                │ │ -api     │  │               │  │             │
          │ upworkSearch   │ └────┬─────┘  │ loadClient    │  │ loadReview  │
          │ Jobs()            │      │      │ Thread()      │  │ Queue()     │
          │                │      │      │               │  │             │
          │ (reads jobs    │      │      │ (scoped to    │  │ (scoped to  │
          │  from orch.)   │      │      │  client-       │  │  review     │
          │                │      │      │  threads only) │  │  queue only)│
          └────────────────┘      │      └───────────────┘  └─────────────┘
                                 │
                    ┌───────────┴───────────┐
                    │ packages/upwork-api   │
                    │ executeUpworkGraphQL  │
                    │ upworkSearchJobs      │
                    │ normalizeSearchJobs   │
                    └───────────────────────┘
```

---

## Boundary Enforcement Strategy

How to prevent agents from bypassing constraints at runtime:

**1. Package imports (TypeScript module system)**
- `packages/db` exports only factory functions and typed interfaces — no raw `Database` class export
- Agent `tsconfig.json` sets `paths` to `packages/*` but NOT `better-sqlite3`
- ESLint rule `no-restricted-imports` blocks `better-sqlite3` in agent workspaces

**2. Database file permissions**
- `data/state.sqlite` owned by orchestrator process only
- Agent workspaces run as separate OS users or in separate containers with read-only access to `state.sqlite` for client-agent and review-agent (write via IPC to orchestrator)

**3. Scoped DB factories (RISK-010 mitigation)**
- `createClientMessagingStore(db: Database, threadId: string)` — wraps all operations with `WHERE thread_id = ?`
- `createReviewQueueStore(db: Database, allowedItemTypes: string[])` — validates item type on every write

**4. Contract layer (Phase 2)**
- Scout-agent communicates job/assessment data via `packages/contracts` typed calls to orchestrator REST endpoint
- Orchestrator validates all incoming contract calls before writing to DB
- Client-agent sends reply drafts via contract → orchestrator queues for human review

**5. Telegram ownership**
- Single Telegram bot token in orchestrator only
- Scout-agent and client-agent send messages via orchestrator contract, not directly via Telegram API
