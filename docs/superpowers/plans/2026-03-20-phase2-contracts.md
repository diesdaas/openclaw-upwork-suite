# Phase 2: Canonical Contracts and Boundaries

> **For agentic workers:** Execute task-by-task using executing-plans skill.

**Goal:** Define all canonical contracts, schemas, ownership boundaries, policy definitions, and env contracts for the `openclaw-upwork-suite` monorepo. No application logic migration.

**Architecture:** One `packages/` workspace with typed contract sources, plus `docs/contracts/` narrative specs. All TypeScript interfaces versioned `v1alpha1`.

---

## Task 1: packages/shared-types/src/contracts/common.ts

**Purpose:** Core shared types and version constant used by all contracts.
**File:** Create `packages/shared-types/src/contracts/common.ts`
**Artifact:** `SCHEMA_VERSION = "v1alpha1"`, `ToolResult<T>`, `UpworkJob`, `Capability`, `SearchProfile`
**Verify:** `npx tsc --noEmit packages/shared-types/src/contracts/common.ts`

---

## Task 2: packages/shared-types/src/contracts/scoutToWriter.ts

**Purpose:** Scout → Writer handoff contract.
**File:** Create `packages/shared-types/src/contracts/scoutToWriter.ts`
**Artifact:** `ScoutToWriterHandoff` interface per locked spec
**Verify:** `npx tsc --noEmit packages/shared-types/src/contracts/scoutToWriter.ts`

---

## Task 3: packages/shared-types/src/contracts/proposalDraft.ts

**Purpose:** Canonical proposal draft contract with locked fields (draftId, version, approvalState, qualityFlags, createdBy).
**File:** Create `packages/shared-types/src/contracts/proposalDraft.ts`
**Artifact:** `ProposalDraft` interface with all locked required fields
**Verify:** `npx tsc --noEmit packages/shared-types/src/contracts/proposalDraft.ts`

---

## Task 4: packages/shared-types/src/contracts/clientThread.ts

**Purpose:** Canonical client thread contract with locked fields (relatedEntityId, relatedEntityType, approvedFacts, disclosurePolicyLevel, projectStatus).
**File:** Create `packages/shared-types/src/contracts/clientThread.ts`
**Artifact:** `ClientThread`, `ClientMessage`, `ClientReplyDraft` interfaces
**Verify:** `npx tsc --noEmit packages/shared-types/src/contracts/clientThread.ts`

---

## Task 5: packages/shared-types/src/contracts/reviewQueue.ts

**Purpose:** Canonical review queue contract with locked naming (client_reply item type, reviewStatus field).
**File:** Create `packages/shared-types/src/contracts/reviewQueue.ts`
**Artifact:** `ReviewQueueItem`, `ReviewDecision` interfaces
**Verify:** `npx tsc --noEmit packages/shared-types/src/contracts/reviewQueue.ts`

---

## Task 6: packages/shared-types/src/contracts/submissionGate.ts

**Purpose:** Submission gate contract — orchestrator prepares/validates/emits, no direct submit.
**File:** Create `packages/shared-types/src/contracts/submissionGate.ts`
**Artifact:** `SubmissionGateRequest`, `SubmissionResult` interfaces
**Verify:** `npx tsc --noEmit packages/shared-types/src/contracts/submissionGate.ts`

---

## Task 7: packages/policies/src/minimalDisclosure.ts

**Purpose:** Minimal-disclosure policy enforcement for client-facing outputs.
**File:** Create `packages/policies/src/minimalDisclosure.ts`
**Artifact:** `sanitizeDisclosure()`, `BANNED_TERMS` array including locked terms (openclaw, sub-agent, runner, prompt, toolchain, workflow, orchestration, internal process)
**Verify:** `npx tsc --noEmit packages/policies/src/minimalDisclosure.ts`

---

## Task 8: packages/policies/src/antiOverclaiming.ts

**Purpose:** Anti-overclaiming policy — block risky phrases in proposals and replies.
**File:** Create `packages/policies/src/antiOverclaiming.ts`
**Artifact:** `safeCheck()`, `BLOCKED_PROPOSAL_PHRASES` (including "we built the exact same thing"), `BLOCKED_REPLY_PHRASES`
**Verify:** `npx tsc --noEmit packages/policies/src/antiOverclaiming.ts`

---

## Task 9: packages/db/src/contract.ts

**Purpose:** DB responsibility boundaries — table ownership matrix, scoped factory signatures.
**File:** Create `packages/db/src/contract.ts`
**Artifact:** Table ownership table, `createStore()` (orchestrator), `createClientMessagingStore()` (scoped), `createReviewQueueStore()` (scoped)
**Verify:** `npx tsc --noEmit packages/db/src/contract.ts`

---

## Task 10: docs/contracts/ownership-boundaries.md

**Purpose:** Narrative ownership boundaries doc.
**File:** Create `docs/contracts/ownership-boundaries.md`
**Artifact:** App ownership table, producer/consumer per contract, env var ownership matrix
**Verify:** File exists, all 4 apps listed, all 6 contracts mapped
