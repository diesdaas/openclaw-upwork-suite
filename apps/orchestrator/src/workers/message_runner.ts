// Canonical contracts: @openclaw-upwork-suite/shared-types
// Policy: @openclaw-upwork-suite/policies
import { Store } from "../db/store.js";
import type { ClientThread, ClientReplyDraft, ThreadSummary } from "@openclaw-upwork-suite/shared-types";
import type { Escalation } from "@openclaw-upwork-suite/shared-types";
import { sanitizeDisclosure as policySanitize } from "@openclaw-upwork-suite/policies";

function latestClientMessage(thread: ClientThread): string {
  return [...thread.messages].reverse().find(m => m.senderId === "client")?.text || "";
}

function classifyIntent(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("price") || t.includes("budget") || t.includes("cost")) return "pricing";
  if (t.includes("when") || t.includes("deadline") || t.includes("how long")) return "timeline";
  if (t.includes("how exactly") || t.includes("how do you do it") || t.includes("what is your process")) return "method_probe";
  if (t.includes("can you") || t.includes("do you")) return "capability_check";
  if (t.includes("access") || t.includes("login") || t.includes("credentials")) return "access_request";
  return "general_followup";
}

function buildSummary(thread: ClientThread, msg: string): ThreadSummary {
  const confirmedRequirements: string[] = [];
  const missingInformation: string[] = [];
  const blockers: string[] = [];
  const assumptions: string[] = [];
  const nextSteps: string[] = [];

  if (/api|integration|webhook|graphql/i.test(msg)) confirmedRequirements.push("API or integration work");
  if (/browser|automation|workflow|agent/i.test(msg)) confirmedRequirements.push("Workflow or automation work");
  if (/access|credential|repo|login/i.test(msg)) missingInformation.push("Required access details");
  if (/deadline|urgent|asap/i.test(msg)) blockers.push("Timeline expectation needs review");
  if (!thread.approvedFacts?.length) assumptions.push("Reply should stay cautious because approved facts are limited");

  nextSteps.push("Confirm immediate scope");
  nextSteps.push("Clarify required access");
  nextSteps.push("Define the first milestone");

  return { confirmedRequirements, missingInformation, blockers, assumptions, nextSteps };
}

function safeFactLine(thread: ClientThread): string {
  const facts = thread.approvedFacts || [];
  if (!facts.length) {
    return "I would first confirm the current setup and the main constraint before suggesting the next step.";
  }
  return `The relevant fit here is around ${facts.slice(0, 2).join(" and ")}.`;
}

function conciseQuestion(summary: ThreadSummary): string {
  if (summary.missingInformation.length) {
    return `To move forward, please share ${summary.missingInformation[0].toLowerCase()}.`;
  }
  return "To move forward, please share the current setup and the main blocker.";
}

function buildReply(thread: ClientThread, summary: ThreadSummary, intent: string): ClientReplyDraft {
  const msg = latestClientMessage(thread);
  const factLine = safeFactLine(thread);
  let replyText = "";

  if (intent === "pricing") {
    replyText = ["I can give a grounded estimate once the scope and access details are clear.", conciseQuestion(summary)].join(" ");
  } else if (intent === "timeline") {
    replyText = ["Timeline depends on the current setup and the exact blocker.", conciseQuestion(summary)].join(" ");
  } else if (intent === "method_probe") {
    replyText = ["I use a structured implementation approach, but the immediate next step is to confirm the setup and constraint.", conciseQuestion(summary)].join(" ");
  } else if (intent === "access_request") {
    replyText = ["Yes, I can review that.", conciseQuestion(summary)].join(" ");
  } else if (intent === "capability_check") {
    replyText = ["Yes, that looks broadly aligned.", factLine, conciseQuestion(summary)].join(" ");
  } else {
    replyText = ["That sounds aligned with the kind of work I can help with.", conciseQuestion(summary)].join(" ");
  }

  replyText = sanitizeAndCheck(replyText, msg);
  const now = new Date();

  const escalationNeeded =
    intent === "pricing" ||
    intent === "timeline" ||
    intent === "method_probe" ||
    /guarantee|fixed price|security compliance|legal|confidential process|internal workflow/i.test(msg);

  return {
    threadId: thread.threadId,
    replyText,
    intent,
    unansweredQuestions: summary.missingInformation,
    escalationNeeded,
    confidentialityFlags: [],
    createdBy: "message-runner",
    createdAt: now,
    updatedAt: now,
  };
}

function sanitizeAndCheck(reply: string, clientMessage: string): string {
  let out = policySanitize(reply);

  if (/how exactly|step by step|what is your process|how do you do it/i.test(clientMessage)) {
    out = "I use a structured approach, but the immediate next step is to confirm the setup and the main constraint. To move forward, please share the current setup and the main blocker.";
  }

  return out.replace(/\s+/g, " ").trim();
}

function buildEscalation(thread: ClientThread, draft: ClientReplyDraft): Escalation {
  const msg = latestClientMessage(thread).toLowerCase();
  const reasons: string[] = [];

  if (draft.intent === "pricing") reasons.push("Pricing discussion");
  if (draft.intent === "timeline") reasons.push("Timeline commitment risk");
  if (draft.intent === "method_probe") reasons.push("Client is probing internal methods");
  if (msg.includes("guarantee")) reasons.push("Guarantee requested");
  if (msg.includes("fixed price")) reasons.push("Fixed-price commitment requested");
  if (msg.includes("security") || msg.includes("compliance")) reasons.push("Security/compliance commitment requested");
  if (/how exactly|step by step|process/i.test(msg)) reasons.push("Detailed process disclosure request");

  return { escalate: reasons.length > 0, reasons };
}

export async function runMessageRunner(limit = 10) {
  const store = new Store("data/state.sqlite");
  store.init();

  const threads = store.loadPendingThreads(limit);

  for (const thread of threads) {
    const msg = latestClientMessage(thread);
    if (!msg) continue;

    const intent = classifyIntent(msg);
    const summary = buildSummary(thread, msg);
    const draft = buildReply(thread, summary, intent);
    const escalation = buildEscalation(thread, draft);

    store.saveThreadSummary(thread.threadId, summary);
    store.saveReplyDraft(draft);
    if (escalation.escalate) store.saveEscalation(thread.threadId, escalation);
  }

  return { processed: threads.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMessageRunner()
    .then(result => {
      console.log(JSON.stringify(result));
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
