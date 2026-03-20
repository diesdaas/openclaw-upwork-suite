# Source Mapping

This document describes the intended mapping of code from the legacy source repositories to the new monorepo structure.

## Mapping Definition
| Legacy Repository | Path in Monorepo | Purpose in Monorepo |
| --- | --- | --- |
| `upwork-job-scouter` | `apps/orchestrator` | Core system, pollers, central db |
| `openclaw-upwork-job-scouter` | `apps/scout-agent` | Agent finding jobs and generating initial drafts |
| `openclaw-review-manager` | `apps/review-agent` | Agent managing human-in-the-loop approvals |
| `openclaw-client-manager` | `apps/client-agent` | Agent communicating with clients |
| Shared Upwork Logic | `packages/upwork-api` | Extracted from multiple legacy repos |
| Shared Interfaces | `packages/contracts` | New explicit contract definitions |
| Database Schemas | `packages/db` | Extracted from `upwork-job-scouter` |
