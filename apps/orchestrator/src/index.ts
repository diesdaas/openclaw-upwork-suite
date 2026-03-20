import { Store } from "./db/store";
import { startPolling, runPollingCycle } from "./scheduler/poller";
import { notifyNewPendingJobs } from "./review/notifier";
import { runDraftWorker } from "./workers/draft_worker";

async function cycle() {
  const store = new Store("data/state.sqlite");
  store.init();

  const tokenState = store.getState<{ accessToken: string }>("upwork_tokens");
  const tenantState = store.getState<{ tenantId: string }>("upwork_tenant");

  const accessToken = tokenState?.accessToken || process.env.UPWORK_ACCESS_TOKEN!;
  const tenantId = tenantState?.tenantId || process.env.UPWORK_TENANT_ID!;

  await runPollingCycle(accessToken, tenantId);
  await notifyNewPendingJobs();
  await runDraftWorker();
}

async function main() {
  await cycle();

  const store = new Store("data/state.sqlite");
  const tokenState = store.getState<{ accessToken: string }>("upwork_tokens");
  const tenantState = store.getState<{ tenantId: string }>("upwork_tenant");

  const accessToken = tokenState?.accessToken || process.env.UPWORK_ACCESS_TOKEN!;
  const tenantId = tenantState?.tenantId || process.env.UPWORK_TENANT_ID!;

  startPolling(accessToken, tenantId);
  console.log("Upwork scout started.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
