export const config = {
  upwork: {
    apiBase: "https://api.upwork.com/graphql",
    tenantId: process.env.UPWORK_TENANT_ID || ""
  },
  polling: {
    intervalMinutes: Number(process.env.POLL_INTERVAL_MINUTES || 30),
    maxJobsPerRun: Number(process.env.MAX_JOBS_PER_RUN || 25)
  },
  gates: {
    minCapabilityFit: Number(process.env.MIN_CAPABILITY_FIT || 0.75),
    maxDeliveryRisk: Number(process.env.MAX_DELIVERY_RISK || 0.35),
    minProposalStrength: Number(process.env.MIN_PROPOSAL_STRENGTH || 0.60)
  }
};
