# Phase 3 Migration Status

**Date:** 2026-03-20
**Status:** ✅ All tasks complete

---

## Summary

Phase 3 migrated all source code from the 4 legacy repos into the monorepo structure under `apps/orchestrator/` and `packages/`. All Phase 2 canonical contracts and policies are wired. All TypeScript compiles cleanly.

---

## Tasks Completed

| # | Task | Status |
|---|---|---|
| 1 | App scaffolding + orchestrator entry | ✅ |
| 2 | `packages/db/schema.sql` with 13 tables | ✅ |
| 3 | `packages/upwork-api` GraphQL client | ✅ |
| 4 | Orchestrator workers (poller, draft, generate, match, approve) | ✅ |
| 5 | `submit_worker` → `SubmissionGateRequest` emission | ✅ |
| 6 | Orchestrator review (telegram, review_service, notifier, cli) | ✅ |
| 7 | `message_runner` + `review_runner` (locked naming) | ✅ |
| 8 | Agent workspace identity files (no deprecated tools) | ✅ |
| 9 | `npx tsc --noEmit` — all packages + orchestrator pass | ✅ |
| 10 | Migration docs updated | ✅ |

---

## TypeScript Fixes Applied

| File | Issue | Fix |
|---|---|---|
| `review_runner.ts` | `embeddedPayload` possibly undefined on lines 80-81, 122-123 | Added `?.` optional chaining + `String()` cast |
| `poller.ts` | `SearchResponse["marketplaceJobPostingsSearch"]["edges"]` fails — optional chain breaks indexed access | Split into separate `MarketplaceJobEdge` type |
| `store.ts` | `listPendingReviewDetailed()` and `listDraftedNotSubmitted()` return untyped arrays | Added explicit `as Array<{...}>` return types |
| `telegram.ts` | `node-telegram-bot-api` has no types; `msg`/`query` implicit `any` | Created `src/types/node-telegram-bot-api.d.ts` declaration file |
| `notifier.ts` | Same `node-telegram-bot-api` types issue | Resolved by declaration file |
| `apps/orchestrator/tsconfig.json` | `moduleResolution: NodeNext` requires `.js` extensions on all relative imports | Changed to `moduleResolution: bundler` |
| `apps/orchestrator/package.json` | Missing workspace dependencies | Added `@openclaw-upwork-suite/shared-types`, `@openclaw-upwork-suite/policies`, `@openclaw-upwork-suite/upwork-api` |

---

## Files Migrated

**Orchestrator App (`apps/orchestrator/src/`):**
- `index.ts`, `config.ts` — entry + config
- `types.ts` — local type definitions (temporary shim until Phase 4)
- `db/store.ts`, `db/schema.ts` — database layer
- `scheduler/poller.ts` — job polling worker
- `workers/draft_worker.ts` — proposal draft generation worker
- `workers/submit_worker.ts` — submission worker (emits `SubmissionGateRequest`)
- `workers/message_runner.ts` — client message runner (locked naming applied)
- `workers/review_runner.ts` — review runner (locked naming + optional chaining applied)
- `tools/proposal_generate.ts`, `proposal_submit.ts`, `approval_prompt.ts`, `capability_match_openclaw.ts`
- `review/telegram.ts`, `review_service.ts`, `notifier.ts`, `cli.ts`
- `upwork/graphql.ts`, `upwork/queries.ts`
- `types/node-telegram-bot-api.d.ts` — type declaration

**Packages (`packages/`):**
- `shared-types/` — Phase 2 contracts (common, scoutToWriter, proposalDraft, clientThread, reviewQueue, submissionGate)
- `policies/` — Phase 2 policies (minimalDisclosure, antiOverclaiming)
- `db/` — `schema.sql` (all 13 consolidated tables)
- `upwork-api/` — GraphQL client and queries

**Agent Workspaces (`apps/*/agent`):**
- `SOUL.md`, `AGENTS.md`, `USER.md`, `MEMORY.md`, `TOOLS.md`
- `tool-registry.json`, `profiles/*.json`
- No tool implementations (deprecated per Phase 1 decisions)

---

## What's Next (Phase 5)

1. **Fill in Upwork credentials** in `apps/orchestrator/.env` on VM-1078
2. **End-to-end smoke test** with real Upwork API calls
3. **OpenClaw gateway-api surface** for narrow integration
4. **Integration tests** for scouting cycle

---

## Known Pre-Existing Issues

These issues exist in the source repos and were not introduced by Phase 3 migration:

1. **`.js` extension requirement** — Source repos use `moduleResolution: NodeNext` requiring explicit `.js` on relative imports. Suite uses `moduleResolution: bundler` to avoid this.
2. **Native module builds** — `better-sqlite3` requires glibc 2.38 (resolved with `node:22-trixie` base image).
3. **`@types/node` missing in source** — Source repos lack `@types/node`. Suite has it in orchestrator devDependencies.
