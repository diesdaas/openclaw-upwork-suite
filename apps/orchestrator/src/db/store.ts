import Database from "better-sqlite3";
import crypto from "node:crypto";
import { schemaSql } from "./schema";
import type { JobDetail } from "../types";
import type {
  MatchResult,
  ProposalDraft,
  ApprovalDecision,
  ClientReplyDraft,
  ThreadSummary,
  Escalation,
} from "@openclaw-upwork-suite/shared-types";

export class Store {
  private db: Database.Database;

  constructor(filename = "data/state.sqlite") {
    this.db = new Database(filename);
    this.db.pragma("journal_mode = WAL");
  }

  init() {
    this.db.exec(schemaSql);
  }

  nowIso() {
    return new Date().toISOString();
  }

  hashJob(job: Pick<JobDetail, "title" | "description" | "skills" | "budgetUsd" | "hourlyMin" | "hourlyMax">) {
    return crypto.createHash("sha256").update(JSON.stringify(job)).digest("hex");
  }

  beginRun() {
    const info = this.db.prepare(
      `INSERT INTO polling_runs (started_at, status) VALUES (?, 'running')`
    ).run(this.nowIso());
    return Number(info.lastInsertRowid);
  }

  finishRun(id: number, patch: { jobsFetched: number; jobsNew: number; jobsUpdated: number; jobsRecommended: number; status?: string; error?: string | null }) {
    this.db.prepare(`
      UPDATE polling_runs
      SET finished_at = ?, jobs_fetched = ?, jobs_new = ?, jobs_updated = ?, jobs_recommended = ?, status = ?, error = ?
      WHERE id = ?
    `).run(
      this.nowIso(),
      patch.jobsFetched,
      patch.jobsNew,
      patch.jobsUpdated,
      patch.jobsRecommended,
      patch.status ?? "ok",
      patch.error ?? null,
      id
    );
  }

  upsertRawJob(job: JobDetail) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    this.db.prepare(`
      INSERT INTO jobs_raw (upwork_job_id, fetched_at, title, description, raw_json, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(job.id, this.nowIso(), job.title, job.description, JSON.stringify(job), expiresAt);
  }

  seenState(job: JobDetail): "new" | "updated" | "seen" {
    const hash = this.hashJob(job);
    const row = this.db.prepare(`SELECT job_hash FROM job_fingerprints WHERE upwork_job_id = ?`).get(job.id) as { job_hash?: string } | undefined;
    if (!row) return "new";
    if (row.job_hash !== hash) return "updated";
    return "seen";
  }

  upsertFingerprint(job: JobDetail, status: "new" | "updated" | "seen" | "dismissed" | "drafted" | "submitted") {
    const hash = this.hashJob(job);
    const now = this.nowIso();
    this.db.prepare(`
      INSERT INTO job_fingerprints (upwork_job_id, job_hash, first_seen_at, last_seen_at, last_status)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(upwork_job_id) DO UPDATE SET
        job_hash = excluded.job_hash,
        last_seen_at = excluded.last_seen_at,
        last_status = excluded.last_status
    `).run(job.id, hash, now, now, status);
  }

  updateFingerprintStatus(jobId: string, status: "new" | "updated" | "seen" | "dismissed" | "drafted" | "submitted") {
    this.db.prepare(`
      UPDATE job_fingerprints SET last_status = ?, last_seen_at = ? WHERE upwork_job_id = ?
    `).run(status, this.nowIso(), jobId);
  }

  saveAssessment(match: MatchResult) {
    this.db.prepare(`
      INSERT INTO assessments (
        upwork_job_id, capability_fit, delivery_risk, proposal_strength,
        recommended, reasons_json, matched_capabilities_json, missing_capabilities_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(upwork_job_id) DO UPDATE SET
        capability_fit = excluded.capability_fit,
        delivery_risk = excluded.delivery_risk,
        proposal_strength = excluded.proposal_strength,
        recommended = excluded.recommended,
        reasons_json = excluded.reasons_json,
        matched_capabilities_json = excluded.matched_capabilities_json,
        missing_capabilities_json = excluded.missing_capabilities_json,
        updated_at = excluded.updated_at
    `).run(
      match.jobId,
      match.capabilityFit,
      match.deliveryRisk,
      match.proposalStrength,
      match.recommended ? 1 : 0,
      JSON.stringify(match.reasons),
      JSON.stringify(match.matchedCapabilities),
      JSON.stringify(match.missingCapabilities),
      this.nowIso()
    );
  }

  saveReview(decision: ApprovalDecision) {
    this.db.prepare(`
      INSERT INTO user_reviews (upwork_job_id, makes_sense, approved_to_draft, approved_to_submit, notes, reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(upwork_job_id) DO UPDATE SET
        makes_sense = excluded.makes_sense,
        approved_to_draft = excluded.approved_to_draft,
        approved_to_submit = excluded.approved_to_submit,
        notes = excluded.notes,
        reviewed_at = excluded.reviewed_at
    `).run(
      decision.jobId,
      decision.makesSense ? 1 : 0,
      decision.approvedToDraft ? 1 : 0,
      decision.approvedToSubmit ? 1 : 0,
      decision.notes ?? null,
      this.nowIso()
    );
  }

  saveDraft(draft: ProposalDraft) {
    this.db.prepare(`
      INSERT INTO proposals (upwork_job_id, draft_json, submit_status, submitted_at, updated_at)
      VALUES (?, ?, 'drafted', NULL, ?)
      ON CONFLICT(upwork_job_id) DO UPDATE SET
        draft_json = excluded.draft_json,
        submit_status = 'drafted',
        updated_at = excluded.updated_at
    `).run(draft.jobId, JSON.stringify(draft), this.nowIso());
  }

  markQueued(jobId: string) {
    this.db.prepare(`
      UPDATE proposals SET submit_status = 'queued', updated_at = ? WHERE upwork_job_id = ?
    `).run(this.nowIso(), jobId);
  }

  markSubmitted(jobId: string) {
    this.db.prepare(`
      UPDATE proposals SET submit_status = 'submitted', submitted_at = ?, updated_at = ? WHERE upwork_job_id = ?
    `).run(this.nowIso(), this.nowIso(), jobId);
  }

  markSubmitFailed(jobId: string, reason: string) {
    this.db.prepare(`
      UPDATE proposals SET submit_status = 'failed', updated_at = ? WHERE upwork_job_id = ?
    `).run(this.nowIso(), jobId);
    this.setState(`submit_error:${jobId}`, { reason, at: this.nowIso() });
  }

  listPendingReviewDetailed() {
    return this.db.prepare(`
      SELECT
        f.upwork_job_id,
        f.last_status,
        a.capability_fit,
        a.delivery_risk,
        a.proposal_strength,
        a.recommended,
        a.reasons_json,
        a.matched_capabilities_json,
        jr.title,
        json_extract(jr.raw_json, '$.url') AS url
      FROM job_fingerprints f
      LEFT JOIN assessments a ON a.upwork_job_id = f.upwork_job_id
      LEFT JOIN user_reviews r ON r.upwork_job_id = f.upwork_job_id
      LEFT JOIN (
        SELECT j1.*
        FROM jobs_raw j1
        INNER JOIN (
          SELECT upwork_job_id, MAX(fetched_at) AS max_fetched_at
          FROM jobs_raw
          GROUP BY upwork_job_id
        ) latest
          ON latest.upwork_job_id = j1.upwork_job_id
         AND latest.max_fetched_at = j1.fetched_at
      ) jr ON jr.upwork_job_id = f.upwork_job_id
      WHERE a.recommended = 1 AND r.upwork_job_id IS NULL
      ORDER BY f.last_seen_at DESC
    `).all() as Array<{
      upwork_job_id: string;
      last_status: string;
      capability_fit: number;
      delivery_risk: number;
      proposal_strength: number;
      recommended: number;
      reasons_json: string;
      matched_capabilities_json: string;
      title: string;
      url: string;
    }>;
  }

  getApprovedDraftJobsDetailed() {
    return this.db.prepare(`
      SELECT
        r.upwork_job_id,
        jr.raw_json,
        json_object(
          'jobId', a.upwork_job_id,
          'capabilityFit', a.capability_fit,
          'deliveryRisk', a.delivery_risk,
          'proposalStrength', a.proposal_strength,
          'reasons', json(a.reasons_json),
          'matchedCapabilities', json(a.matched_capabilities_json),
          'missingCapabilities', json(a.missing_capabilities_json),
          'recommended', CASE WHEN a.recommended = 1 THEN json('true') ELSE json('false') END
        ) AS match_json
      FROM user_reviews r
      JOIN assessments a ON a.upwork_job_id = r.upwork_job_id
      LEFT JOIN (
        SELECT j1.*
        FROM jobs_raw j1
        INNER JOIN (
          SELECT upwork_job_id, MAX(fetched_at) AS max_fetched_at
          FROM jobs_raw
          GROUP BY upwork_job_id
        ) latest
          ON latest.upwork_job_id = j1.upwork_job_id
         AND latest.max_fetched_at = j1.fetched_at
      ) jr ON jr.upwork_job_id = r.upwork_job_id
      LEFT JOIN proposals p ON p.upwork_job_id = r.upwork_job_id
      WHERE r.makes_sense = 1
        AND r.approved_to_draft = 1
        AND jr.raw_json IS NOT NULL
        AND (p.upwork_job_id IS NULL OR p.submit_status = 'none')
    `).all() as Array<{ upwork_job_id: string; raw_json: string; match_json: string }>;
  }

  getApprovedSubmitJobs() {
    return this.db.prepare(`
      SELECT r.upwork_job_id, p.draft_json
      FROM user_reviews r
      JOIN proposals p ON p.upwork_job_id = r.upwork_job_id
      WHERE r.makes_sense = 1
        AND r.approved_to_draft = 1
        AND r.approved_to_submit = 1
        AND p.submit_status = 'drafted'
    `).all() as Array<{ upwork_job_id: string; draft_json: string }>;
  }

  listDraftedNotSubmitted() {
    return this.db.prepare(`
      SELECT upwork_job_id, draft_json, submit_status, updated_at
      FROM proposals
      WHERE submit_status = 'drafted'
      ORDER BY updated_at DESC
    `).all() as Array<{ upwork_job_id: string; draft_json: string; submit_status: string; updated_at: string }>;
  }

  cleanupExpiredRawJobs() {
    return this.db.prepare(`DELETE FROM jobs_raw WHERE expires_at <= ?`).run(this.nowIso());
  }

  setState(key: string, value: unknown) {
    this.db.prepare(`
      INSERT INTO app_state (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, JSON.stringify(value), this.nowIso());
  }

  getState<T = unknown>(key: string): T | null {
    const row = this.db.prepare(`SELECT value FROM app_state WHERE key = ?`).get(key) as { value: string } | undefined;
    return row ? JSON.parse(row.value) as T : null;
  }

  markNotificationSent(jobId: string, kind: "pending_review" | "draft_ready") {
    this.setState(`notify:${kind}:${jobId}`, { sent: true, at: this.nowIso() });
  }

  wasNotificationSent(jobId: string, kind: "pending_review" | "draft_ready") {
    return !!this.getState(`notify:${kind}:${jobId}`);
  }

  listUnnotifiedPendingReview() {
    return this.listPendingReviewDetailed()
      .filter(row => !this.wasNotificationSent(row.upwork_job_id, "pending_review"));
  }

  listUnnotifiedDrafts() {
    return this.listDraftedNotSubmitted()
      .filter(row => !this.wasNotificationSent(row.upwork_job_id, "draft_ready"));
  }

  // --- client messaging (message_runner) ---

  loadPendingThreads(limit = 10) {
    const rows = this.db.prepare(`
      SELECT t.thread_id, t.thread_json
      FROM client_threads t
      LEFT JOIN client_reply_drafts d ON d.thread_id = t.thread_id
      WHERE d.thread_id IS NULL
      ORDER BY t.updated_at DESC
      LIMIT ?
    `).all(limit) as Array<{ thread_id: string; thread_json: string }>;

    return rows.map(r => {
      const parsed = JSON.parse(r.thread_json);
      return { ...parsed, threadId: parsed.threadId || r.thread_id };
    });
  }

  saveReplyDraft(draft: ClientReplyDraft) {
    this.db.prepare(`
      INSERT INTO client_reply_drafts (thread_id, draft_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(thread_id) DO UPDATE SET
        draft_json = excluded.draft_json,
        updated_at = excluded.updated_at
    `).run(draft.threadId, JSON.stringify(draft), this.nowIso());
  }

  saveThreadSummary(threadId: string, summary: ThreadSummary) {
    this.db.prepare(`
      INSERT INTO client_thread_summaries (thread_id, summary_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(thread_id) DO UPDATE SET
        summary_json = excluded.summary_json,
        updated_at = excluded.updated_at
    `).run(threadId, JSON.stringify(summary), this.nowIso());
  }

  saveEscalation(threadId: string, escalation: Escalation) {
    this.db.prepare(`
      INSERT INTO client_escalations (thread_id, escalation_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(thread_id) DO UPDATE SET
        escalation_json = excluded.escalation_json,
        updated_at = excluded.updated_at
    `).run(threadId, JSON.stringify(escalation), this.nowIso());
  }
}
