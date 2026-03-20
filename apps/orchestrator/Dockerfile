FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g tsx \
    && groupadd --gid 1001 appuser \
    && useradd --uid 1001 --gid appuser --shell /bin/bash --create-home appuser
WORKDIR /app
COPY node_modules ./node_modules
COPY apps/orchestrator/src ./apps/orchestrator/src
COPY apps/orchestrator/package.json ./apps/orchestrator/
COPY apps/orchestrator/.env.example ./apps/orchestrator/.env
COPY apps/orchestrator/data ./apps/orchestrator/data
COPY packages ./packages
COPY turbo.json ./turbo.json
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
RUN mkdir -p /app/data && chown -R appuser:appuser /app
USER appuser
ENV NODE_ENV=production
CMD ["tsx", "apps/orchestrator/src/index.ts"]
