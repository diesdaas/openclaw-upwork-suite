# escalation_gate

## Goal
Detect when a message should be escalated to the human.

## Escalate if
- pricing is discussed
- fixed deadlines are requested
- scope expands materially
- legal/compliance/security promises are requested
- client asks for guarantees
- access or confidentiality risk appears
- the reply would require guessing
- the client asks for detailed methods or internal process explanation

## Output
- escalate: yes/no
- reasons
- safe_reply_if_possible