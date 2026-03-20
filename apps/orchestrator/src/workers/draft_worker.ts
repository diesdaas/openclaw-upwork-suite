import fs from "node:fs/promises";
import { Store } from "../db/store";
import { generateProposalDraft } from "../tools/proposal_generate";
import type { Capability, MatchResult } from "@openclaw-upwork-suite/shared-types";
import type { JobDetail } from "../types";

function dataDir() {
  return process.env.DATA_DIR ?? "data";
}

async function loadCapabilities(): Promise<Capability[]> {
  return JSON.parse(await fs.readFile(`${dataDir()}/capabilities.json`, "utf8"));
}

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  return JSON.parse(value) as T;
}

export async function runDraftWorker() {
  const store = new Store();
  store.init();

  const capabilities = await loadCapabilities();
  const jobs = store.getApprovedDraftJobsDetailed();

  for (const row of jobs) {
    const job = parseJson<JobDetail>(row.raw_json);
    const match = parseJson<MatchResult>(row.match_json);
    if (!job || !match) continue;

    const draft = generateProposalDraft(job, match, capabilities);
    store.saveDraft(draft);
    store.updateFingerprintStatus(job.id, "drafted");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDraftWorker().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
