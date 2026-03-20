FROM node:20 AS runner
WORKDIR /app

RUN groupadd --gid 1001 appuser \
    && useradd --uid 1001 --gid appuser --shell /bin/bash --create-home appuser \
    && mkdir -p /app/data \
    && chown -R appuser:appuser /app

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

RUN npm install -g tsx 2>/dev/null || true

USER appuser
ENV NODE_ENV=production
CMD ["npx", "tsx", "apps/orchestrator/src/index.ts"]
