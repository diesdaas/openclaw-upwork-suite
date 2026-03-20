// Canonical contract: @openclaw-upwork-suite/shared-types
// TODO: Replace with direct imports once monorepo pnpm workspace is configured

import Database from "better-sqlite3";

type ReviewItemType = "proposal" | "client_reply" | "profile_update";
type ReviewStatus = "pending" | "in_progress" | "completed" | "blocked";
type ReviewDecisionValue = "pass" | "revise" | "escalate" | "block";

type ReviewQueueItem = {
  itemId: string;
  itemType: ReviewItemType;
  sourceModule: string;
  sourceId: string;
  payloadReference?: string;
  embeddedPayload?: Record<string, unknown>;
  priority: "low" | "medium" | "high" | "critical";
  reviewStatus: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
};

type ReviewDecision = {
  itemId: string;
  decision: ReviewDecisionValue;
  issues: string[];
  rationale: string;
  allowedNextStep: string;
  reviewer: string;
  createdAt: Date;
  updatedAt: Date;
};

const DB_FILE = process.env.UPWORK_SCOUT_DB || "data/state.sqlite";

function nowIso() {
  return new Date().toISOString();
}

function db() {
  const conn = new Database(DB_FILE);
  conn.pragma("journal_mode = WAL");
  return conn;
}

function loadPending(limit = 20): ReviewQueueItem[] {
  const conn = db();
  const rows = conn.prepare(`
    SELECT item_id, item_type, source_id, payload_json, created_at, updated_at
    FROM internal_review_queue
    WHERE status = 'pending'
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit) as Array<{
    item_id: string;
    item_type: ReviewItemType;
    source_id: string;
    payload_json: string;
    created_at: string;
    updated_at: string;
  }>;
  conn.close();

  return rows.map(r => ({
    itemId: r.item_id,
    itemType: r.item_type,
    sourceModule: "unknown",
    sourceId: r.source_id,
    embeddedPayload: JSON.parse(r.payload_json),
    priority: "medium" as const,
    reviewStatus: "pending" as ReviewStatus,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  }));
}

function inspect(item: ReviewQueueItem): ReviewDecision {
  const text =
    item.itemType === "proposal"
      ? `${item.embeddedPayload?.coverLetter || ""}\n${item.embeddedPayload?.firstMilestone || ""}`
      : `${item.embeddedPayload?.replyText || item.embeddedPayload?.reply || ""}`;

  const lower = text.toLowerCase();
  const issues: string[] = [];

  const blockedPhrases = [
    "top 1%",
    "guaranteed results",
    "24/7 available",
    "perfect fit",
    "expert in everything",
    "we built the exact same thing"
  ];

  const leakPhrases = [
    "openclaw",
    "sub-agent",
    "sub agent",
    "runner",
    "prompt",
    "toolchain",
    "internal process",
    "orchestration"
  ];

  for (const p of blockedPhrases) {
    if (lower.includes(p)) issues.push(`Hype or unsupported phrase: ${p}`);
  }

  for (const p of leakPhrases) {
    if (lower.includes(p)) issues.push(`Internal-method leakage: ${p}`);
  }

  if (item.itemType === "client_reply") {
    if (lower.includes("fixed price")) issues.push("Fixed-price commitment");
    if (lower.includes("deadline")) issues.push("Deadline commitment");
    if (lower.includes("guarantee")) issues.push("Guarantee language");
    if (text.length > 700) issues.push("Reply is too detailed");
  }

  if (item.itemType === "proposal") {
    if (!item.embeddedPayload?.firstMilestone) issues.push("Missing first milestone");
    if (String(item.embeddedPayload?.coverLetter || "").length < 160) issues.push("Proposal too short");
  }

  if (issues.length === 0) {
    return {
      itemId: item.itemId,
      decision: "pass",
      issues: [],
      rationale: "Draft is concise, credible, and safe.",
      allowedNextStep: item.itemType === "proposal" ? "human_proposal_review" : "human_reply_review",
      reviewer: "review-runner",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const severe = issues.some(i =>
    i.includes("Internal-method leakage") ||
    i.includes("Fixed-price") ||
    i.includes("Deadline commitment") ||
    i.includes("Guarantee")
  );

  return {
    itemId: item.itemId,
    decision: severe ? "escalate" : "revise",
    issues,
    rationale: severe
      ? "Draft contains risky content and needs escalation."
      : "Draft needs revision before approval.",
    allowedNextStep: severe ? "human_escalation_review" : "rewrite_and_review",
    reviewer: "review-runner",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function saveDecision(itemId: string, decision: ReviewDecision) {
  const conn = db();
  conn.prepare(`
    INSERT INTO internal_review_decisions (item_id, decision_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(item_id) DO UPDATE SET
      decision_json = excluded.decision_json,
      updated_at = excluded.updated_at
  `).run(itemId, JSON.stringify(decision), nowIso());

  conn.prepare(`
    UPDATE internal_review_queue
    SET status = ?, updated_at = ?
    WHERE item_id = ?
  `).run(
    decision.decision === "pass" ? "released" : "blocked",
    nowIso(),
    itemId
  );

  conn.close();
}

export async function runReviewRunner(limit = 20) {
  const items = loadPending(limit);

  for (const item of items) {
    const decision = inspect(item);
    saveDecision(item.itemId, decision);
  }

  return { processed: items.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runReviewRunner()
    .then(result => {
      console.log(JSON.stringify(result));
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
