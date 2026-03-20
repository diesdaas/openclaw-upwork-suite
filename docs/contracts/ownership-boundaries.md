# Ownership Boundaries

Canonical ownership definitions for `openclaw-upwork-suite`. Phase 2 v1alpha1.

## App Ownership

| App | Role | DB Access | Telegram | Env Owner |
|---|---|---|---|---|
| `apps/orchestrator` | Central coordinator | Full (read/write) | Exclusive owner | All env vars |
| `apps/scout-agent` | Job discovery + draft | Orchestrator via contract | None | UPWORK_ACCESS_TOKEN, UPWORK_TENANT_ID |
| `apps/client-agent` | Reply drafting | Scoped: client-thread tables only | None | None |
| `apps/review-agent` | Internal review gate | Scoped: review queue tables only | None | None |

## Contract Producer/Consumer Map

| Contract | Producer | Consumer | Notes |
|---|---|---|---|
| `ScoutToWriterHandoff` | scout-agent | orchestrator | Canonical: orchestrator invokes/pulls scout |
| `ProposalDraft` | scout-agent (creates), orchestrator (stores) | scout-agent, orchestrator | Orchestrator owns canonical storage |
| `ClientThread` | orchestrator (ingestion) | orchestrator, client-agent (read-only) | Orchestrator owns ingestion + transport |
| `ClientReplyDraft` | client-agent (drafts) | review-agent (gates), orchestrator | review-agent gates before release |
| `ReviewQueueItem` | orchestrator (enqueues) | review-agent | Orchestrator enqueues; agent consumes |
| `ReviewDecision` | review-agent (decides) | orchestrator (receives) | Orchestrator acts on decision |
| `SubmissionGateRequest` | orchestrator (prepares) | human (approves) | Orchestrator prepares; human gates |
| `SubmissionResult` | orchestrator (submits) | orchestrator (logs) | Orchestrator owns Upwork API call |

## DB Table Ownership

| Table | Writer | Readers | Scoped Stores |
|---|---|---|---|
| `app_state` | orchestrator | orchestrator | — |
| `job_fingerprints` | orchestrator | orchestrator | — |
| `jobs_raw` | orchestrator | orchestrator | — |
| `assessments` | orchestrator | orchestrator | — |
| `user_reviews` | orchestrator | orchestrator | — |
| `proposals` | orchestrator | orchestrator | — |
| `polling_runs` | orchestrator | orchestrator | — |
| `client_threads` | orchestrator | orchestrator, client-agent | `createClientMessagingStore()` |
| `client_reply_drafts` | client-agent, orchestrator | client-agent, orchestrator | `createClientMessagingStore()` |
| `client_thread_summaries` | orchestrator | orchestrator, client-agent | `createClientMessagingStore()` |
| `client_escalations` | orchestrator, client-agent | orchestrator | `createClientMessagingStore()` |
| `internal_review_queue` | orchestrator | review-agent | `createReviewQueueStore()` |
| `internal_review_decisions` | review-agent | orchestrator | `createReviewQueueStore()` |

## Env Var Ownership

| Variable | Owner | Consumer | Notes |
|---|---|---|---|
| `UPWORK_ACCESS_TOKEN` | orchestrator | scout-agent (read via contract) | Scoped env pass-through |
| `UPWORK_TENANT_ID` | orchestrator | scout-agent (read via contract) | Scoped env pass-through |
| `TELEGRAM_BOT_TOKEN` | orchestrator | None else | Exclusive |
| `TELEGRAM_CHAT_ID` | orchestrator | None else | Exclusive |
| `UPWORK_SCOUT_DB` | orchestrator | orchestrator | Path to canonical SQLite |
| `MIN_CAPABILITY_FIT` | orchestrator | None else | Poller gate |
| `MAX_DELIVERY_RISK` | orchestrator | None else | Poller gate |
| `MIN_PROPOSAL_STRENGTH` | orchestrator | None else | Poller gate |
| `OPENAI_API_KEY` | orchestrator | orchestrator | Optional: AI generation |

## Scoped Store Boundaries

### `createClientMessagingStore(db, threadId?)`
- **Allowed tables:** `client_threads`, `client_reply_drafts`, `client_thread_summaries`, `client_escalations`
- **Forbidden tables:** `jobs_raw`, `assessments`, `proposals`, `job_fingerprints`, `internal_review_queue`
- Enforces thread-ID scoping on all reads

### `createReviewQueueStore(db)`
- **Allowed tables:** `internal_review_queue`, `internal_review_decisions`
- **Forbidden tables:** All other tables
- No additional scoping needed

### `createStore(db)` (orchestrator only)
- Full access to all tables
- Never exported to agent workspaces
