# safe_send_gate

## Goal
Define whether an approved internal draft may move to external send or final human approval.

## Rules
- never send automatically
- require explicit human approval for proposals
- require explicit human approval for risky client replies
- block anything with leakage, guarantees, pricing commitments, or fixed deadlines
- keep a clean audit trail

## Output
- release_allowed: yes/no
- release_mode
- blockers