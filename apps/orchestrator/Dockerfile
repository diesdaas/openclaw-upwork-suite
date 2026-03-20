FROM node:20 AS runner
WORKDIR /app

RUN groupadd --gid 1001 appuser \
    && useradd --uid 1001 --gid appuser --shell /bin/bash --create-home appuser \
    && mkdir -p /app/data \
    && chown -R appuser:appuser /app

COPY node_modules ./node_modules
COPY packages ./packages
COPY apps/orchestrator/src ./apps/orchestrator/src
COPY apps/orchestrator/node_modules ./apps/orchestrator/node_modules
COPY apps/orchestrator/package.json ./apps/orchestrator/
COPY apps/orchestrator/.env.example ./apps/orchestrator/.env
COPY apps/orchestrator/data ./apps/orchestrator/data
COPY turbo.json ./turbo.json
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

RUN mkdir -p /usr/local/bin && \
    ln -sf /app/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/cli.mjs /usr/local/bin/tsx

USER appuser
ENV NODE_ENV=production
ENV NODE_PATH=/app/apps/orchestrator/node_modules
CMD ["npx", "tsx", "apps/orchestrator/src/index.ts"]
