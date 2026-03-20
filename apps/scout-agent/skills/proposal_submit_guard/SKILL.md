# proposal_submit_guard

## Goal
Block unsafe or premature submission.

## Rules
- require explicit user approval
- check that a draft exists
- check for overclaiming
- check for banned phrases
- stop if any check fails

## Output
- approved_to_submit: yes/no
- blocking_reason if no