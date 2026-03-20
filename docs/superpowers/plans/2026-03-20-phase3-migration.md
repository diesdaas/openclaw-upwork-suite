# Phase 3: Implementation Migration

> **For agentic workers:** Execute task-by-task.

**Goal:** Migrate source code from 4 legacy repos into monorepo structure, wire to Phase 2 canonical contracts, fix locked naming, establish app scaffolding.

**Architecture:** Source files move into `apps/*` and `packages/*` per source-mapping.md. Legacy types replaced with Phase 2 contracts. Temporary adapters allowed for staged migration.

---

## Task 1: Scaffold app directories + orchestrator entry

**Files:**
- Create: `apps/orchestrator/src/index.ts`
- Create: `apps/orchestrator/src/config.ts`
- Create: `apps/orchestrator/.env.example`
- Copy: `upwork-job-scouter/src/index.ts` → `apps/orchestrator/src/index.ts`
- Copy: `upwork-job-scouter/src/config.ts` → `apps/orchestrator/src/config.ts`

**Action:** Copy orchestrator entry files, create .env.example scaffold.
**Verify:** `ls apps/orchestrator/src/`

---

## Task 2: Migrate packages/db schema

**Files:**
- Create: `packages/db/src/schema.sql`
- Modify: `packages/db/src/contract.ts` (wire schema definitions)
- Copy: `upwork-job-scouter/src/db/schema.ts` → `packages/db/src/schema.sql`

**Action:** Extract canonical DDL into `packages/db/src/schema.sql`. Extract client-thread and review-queue DDL from `message_runner.ts` and `review_runner.ts` inline DDL.
**Verify:** Schema includes all 13 tables from ownership-boundaries.md

---

## Task 3: Migrate packages/upwork-api GraphQL

**Files:**
- Create: `packages/upwork-api/src/graphql.ts`
- Create: `packages/upwork-api/src/queries.ts`
- Create: `packages/upwork-api/graphql/search-jobs.graphql`
- Copy: `upwork-job-scouter/src/upwork/graphql.ts` → `packages/upwork-api/src/graphql.ts`
- Copy: `upwork-job-scouter/src/upwork/queries.ts` → `packages/upwork-api/src/queries.ts`
- Copy: `upwork-job-scouter/graphql/search_jobs.graphql` → `packages/upwork-api/graphql/search-jobs.graphql`

**Action:** Merge GraphQL client into packages/upwork-api. Keep orchestrator version as canonical.
**Verify:** File exists + `npx tsc --noEmit packages/upwork-api/src/graphql.ts`

---

## Task 4: Migrate orchestrator workers (poller + draft)

**Files:**
- Create: `apps/orchestrator/src/scheduler/poller.ts`
- Create: `apps/orchestrator/src/tools/proposal-generate.ts`
- Create: `apps/orchestrator/src/tools/approval-prompt.ts`
- Create: `apps/orchestrator/src/tools/capability-match.ts`
- Create: `apps/orchestrator/src/workers/draft-worker.ts`
- Copy + wire: orchestrator poller, draft_worker, proposal_generate, capability_match, approval_prompt

**Action:** Copy files, update imports to use `packages/upwork-api` for GraphQL.
**Verify:** Worker files compile; no `../../db/store` circular imports

---

## Task 5: Migrate submit_worker + emit SubmissionGateRequest

**Files:**
- Create: `apps/orchestrator/src/workers/submit-worker.ts`
- Copy: `upwork-job-scouter/src/workers/submit_worker.ts` → `apps/orchestrator/src/workers/submit-worker.ts`
- Modify: Update to import `SubmissionGateRequest` from `packages/shared-types`
- Modify: Add `createSubmissionGateRequest()` call; remove direct mutation call

**Action:** Copy submit_worker. Change to emit `SubmissionGateRequest` instead of direct submit. Add import of `safeCheckProposal` from `packages/policies`.
**Verify:** safeCheck blocklist includes "we built the exact same thing" (already fixed in source commit)

---

## Task 6: Migrate orchestrator review (telegram + review_service)

**Files:**
- Create: `apps/orchestrator/src/review/telegram.ts`
- Create: `apps/orchestrator/src/review/review-service.ts`
- Create: `apps/orchestrator/src/review/notifier.ts`
- Create: `apps/orchestrator/src/review/cli.ts`
- Copy: All 4 review files from orchestrator

**Action:** Copy Telegram bot (full `node-telegram-bot-api`), review service, notifier, CLI.
**Verify:** `apps/orchestrator/src/review/telegram.ts` imports from `packages/policies` for any policy checks

---

## Task 7: Migrate message_runner + review_runner

**Files:**
- Create: `apps/orchestrator/src/workers/message-runner.ts`
- Create: `apps/orchestrator/src/workers/review-runner.ts`
- Create: `apps/orchestrator/src/tools/proposal-submit.ts`
- Copy: `upwork-job-scouter/src/workers/message_runner.ts` → `apps/orchestrator/src/workers/message-runner.ts`
- Copy: `upwork-job-scouter/src/workers/review_runner.ts` → `apps/orchestrator/src/workers/review-runner.ts`
- Copy: `upwork-job-scouter/src/tools/proposal_submit.ts` → `apps/orchestrator/src/tools/proposal-submit.ts`
- Modify: message_runner — replace inline DDL with `packages/db` schema
- Modify: review_runner — replace inline DDL with `packages/db` schema
- Modify: message_runner — fix locked naming: `jobId?` → `relatedEntityId` + `relatedEntityType`; `reply` → `replyText`
- Modify: review_runner — fix locked naming: `status` → `reviewStatus`; add `client_reply` item type

**Action:** Copy workers, strip inline DDL (consolidated to packages/db), fix locked naming.
**Verify:** No inline CREATE TABLE statements in worker files; locked names used consistently

---

## Task 8: Migrate agent workspaces (scout, client, review)

**Files:**
- Create: `apps/scout-agent/` — SOUL.md, AGENTS.md, USER.md, MEMORY.md, TOOLS.md, tool-registry.json, profiles/upwork-scout.json, skills/
- Create: `apps/client-agent/` — SOUL.md, AGENTS.md, USER.md, MEMORY.md, TOOLS.md, tool-registry.json, profiles/client-manager.json, skills/
- Create: `apps/review-agent/` — SOUL.md, AGENTS.md, USER.md, MEMORY.md, TOOLS.md, tool-registry.json, profiles/review-manager.json, skills/
- Copy agent identity files (SOUL, AGENTS, USER, MEMORY, TOOLS, tool-registry, profiles, skills)

**Action:** Create app scaffolding with agent identity files. Do NOT copy tool implementations (those are deprecated per RISK-002, RISK-003, RISK-011).
**Verify:** Agent directories exist with identity files; tool-registry is empty or points to contract-only tools

---

## Task 9: Verify packages compile with new wiring

**Action:** Run `npx tsc --noEmit` across all packages with orchestrator files.
**Verify:** All TypeScript compiles without errors.

---

## Task 10: Update migration docs to reflect Phase 3 status

**Files:**
- Modify: `docs/migration/risk-register.md` — mark migration-started notes
- Modify: `docs/migration/legacy-candidates.md` — update status of migrated files
- Create: `docs/migration/phase3-status.md` — what was migrated, what remains

**Action:** Update docs to reflect Phase 3 completion.
**Verify:** Files updated and committed.
