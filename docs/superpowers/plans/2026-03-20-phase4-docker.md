# Phase 4 + Dockerization Implementation Plan

> **For agentic workers:** Execute batch by batch. Do not pause for approval unless blocked.

**Goal:** Stabilize Phase 4 (package wiring, locked contracts, native modules) and create first safe Dockerization pass for the Upwork suite.

**Architecture:** Monorepo with pnpm workspaces. Orchestrator owns submission + Telegram. Agent workspaces are minimal. Suite runs as its own docker-compose stack.

**Tech Stack:** TypeScript, pnpm, Docker, Docker Compose, better-sqlite3, node-telegram-bot-api, Postgres, Redis.

---

## Phase 4: Stabilization

### Task A1: Wire packages/* imports into orchestrator app

**Scope:** Replace local type shims and inline types in `apps/orchestrator/src/` with actual imports from `packages/shared-types`, `packages/policies`, `packages/upwork-api`.

**Files to check:**
- `apps/orchestrator/src/types.ts` — local type defs (capability_match, ProposalDraft, JobDetail, etc.)
- `apps/orchestrator/src/workers/submit_worker.ts` — uses `safeCheckProposal` from `packages/policies`
- `apps/orchestrator/src/tools/proposal_generate.ts` — uses `ProposalDraft` type
- `apps/orchestrator/src/db/store.ts` — uses `ApprovalDecision` type

**Action:** 
1. Add `import type { ... } from "@openclaw-upwork-suite/shared-types"` where Phase 2 contracts exist
2. Add `import { safeCheckProposal } from "@openclaw-upwork-suite/policies"` where missing
3. Keep local `types.ts` shims only where no Phase 2 contract exists yet (e.g., `JobDetail`, `Capability`)
4. Add `// TEMP: using local shim` comments for deferred items

**Verify:** `cd /home/openclaw/.openclaw/workspace/openclaw-upwork-suite && npx tsc --noEmit -p apps/orchestrator/tsconfig.json`

---

### Task A2: Migrate ProposalDraft usage to locked contract

**Files:**
- `apps/orchestrator/src/tools/proposal_generate.ts` — creates proposal draft
- `apps/orchestrator/src/db/store.ts` — saves drafts
- `packages/shared-types/src/contracts/proposalDraft.ts` — locked contract

**Action:**
1. Update `proposal_generate.ts` to return the locked `ProposalDraft` shape with required fields:
   - `draftId` (uuid)
   - `version` (1)
   - `approvalState` ("draft")
   - `qualityFlags` (empty array)
   - `createdBy` ("orchestrator")
2. Update `store.ts` saveDraft() to accept the locked shape
3. Add `newProposalDraft()` factory from contracts if helpful

**Verify:** TypeScript compiles, factory pattern works.

---

### Task A3: Fix native module build

**File:** `apps/orchestrator/package.json`

**Action:**
1. Add `"prepare": "pnpm approve-builds"` or document the manual step
2. Run `pnpm approve-builds` for `better-sqlite3` and `esbuild`
3. If native build fails, add platform-specific fallback or `@vscompiler/sqlite` alternative

**Alternative (safer):** Use `better-sqlite3` with pre-built binaries, add `.npmrc` with `prebuild=true`.

**Verify:** `node -e "require('better-sqlite3')"` works inside the package.

---

### Task A4: Verify all packages + orchestrator typecheck

**Action:** Run `npx tsc --noEmit` on all 4 packages and the orchestrator app.

**Expected:** EXIT 0 on all.

---

## Phase B: Tests Before Docker

### Task B1: Workspace typecheck (smoke)

**Action:** `pnpm install && npx tsc --noEmit` across all packages.

---

### Task B2: Add smoke tests for touched logic

**Files to test:**
1. `packages/shared-types/src/contracts/proposalDraft.ts` — `newProposalDraft()` factory
2. `packages/policies/src/antiOverclaiming.ts` — `safeCheckProposal` with "we built the exact same thing"
3. `packages/policies/src/minimalDisclosure.ts` — `sanitizeDisclosure`, `hasBannedTerms`
4. `packages/shared-types/src/contracts/submissionGate.ts` — `createSubmissionGateRequest`

**Action:** Create `packages/*/src/*.test.ts` for each. Use Node.js built-in `test` runner or simple `console.assert`.

**Verify:** Tests pass.

---

## Phase C: Dockerization

### Task C1: Create Dockerfile for orchestrator

**File:** `apps/orchestrator/Dockerfile`

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/orchestrator/package.json apps/orchestrator/
RUN corepack enable && pnpm install --frozen-lockfile
COPY apps/orchestrator ./apps/orchestrator
RUN pnpm -r build --filter=@openclaw-upwork-suite/orchestrator || true
CMD ["node", "apps/orchestrator/dist/index.js"]
```

**Key points:**
- Multi-stage build for minimal image
- `better-sqlite3` needs `node-gyp` + build tools (use `node:22-bookworm-slim` for glibc or `node:22-alpine` with python/make)
- Secrets via env vars only (no docker.sock, no privileged mode)
- Non-root user

---

### Task C2: Create agent Dockerfiles

**Files:** `apps/scout-agent/Dockerfile`, `apps/client-agent/Dockerfile`, `apps/review-agent/Dockerfile`

Each agent is a minimal Node.js service with its own identity files. Agents don't need database access directly.

---

### Task C3: Create docker-compose.yml

**File:** `docker-compose.yml` (or `compose.yaml`)

**Services:**
- `postgres` — for job_fingerprints, job_status, client_threads, review_queue
- `redis` — for job queue / caching (optional for v1)
- `orchestrator` — main app
- `scout-agent` — upwork-scout (stateless, called by orchestrator)
- `client-agent` — client-manager (stateless, called by orchestrator)
- `review-agent` — review-manager (stateless, called by orchestrator)

**No:** docker.sock mount, privileged containers, host networking

**Volumes:** 
- `./data:/app/data` — SQLite files + capabilities.json
- `./logs:/app/logs`

**Healthchecks:**
- postgres: `pg_isready`
- orchestrator: HTTP ping or file check
- agents: file-based readiness marker

---

### Task C4: Create .dockerignore and .env.example

**File:** `.dockerignore` — ignore node_modules, .git, docs, *.test.ts
**File:** `.env.example` — all required env vars (UPWORK_ACCESS_TOKEN, UPWORK_TENANT_ID, TELEGRAM_BOT_TOKEN, DATABASE_URL, etc.)

---

## Phase D: Containerized Checks

### Task D1: Build images

**Action:** `docker compose build` or `docker compose build --no-cache`

---

### Task D2: Start stack + healthchecks

**Action:** `docker compose up -d postgres && sleep 5 && docker compose up -d`

**Verify:** `docker compose ps` shows all services healthy.

---

### Task D3: Smoke test inside container

**Action:**
1. `docker compose exec orchestrator node -e "console.log('node works')"`
2. `docker compose exec orchestrator npx tsc --noEmit` (or skip if we already built)
3. Verify env injection: `docker compose exec orchestrator env | grep UPWORK`

---

## Phase E: Documentation

### Task E1: Update migration docs

**Files:**
- `docs/migration/phase3-status.md` → append Phase 4 section
- `docs/migration/phase4-status.md` → new doc for Phase 4 + Docker

**Sections:**
- What Phase 4 completed
- Docker artifacts created
- What is NOT coupled to OpenClaw
- How OpenClaw integrates: narrow API surface only

---

## Execution Order

1. [A1] Wire packages/* imports → typecheck
2. [A2] Migrate ProposalDraft → typecheck  
3. [A3] Fix native module build
4. [A4] Full typecheck pass
5. [B1] Typecheck smoke
6. [B2] Add smoke tests for contracts/policies
7. [C1] Dockerfile for orchestrator
8. [C2] Agent Dockerfiles
9. [C3] docker-compose.yml
10. [C4] .dockerignore + .env.example
11. [D1] Build images
12. [D2] Start stack + health
13. [D3] Smoke test
14. [E1] Update docs + commit
