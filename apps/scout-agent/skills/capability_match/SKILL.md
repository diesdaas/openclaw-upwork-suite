# capability_match

## Goal
Match a job against real current capabilities.

## Rules
- use only active known capabilities
- every positive claim needs evidence
- penalize unclear delivery requirements
- reject jobs with major missing capabilities
- score fit and risk conservatively
- prefer honesty over broad matching

## Output
- recommended: yes/no
- capability_fit
- delivery_risk
- matched_capabilities
- missing_capabilities
- reasons