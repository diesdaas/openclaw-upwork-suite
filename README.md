# **OpenClaw Upwork Suite v2**

A modular Upwork automation suite for scouting jobs, drafting proposals,
reviewing outbound communication, and orchestrating controlled submission workflows.

> **Status:** Production deployment on VM-1078 via Docker Compose
> **Stack:** TypeScript · pnpm workspaces · Turborepo · better-sqlite3 · node:22-trixie

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
  scout-agent/   # job discovery and normalization
  client-agent/  # client reply drafting
  review-agent/  # review and gating

packages/
  shared-types/  # canonical contracts and domain types
  db/            # shared DB utilities
  policies/       # policy enforcement (safeCheck, disclosure rules)
  upwork-api/    # Upwork API adapter
```

---

## Deployment (VM-1078)

```bash
# Full deploy (pulls latest, builds, starts, auto-commits changes)
./deploy.sh

# Docker Compose only
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f orchestrator
```

**Deployed services:** orchestrator (healthy), postgres, redis

---

## Design Principles

1. **Contracts first** — shared types drive integration, not ad-hoc cross-imports
2. **Orchestration over hidden coupling** — cross-module routing lives in orchestrator only
3. **Review before release** — drafting and sending are always separate steps
4. **Gate before submit** — SubmissionGateRequest is created before `submitProposal` is called
5. **Autonomy within guardrails** — suite runs as its own Docker stack, OpenClaw connects via narrow API

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

- Node.js 22+
- pnpm 10+
- Docker (for containerized stack)

### Setup

```bash
pnpm install
cp apps/orchestrator/.env.example apps/orchestrator/.env
# Fill in credentials in .env
```

### Run locally

```bash
cd apps/orchestrator
pnpm dev
```

---

## Environment Variables

Copy `apps/orchestrator/.env.example` to `apps/orchestrator/.env` and fill in:

```bash
# Upwork
UPWORK_CLIENT_ID=
UPWORK_CLIENT_SECRET=
UPWORK_REDIRECT_URI=
UPWORK_TENANT_ID=
UPWORK_ACCESS_TOKEN=

# Orchestrator
POLL_INTERVAL_MINUTES=30
MAX_JOBS_PER_RUN=25
MIN_CAPABILITY_FIT=0.75
MAX_DELIVERY_RISK=0.35
MIN_PROPOSAL_STRENGTH=0.60
DATABASE_PATH=data/state.sqlite

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Safety
ENABLE_REAL_SUBMISSION=   # set to "true" to enable real Upwork submission
NODE_ENV=development
```

---

## Roadmap

- [x] Contract-driven shared-types package
- [x] Unified DB access via Store class
- [x] Pre-submission gate ordering
- [x] Submission env guard
- [x] Dockerization (VM-1078 production)
- [ ] Integration tests
- [ ] OpenClaw gateway-api surface
- [ ] Real Upwork GraphQL submission implementation

---

## License

MIT
