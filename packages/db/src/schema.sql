-- Canonical SQLite schema for openclaw-upwork-suite v1alpha1
-- Single source of truth for all DB tables.
-- Source: extracted from upwork-job-scouter/src/db/schema.ts (orchestrator tables)
--         + upwork-job-scouter/src/workers/message_runner.ts (client-thread tables)
--         + upwork-job-scouter/src/workers/review_runner.ts (review-queue tables)

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- === ORCHESTRATOR TABLES ===

CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_fingerprints (
  upwork_job_id TEXT PRIMARY KEY,
  job_hash TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  last_status TEXT NOT NULL CHECK (last_status IN ('new','updated','seen','dismissed','drafted','submitted'))
);

CREATE TABLE IF NOT EXISTS jobs_raw (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  upwork_job_id TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  title TEXT,
  description TEXT,
  raw_json TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_raw_job_id ON jobs_raw(upwork_job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_raw_expires_at ON jobs_raw(expires_at);

CREATE TABLE IF NOT EXISTS assessments (
  upwork_job_id TEXT PRIMARY KEY,
  capability_fit REAL NOT NULL,
  delivery_risk REAL NOT NULL,
  proposal_strength REAL NOT NULL,
  recommended INTEGER NOT NULL,
  reasons_json TEXT NOT NULL,
  matched_capabilities_json TEXT NOT NULL,
  missing_capabilities_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_reviews (
  upwork_job_id TEXT PRIMARY KEY,
  makes_sense INTEGER,
  approved_to_draft INTEGER,
  approved_to_submit INTEGER,
  notes TEXT,
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS proposals (
  upwork_job_id TEXT PRIMARY KEY,
  draft_json TEXT,
  submit_status TEXT NOT NULL CHECK (submit_status IN ('none','drafted','queued','submitted','failed')),
  submitted_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS polling_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  jobs_fetched INTEGER NOT NULL DEFAULT 0,
  jobs_new INTEGER NOT NULL DEFAULT 0,
  jobs_updated INTEGER NOT NULL DEFAULT 0,
  jobs_recommended INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  error TEXT
);

-- === CLIENT-MESSAGING TABLES ===
-- Used by: orchestrator (write+read), client-agent (scoped via createClientMessagingStore)

CREATE TABLE IF NOT EXISTS client_threads (
  thread_id TEXT PRIMARY KEY,
  thread_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS client_reply_drafts (
  thread_id TEXT PRIMARY KEY,
  draft_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS client_thread_summaries (
  thread_id TEXT PRIMARY KEY,
  summary_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS client_escalations (
  thread_id TEXT PRIMARY KEY,
  escalation_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- === REVIEW-QUEUE TABLES ===
-- Used by: orchestrator (write), review-agent (scoped via createReviewQueueStore)

CREATE TABLE IF NOT EXISTS internal_review_queue (
  item_id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('proposal','client_reply','profile_update')),
  source_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','released','blocked')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS internal_review_decisions (
  item_id TEXT PRIMARY KEY,
  decision_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
