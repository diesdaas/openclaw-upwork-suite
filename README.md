# **Claw your way to a job!**

A modular Upwork automation and client-ops suite for scouting jobs, drafting proposals,
reviewing outbound communication, and orchestrating controlled submission workflows.

> Status: active development — architecture stabilized, dockerization in progress
> Stack: TypeScript · pnpm workspaces · Turborepo · SQLite · Node.js

---

## Overview

The OpenClaw Upwork Suite handles the full Upwork workflow across clearly separated services:

- discover and deduplicate relevant jobs
- assess fit and generate proposals
- review and gate outbound communication
- orchestrate controlled submissions with explicit human approval
- manage client-thread workflows and follow-ups

**Monorepo layout:**

```
apps/
  orchestrator/  # main workflow coordinator — owns routing, transport, submission
  scout-agent/    # job discovery and normalization
  client-agent/   # client reply drafting
  review-agent/   # review and gating

packages/
  shared-types/   # canonical contracts and domain types
  db/            # shared DB utilities
  policies/       # policy enforcement (safeCheck, disclosure rules)
  upwork-api/    # Upwork API adapter
```

---

## Design Principles

1. **Contracts first** — shared types drive integration, not ad-hoc cross-imports
2. **Orchestration over hidden coupling** — cross-module routing lives in orchestrator only
3. **Review before release** — drafting and sending are always separate steps
4. **Gate before submit** — SubmissionGateRequest is created before `submitProposal` is called
5. **OpenClaw is a controller, not the infrastructure runtime** — the suite runs as its own stack

---

## Ownership Boundaries

| Concern | Owner |
|---|---|
| Real Upwork submission | `apps/orchestrator` |
| Telegram / external transport | `apps/orchestrator` |
| Job scouting | `apps/scout-agent` |
| Proposal drafting | `apps/orchestrator` (via draft_worker) |
| Client reply drafting | `apps/client-agent` |
| Review and gating | `apps/review-agent` |
| Submission preparation only | submit_worker (emits SubmissionGateRequest) |

---

## Key Contracts (`packages/shared-types`)

- `ProposalDraft` — `draftId`, `version`, `approvalState`, `qualityFlags`, `createdBy`
- `ClientThread` — `relatedEntityType`, `approvedFacts`, `disclosurePolicyLevel`, `projectStatus`
- `ClientReplyDraft` — `replyText`, `threadId`, `escalationNeeded`
- `SubmissionGateRequest` — pre-submission gate, created before `submitProposal` is called
- `ReviewQueueItem` — `reviewStatus`

---

## Submission Safety

Real Upwork submission is disabled by default.

To enable:
```bash
ENABLE_REAL_SUBMISSION=true
```
Without this flag, `submitProposal` returns `{ queued: false }` and no submission is made.
The `SubmissionGateRequest` will be set to `rejected` accordingly.

Human approval (`humanApproved: true`) is always required regardless of the env flag.

### Policy Enforcement

Content policy runs through `packages/policies`:

- `safeCheckProposal` — blocklist enforcement including hardcoded protected phrases
- `enforceProposalMinLength` — minimum cover letter length
- `sanitizeDisclosure` — term replacement for outbound client replies

These run before any gate or submission attempt.

### Data Model Notes

Two concepts are intentionally kept separate:

- `job_fingerprints` — dedupe / identity (who is this job)
- `job_status` via `submit_status` in proposals — workflow / lifecycle state (what happened to it)

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for containerized stack)

### Setup

```bash
pnpm install
cp apps/orchestrator/.env.example apps/orchestrator/.env
pnpm turbo check    # typecheck all packages
pnpm turbo build    # build all packages
```

### Run orchestrator locally

```bash
cd apps/orchestrator
pnpm dev
```

### Docker

The suite runs as a standalone Docker Compose stack.
OpenClaw is not required to control Docker — it connects via a narrow API surface only.

```bash
docker compose up --build
```

See `infra/docker/` for Dockerfiles and `docker-compose.yml` at the repo root.

### OpenClaw Integration

OpenClaw connects to this suite via a narrow API only.

**Good fit:**
- scoped job triggers
- status reads
- approval inputs

**Not supported:**
- direct docker exec
- docker.sock access
- transport ownership outside orchestrator

---

## Environment Variables

```bash
# apps/orchestrator
DATABASE_PATH=data/state.sqlite
UPWORK_ACCESS_TOKEN=
UPWORK_TENANT_ID=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
ENABLE_REAL_SUBMISSION=   # set to "true" to enable real Upwork submission
NODE_ENV=development
```

---

## Roadmap

- [x] Contract-driven shared-types package
- [x] Unified DB access via Store class
- [x] Pre-submission gate ordering
- [x] Submission env guard
- [x] Dockerization
- [ ] Integration tests
- [ ] OpenClaw gateway-api surface
- [ ] Real Upwork GraphQL submission implementation

---

## License

MIT
