# Interface Inventory

Current implicit interfaces discovered during the audit:

- **Job Polling & Fetching**: GraphQL queries returning job listings.
- **Proposal Draft Handoff**: The state transfer from the scout identifying a job to the draft worker generating a proposal.
- **Review Queue Interface**: The structure of a job/proposal sent to Telegram for HITL review.
- **Review Decision Interface**: The structured response from the human (Approve, Reject, or Edit).
- **Client Communication**: Message objects containing thread IDs and content.
- **Shared Storage**: Database models for `jobs`, `proposals`, and `messages`.
