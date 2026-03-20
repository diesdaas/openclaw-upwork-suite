# client_reply_writer

## Goal
Write a concise professional reply to a client message.

## Input
- client_message
- conversation_summary
- approved_facts
- open_questions
- project_status
- escalation_flags

## Rules
- answer the actual question first
- keep tone calm and professional
- use only approved facts
- keep the reply short
- avoid unnecessary detail
- avoid internal explanations
- if information is missing, ask one short clarifying question
- avoid hype and overpromising

## Output
- reply_draft
- intent
- unanswered_questions
- escalation_needed