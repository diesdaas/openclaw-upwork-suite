# Source Repository Inventory

This document provides an inventory of the 4 source repositories that are planned for migration into the `openclaw-upwork-suite` monorepo.

## 1. `upwork-job-scouter` (Orchestrator)
The core backend service for polling, scheduling, and orchestrating tasks.
- **Workers:** `submit_worker.ts`, `message_runner.ts`, `review_runner.ts`, `draft_worker.ts`
- **Upwork API:** `graphql.ts`, `queries.ts`
- **Tools:** `proposal_generate.ts`, `proposal_submit.ts`, `approval_prompt.ts`, `capability_match_openclaw.ts`
- **Review System:** `review_service.ts`, `telegram.ts`, `notifier.ts`, `cli.ts`
- **Core:** `scheduler/poller.ts`, `db/store.ts`, `db/schema.ts`, `config.ts`, `types.ts`
- **Data:** `search_profiles.json`, `capabilities.json`

## 2. `openclaw-upwork-job-scouter` (Scout Agent Profile)
An agent profile repository tailored for discovering and initial drafting of proposals.
- **Profile:** `profiles/upwork-scout.json`
- **Tools:** `proposal_submit.ts`, `telegram_review.ts`, `upwork_store.ts`, `upwork_graphql.ts`
- **Conflicts Found:** Implements duplicate logic for `proposal_submit`, `telegram_review`, and `upwork_graphql` that already exists in the main orchestrator (`upwork-job-scouter`).

## 3. `openclaw-client-manager` (Client Manager Agent Profile)
An agent profile repository handling client communications after a proposal is submitted or accepted.
- **Profile:** `profiles/client-manager.json`
- **Tools:** `client_messages.ts`
- **Boundary Note:** Must remain **minimal-disclosure**. It should only access data relevant to active client conversations and not have global read access to the entire job database.

## 4. `openclaw-review-manager` (Review Manager Agent Profile)
An agent profile repository for human-in-the-loop (HITL) review processes.
- **Profile:** `profiles/review-manager.json`
- **Tools:** `review_queue.ts`
- **Boundary Note:** Preserves human approval boundaries.
