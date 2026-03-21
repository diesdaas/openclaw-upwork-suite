# Migration Plan

High-level migration plan for integrating the 4 source repositories into a unified monorepo.

## Phase 0: Scaffold (Complete)
- Created monorepo structure with pnpm workspaces.
- Defined workspace configs (`pnpm-workspace.yaml`, `turbo.json`).
- Drafted placeholder docs and contracts.

## Phase 1: Audit (Complete)
- Audited legacy repos.
- Identified duplicate code and cross-repo dependencies.
- Mapped out legacy paths to monorepo paths.
- Drafted precanonical contracts for shared types.

## Phase 2: Contracts & Packages (Complete)
- Created `packages/shared-types` with canonical contracts.
- Created `packages/upwork-api` with GraphQL client.
- Created `packages/db` with SQLite schema and Store class.
- Created `packages/policies` with safeCheck and disclosure rules.
- Wired all packages into orchestrator via `@openclaw-upwork-suite/*` workspace protocol.

## Phase 3: Code Migration (Complete)
- Moved all source code from 4 legacy repos into monorepo structure.
- TypeScript compilation verified across all packages and apps.
- All Phase 2 contracts and policies wired and functional.

## Phase 4: Dockerization (Complete)
- Orchestrator Docker image on `node:22-trixie` with glibc compatibility.
- Agent Docker images (minimal stubs).
- Docker Compose stack with postgres, redis, orchestrator.
- Deployed and running on VM-1078.

## Phase 5: Integration (In Progress)
- Real Upwork credentials configuration.
- End-to-end smoke testing with live API.
- OpenClaw gateway-api surface for narrow integration.

## Phase 6: Production Hardening (Pending)
- Integration tests.
- Monitoring and alerting.
- Credential rotation and secrets management.
- CI/CD pipeline for automated builds.
