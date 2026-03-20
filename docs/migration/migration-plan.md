# Migration Plan

This document outlines the high-level migration plan for integrating the 4 source repositories.

## Phase 0: Scaffold (Complete)
- Created monorepo structure.
- Defined workspace configs (`pnpm-workspace.yaml`, `turbo.json`).
- Drafted placeholder docs.

## Phase 1: Audit (Complete)
- Audited legacy repos.
- Identified duplicate code.
- Mapped out legacy paths to monorepo paths.
- Drafted precanonical contracts.

## Phase 2: Implementation (Pending)
- Initialize package structure.
- Create shared libraries (`@openclaw/contracts`, `@openclaw/upwork-api`, `@openclaw/db`).
- Move the `upwork-job-scouter` orchestrator logic into `apps/orchestrator`.
- Move agent logic into `apps/scout-agent`, `apps/review-agent`, `apps/client-agent`.
- Refactor all apps to use the shared packages.
