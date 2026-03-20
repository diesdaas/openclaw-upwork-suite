FROM node:20

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/orchestrator/package*.json ./apps/orchestrator/
COPY apps/orchestrator/tsconfig.json ./apps/orchestrator/
COPY apps/orchestrator/src ./apps/orchestrator/src
COPY apps/orchestrator/data ./apps/orchestrator/data
COPY node_modules ./node_modules

RUN pnpm turbo build --filter=@openclaw-upwork-suite/shared-types --filter=@openclaw-upwork-suite/policies --filter=@openclaw-upwork-suite/upwork-api --filter=@openclaw-upwork-suite/db --filter=orchestrator && \
    pnpm --filter=orchestrator rebuild better-sqlite3

RUN ln -sf /app/node_modules/.bin/tsx /usr/local/bin/tsx 2>/dev/null || true

USER node
WORKDIR /app/orchestrator
CMD ["node", "dist/index.js"]
