# upwork_search

## Goal
Find candidate Upwork jobs from the external job search tool.

## Rules
- call the external Upwork search tool
- return only new or changed jobs
- keep summaries short
- do not deeply judge fit here
- pass candidates to capability_match

## Output
For each job return:
- id
- title
- short summary
- url
- next_action