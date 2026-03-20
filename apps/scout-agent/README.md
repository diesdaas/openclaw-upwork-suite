# Upwork Scout for OpenClaw

Upwork Scout is a selective OpenClaw-based job scouting system for finding Upwork jobs that match real current capabilities.

It does not blindly auto-apply.
It searches, matches, asks the human whether a job makes sense, drafts a proposal, and only submits after explicit approval.

## Goal

Find Upwork jobs that our current OpenClaw agents, skills, tools, and infrastructure can actually deliver.

Success means:
- relevant jobs only
- honest capability matching
- human review before draft
- human approval before submit
- concise and believable proposals

Failure means:
- keyword spam
- fake capability claims
- automatic submission without approval
- stale platform data treated as current

## Architecture

This project has two parts:

1. OpenClaw agent layer
- upwork-scout main agent
- skills for search, matching, review, drafting, submit guarding

2. External tooling layer
- Upwork GraphQL adapter
- SQLite state store
- Telegram review adapter
- proposal submit adapter

Reason for this split:
- OpenClaw should orchestrate decisions and writing
- external services should handle polling, storage, and platform glue

## Workflow

1. Poll Upwork for new or changed jobs.
2. Normalize jobs and store short-lived raw data.
3. Match each job against real capabilities.
4. Save assessment.
5. Ask the human: does this job make sense?
6. If approved, create a draft.
7. Save the draft.
8. If explicitly approved again, submit proposal.
9. Verify via readback if needed.

## Human in the loop

This system is intentionally approval-gated.

Before drafting:
- ask whether the job makes sense

Before submitting:
- require explicit approval

Default rule:
No approval means no submission.

## Upwork API notes

This project uses Upwork GraphQL.

Important platform constraints:
- endpoint: https://api.upwork.com/graphql
- OAuth2 required
- X-Upwork-API-TenantId should be set for org context
- GraphQL errors may arrive in the errors array even with HTTP 200
- cached raw Upwork data must not be stored longer than 24 hours
- write operations should use normal user OAuth context, not service accounts

Always validate actual queries and mutations in the Upwork GraphQL Explorer because field availability and permissions may depend on scopes and account context.

## OpenClaw workspace structure

```txt
~/.openclaw/workspace/upwork-scout/
├─ SOUL.md
├─ AGENTS.md
├─ USER.md
├─ MEMORY.md
├─ TOOLS.md
├─ tool-registry.json
├─ profiles/
│  └─ upwork-scout.json
├─ skills/
│  ├─ upwork_search/
│  │  └─ SKILL.md
│  ├─ capability_match/
│  │  └─ SKILL.md
│  ├─ job_review/
│  │  └─ SKILL.md
│  ├─ proposal_writer/
│  │  └─ SKILL.md
│  └─ proposal_submit_guard/
│     └─ SKILL.md
└─ tools/
   ├─ upwork_graphql.ts
   ├─ upwork_store.ts
   ├─ telegram_review.ts
   └─ proposal_submit.ts
```

## Explorer validation

Before enabling real submission:

1. validate companySelector
2. validate proposalMetadata
3. validate vendorProposals
4. validate job search query
5. discover submit mutation
6. test minimal submit mutation
7. verify with readback

Use RUNBOOK.md for this.

## Guardrails

- no submission without explicit user approval
- no fake claims
- no long-term raw data retention beyond policy window
- no service accounts for write operations
- no blind keyword matching
- no hidden autonomous apply loop

## Recommended rollout

Phase 1:
- read-only search
- matching
- Telegram review

Phase 2:
- draft generation
- draft preview
- manual quality review

Phase 3:
- real submit mutation
- readback verification
- controlled production use

## Current status

This repo is designed as a working scaffold.
Some Upwork GraphQL operations may need final field-name adjustment in the Explorer depending on scopes and schema visibility.

The external adapters are real enough to wire up:
- GraphQL HTTP
- SQLite persistence
- Telegram Bot API
- approval-gated submit flow

The two things that still require account-specific validation are:
- exact marketplace job search query
- exact proposal submit mutation

## Principle

This is not an autobid spam bot.

It is a selective OpenClaw-assisted scouting and proposal system designed to find jobs that genuinely match current capabilities and route every risky step through explicit human approval.