FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/orchestrator/package*.json ./apps/orchestrator/
COPY apps/orchestrator/tsconfig.json ./apps/orchestrator/
COPY apps/orchestrator/src ./apps/orchestrator/src

RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile && \
    pnpm turbo build --filter=@openclaw-upwork-suite/shared-types --filter=@openclaw-upwork-suite/policies --filter=@openclaw-upwork-suite/upwork-api --filter=@openclaw-upwork-suite/db --filter=orchestrator && \
    pnpm --filter=orchestrator rebuild better-sqlite3

RUN mkdir -p /app/state && \
    cp apps/orchestrator/data/*.json /app/state/ 2>/dev/null || true && \
    mkdir -p /app/state/jobs /app/state/logs /app/state/archive /app/state/screening /app/state/snapshots

USER node
WORKDIR /app/orchestrator
CMD ["node", "dist/index.js"]
