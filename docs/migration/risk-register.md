# Risk Register

## Identified Risks During Phase 1 Audit

1. **Duplicate Implementation - Upwork API**
   - **Risk:** `openclaw-upwork-job-scouter` and `upwork-job-scouter` both implement `upwork_graphql.ts` / `src/upwork/graphql.ts` and `proposal_submit.ts` / `src/tools/proposal_submit.ts`.
   - **Impact:** Divergent logic for querying or submitting proposals.
   - **Mitigation:** Unify into a single `packages/upwork-api` module.

2. **Duplicate Implementation - Review Logic**
   - **Risk:** Telegram review logic is scattered (`tools/telegram_review.ts` in `openclaw-upwork-job-scouter` vs `src/review/telegram.ts` in `upwork-job-scouter`).
   - **Impact:** Human-in-the-loop workflows might trigger inconsistently.
   - **Mitigation:** Consolidate into the orchestrator or `review-agent`.

3. **Agent Boundary Dilution**
   - **Risk:** Flattening agent repositories into a monorepo might lead to cross-contamination of logic and permissions.
   - **Impact:** `client-agent` could accidentally gain full database access, violating the minimal-disclosure invariant.
   - **Mitigation:** Use explicit contracts (`packages/contracts`) and strict TypeScript configurations to enforce boundaries between `apps/`.
