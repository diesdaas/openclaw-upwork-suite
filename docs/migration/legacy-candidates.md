# Legacy Code Consolidation Candidates

These files and patterns have been identified as candidates for deprecation or consolidation during the integration phase.

- **`openclaw-upwork-job-scouter/tools/proposal_submit.ts`** -> Consolidate with `upwork-job-scouter/src/tools/proposal_submit.ts`.
- **`openclaw-upwork-job-scouter/tools/telegram_review.ts`** -> Consolidate with `upwork-job-scouter/src/review/telegram.ts`.
- **`openclaw-upwork-job-scouter/tools/upwork_graphql.ts`** -> Consolidate with `upwork-job-scouter/src/upwork/graphql.ts`.
- **`openclaw-upwork-job-scouter/tools/upwork_store.ts`** -> Deprecate in favor of the orchestrator's central database layer (`upwork-job-scouter/src/db/store.ts`).
