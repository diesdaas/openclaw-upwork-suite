import { ReviewService } from "./review_service";

const review = new ReviewService("data/state.sqlite");
const [command, jobId, ...rest] = process.argv.slice(2);
const notes = rest.join(" ").trim();

if (command === "next") {
  const rows = review.listPending();
  console.log(rows);
  process.exit(0);
}

if (command === "approve-draft" && jobId) {
  review.approveDraft(jobId, notes);
  console.log(`Draft approved for ${jobId}`);
  process.exit(0);
}

if (command === "approve-submit" && jobId) {
  review.approveSubmit(jobId, notes);
  console.log(`Submit approved for ${jobId}`);
  process.exit(0);
}

if ((command === "reject" || command === "dismiss") && jobId) {
  review.reject(jobId, notes);
  console.log(`Dismissed ${jobId}`);
  process.exit(0);
}

console.log("Usage: review next | approve-draft <JOB_ID> | approve-submit <JOB_ID> | reject <JOB_ID>");
process.exit(1);
