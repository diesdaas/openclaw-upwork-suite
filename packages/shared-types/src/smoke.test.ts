import { newProposalDraft } from "@openclaw-upwork-suite/shared-types/contracts/proposalDraft";
import { safeCheckProposal, safeCheckReply, enforceProposalMinLength } from "@openclaw-upwork-suite/policies";
import { createSubmissionGateRequest } from "@openclaw-upwork-suite/shared-types/contracts/submissionGate";
import { sanitizeDisclosure, hasBannedTerms } from "@openclaw-upwork-suite/policies";

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

// --- ProposalDraft factory ---
{
  console.log("\n=== ProposalDraft factory ===");
  const draft = newProposalDraft({
    jobId: "job-123",
    coverLetter: "I can help with your automation setup. I have experience with similar workflows.",
    firstMilestone: "Audit and reproduce the issue.",
    assumptions: ["Client can share repo access."],
    createdBy: "orchestrator",
  });

  assert(draft.draftId.length > 0, "draftId is a UUID");
  assert(draft.version === 1, "version is 1");
  assert(draft.jobId === "job-123", "jobId matches");
  assert(draft.approvalState === "draft", "approvalState starts as 'draft'");
  assert(draft.qualityFlags.length === 0, "qualityFlags is empty array");
  assert(draft.createdBy === "orchestrator", "createdBy is 'orchestrator'");
  assert(draft.createdAt instanceof Date, "createdAt is Date");
  assert(draft.updatedAt instanceof Date, "updatedAt is Date");
  assert(draft.coverLetter.length > 0, "coverLetter is set");
  assert(draft.firstMilestone.length > 0, "firstMilestone is set");
}

// --- SubmissionGateRequest factory ---
{
  console.log("\n=== SubmissionGateRequest factory ===");
  const req = createSubmissionGateRequest("draft-abc", "job-xyz");
  assert(req.id.length > 0, "id is a UUID");
  assert(req.draftId === "draft-abc", "draftId matches");
  assert(req.jobId === "job-xyz", "jobId matches");
  assert(req.approvalStatus === "pending", "approvalStatus is 'pending'");
  assert(req.blockingReasons.length === 0, "blockingReasons is empty");
  assert(req.requestedAt instanceof Date, "requestedAt is Date");
}

// --- safeCheckProposal ---
{
  console.log("\n=== safeCheckProposal ===");
  const clean = safeCheckProposal("I can help with your project setup and workflow automation.");
  assert(clean.allowed === true, "clean text passes");
  assert(clean.blockedPhrases.length === 0, "no blocked phrases");

  const blocked = safeCheckProposal("We built the exact same thing for another client and guarantee results.");
  assert(blocked.allowed === false, "blocked text fails");
  assert(blocked.blockedPhrases.includes("we built the exact same thing"), "detects 'we built the exact same thing'");
  assert(blocked.blockedPhrases.includes("guarantee"), "detects 'guarantee'");
}

// --- safeCheckReply ---
{
  console.log("\n=== safeCheckReply ===");
  const cleanReply = safeCheckReply("Thanks for the details. I will start reviewing the setup.");
  assert(cleanReply.allowed === true, "clean reply passes");

  const blockedReply = safeCheckReply("For a fixed price of $500 I can deliver by the deadline with a guarantee.");
  assert(blockedReply.allowed === false, "blocked reply fails");
  assert(blockedReply.blockedPhrases.includes("fixed price"), "detects 'fixed price'");
  assert(blockedReply.blockedPhrases.includes("deadline"), "detects 'deadline'");
}

// --- enforceProposalMinLength ---
{
  console.log("\n=== enforceProposalMinLength ===");
  assert(enforceProposalMinLength("This is a very long cover letter that is definitely more than eighty characters long and should pass.") === true, "80+ char letter passes");
  assert(enforceProposalMinLength("Too short.") === false, "short letter fails");
  assert(enforceProposalMinLength("") === false, "empty string fails");
}

// --- sanitizeDisclosure ---
{
  console.log("\n=== sanitizeDisclosure ===");
  const result = sanitizeDisclosure("I use openclaw and sub-agents with prompt engineering.");
  assert(!result.includes("openclaw"), "replaces 'openclaw'");
  assert(!result.includes("sub-agent"), "replaces 'sub-agent'");
  assert(!result.includes("prompt"), "replaces 'prompt'");
  assert(result.includes("approach"), "replaces with 'approach'");
}

// --- hasBannedTerms ---
{
  console.log("\n=== hasBannedTerms ===");
  assert(hasBannedTerms("We use automation layers and orchestration.") === true, "banned terms detected");
  assert(hasBannedTerms("I can help with your project setup.") === false, "clean text passes");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
