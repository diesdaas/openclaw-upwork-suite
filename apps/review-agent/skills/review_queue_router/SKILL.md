# review_queue_router

## Goal
Load pending internal drafts and classify them for review.

## Rules
- identify whether the draft is a proposal or client reply
- detect whether it is new, revised, or escalated
- route to review_decider
- keep classification short and explicit

## Output
- item_type
- status
- priority
- next_step