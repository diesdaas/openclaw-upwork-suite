FROM node:20-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/orchestrator/package.json ./apps/orchestrator/
RUN npm install --legacy-peer-deps

FROM deps AS builder
COPY apps/orchestrator ./apps/orchestrator
RUN npm install --legacy-peer-deps

FROM base AS runner
WORKDIR /app
RUN groupadd --gid 1001 appuser && useradd --uid 1001 --gid appuser --shell /bin/bash --create-home appuser \
    && npm install -g tsx
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/orchestrator/src ./apps/orchestrator/src
COPY --from=builder /app/apps/orchestrator/package.json ./apps/orchestrator/
COPY --from=builder /app/apps/orchestrator/data ./apps/orchestrator/data 2>/dev/null || true
COPY --from=builder /app/apps/orchestrator/.env.example ./apps/orchestrator/.env 2>/dev/null || true
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/turbo.json ./turbo.json
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY --from=deps /app/pnpm-lock.yaml ./
COPY --from=deps /app/package.json ./
RUN mkdir -p /app/data && chown -R appuser:appuser /app
USER appuser
ENV NODE_ENV=production
CMD ["tsx", "apps/orchestrator/src/index.ts"]
