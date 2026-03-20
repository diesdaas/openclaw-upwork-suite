import fs from "node:fs/promises";
import cron from "node-cron";
import { Store } from "../db/store";
import { config } from "../config";
import { upworkGraphQL } from "../upwork/graphql";
import { MARKETPLACE_JOB_SEARCH_QUERY } from "../upwork/queries";
import { matchJobToCapabilities } from "../tools/capability_match_openclaw";
import { buildApprovalPrompt } from "../tools/approval_prompt";
import type { Capability, JobDetail } from "../types";

type MarketplaceJobEdge = {
  node: {
    id: string;
    title: string;
    description?: string;
    createdDateTime?: string;
    url?: string;
  };
};

type SearchResponse = {
  marketplaceJobPostingsSearch?: {
    edges?: MarketplaceJobEdge[];
  };
};

async function loadCapabilities(): Promise<Capability[]> {
  return JSON.parse(await fs.readFile("data/capabilities.json", "utf8"));
}

async function loadProfiles(): Promise<Array<{ id: string; name: string; query: string }>> {
  return JSON.parse(await fs.readFile("data/search_profiles.json", "utf8"));
}

function toJob(node: MarketplaceJobEdge["node"]): JobDetail {
  return {
    id: node.id,
    title: node.title,
    description: node.description || "",
    skills: [],
    postedAt: node.createdDateTime,
    url: node.url
  };
}

export async function runPollingCycle(accessToken: string, tenantId: string) {
  const store = new Store("data/state.sqlite");
  store.init();

  const runId = store.beginRun();
  let jobsFetched = 0, jobsNew = 0, jobsUpdated = 0, jobsRecommended = 0;

  try {
    const capabilities = await loadCapabilities();
    const profiles = await loadProfiles();

    for (const profile of profiles) {
      const data = await upworkGraphQL<SearchResponse>(
        MARKETPLACE_JOB_SEARCH_QUERY,
        { query: profile.query, first: config.polling.maxJobsPerRun },
        accessToken,
        tenantId
      );

      const edges = data.marketplaceJobPostingsSearch?.edges ?? [];

      for (const edge of edges) {
        jobsFetched++;
        const job = toJob(edge.node);
        const state = store.seenState(job);
        store.upsertRawJob(job);

        if (state === "seen") {
          store.upsertFingerprint(job, "seen");
          continue;
        }

        if (state === "new") jobsNew++;
        if (state === "updated") jobsUpdated++;

        const match = matchJobToCapabilities(job, capabilities);
        store.saveAssessment(match);
        store.upsertFingerprint(job, state);

        if (match.recommended) {
          jobsRecommended++;
          const card = buildApprovalPrompt(job, match);
          console.log("\n[JOB REVIEW]\n" + card.message + "\n");
        }
      }
    }

    store.cleanupExpiredRawJobs();
    store.finishRun(runId, { jobsFetched, jobsNew, jobsUpdated, jobsRecommended, status: "ok", error: null });
  } catch (error) {
    store.finishRun(runId, {
      jobsFetched, jobsNew, jobsUpdated, jobsRecommended,
      status: "failed",
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

export function startPolling(accessToken: string, tenantId: string) {
  cron.schedule("*/30 * * * *", async () => {
    try {
      await runPollingCycle(accessToken, tenantId);
    } catch (err) {
      console.error("Polling failed:", err);
    }
  });
}
