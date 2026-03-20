# Module Boundaries Draft

This document outlines the high-level boundary design for the new `openclaw-upwork-suite` monorepo, keeping our architectural invariants in mind.

## Invariants and Constraints
- **Preserve Agent Boundaries:** Do not collapse agents into a single monolithic identity.
- **Client Manager Minimal Disclosure:** The client manager must not have access to full system data; it can only see explicit client message threads it is assigned to.
- **Human Approval:** Human-in-the-loop steps (Review Manager) must remain strictly decoupled via isolated queues.

## Proposed Modules

### Apps
1. **`apps/orchestrator`** (formerly `upwork-job-scouter` backend)
   - Core system poller and scheduler.
   - Manages global state, the database (`sqlite/postgres`), and coordinates inter-agent messaging via contracts.
2. **`apps/scout-agent`** (formerly `openclaw-upwork-job-scouter`)
   - Job finding and initial proposal drafting.
3. **`apps/review-agent`** (formerly `openclaw-review-manager`)
   - Presents proposals and messages to humans for approval.
4. **`apps/client-agent`** (formerly `openclaw-client-manager`)
   - Handles active client communication post-proposal. Minimal disclosure context only.

### Packages (Shared Libraries)
1. **`packages/contracts`**
   - Precanonical interfaces shared across all agents and the orchestrator (e.g., `ScoutToWriterHandoff`, `ProposalDraft`).
2. **`packages/upwork-api`**
   - Centralized Upwork GraphQL and REST clients to eliminate duplicates.
3. **`packages/db`**
   - Centralized database schema and access logic, strictly gated depending on the consumer (e.g., the client agent will have a reduced scope or operate strictly over IPC/contracts).
