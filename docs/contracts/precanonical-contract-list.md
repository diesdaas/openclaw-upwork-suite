# Precanonical Contract List

This document defines the stable schemas required to ensure safe data passing between the isolated agent modules.

## 1. ScoutToWriterHandoff
Contains:
- jobId
- job summary
- normalized job description
- matched capabilities
- evidence
- delivery risks
- assumptions
- approval state
- metadata

## 2. ProposalDraft
Contains:
- jobId
- draft version
- cover letter
- first milestone
- assumptions
- quality flags
- createdBy
- timestamps

## 3. ClientThread
Contains:
- threadId
- related job or proposal id
- client identity metadata
- messages
- approved facts
- project status
- disclosure policy level
- timestamps

## 4. ClientReplyDraft
Contains:
- threadId
- reply text
- intent
- unanswered questions
- escalation needed
- confidentiality flags
- createdBy
- timestamps

## 5. ReviewQueueItem
Contains:
- itemId
- itemType
- source module
- source id
- payload reference or embedded payload
- priority
- review status
- createdAt
- updatedAt

## 6. ReviewDecision
Contains:
- itemId
- decision (pass / revise / escalate / block)
- issues
- rationale
- allowed next step
- reviewer
- timestamps

## 7. SubmissionGateRequest
Contains:
- proposal or item id
- approval status
- blocking reasons
- allowed action
- timestamps

## 8. CommonEnvContract
Define canonical env variable names and meanings for:
- database
- Upwork auth
- Upwork tenant/org context
- Telegram
- model/provider config
- feature flags
- run modes

## 9. CommonDbContract
Define canonical table responsibilities and ownership boundaries:
- which module writes what
- which module reads what
- which data is ephemeral
- which data is long-lived
- which fields are authoritative

## 10. PolicyContract
Define shared policy objects for:
- anti-overclaiming
- anti-leak / minimal disclosure
- approval gates
- escalation triggers
- risky phrase checks
