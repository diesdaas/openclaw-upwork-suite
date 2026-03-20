FROM node:20-slim AS runner
WORKDIR /app

COPY build-tools/usr/bin/ /usr/local/bin/
COPY build-tools/usr/lib/ /usr/local/lib/
COPY build-tools/usr/include/ /usr/local/include/
COPY build-tools/lib64/ /lib64/

ENV PATH="/usr/local/bin:${PATH}"
ENV LD_LIBRARY_PATH="/usr/local/lib:/usr/lib/x86_64-linux-gnu:/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH}"

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

RUN npm_config_build_from_source=true npm rebuild better-sqlite3 2>&1 || \
    (npm_config_build_from_source=true npm install 2>&1)

RUN npm install -g tsx 2>/dev/null || true

USER appuser
ENV NODE_ENV=production
CMD ["npx", "tsx", "apps/orchestrator/src/index.ts"]
