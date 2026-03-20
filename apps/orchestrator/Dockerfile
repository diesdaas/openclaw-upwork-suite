FROM node:22

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/orchestrator/package*.json ./apps/orchestrator/
COPY apps/orchestrator/tsconfig.json ./apps/orchestrator/
COPY apps/orchestrator/src ./apps/orchestrator/src
COPY apps/orchestrator/data ./apps/orchestrator/data
COPY apps/orchestrator/entrypoint.sh ./apps/orchestrator/entrypoint.sh
COPY node_modules ./node_modules

RUN chmod +x /app/apps/orchestrator/entrypoint.sh && \
    ln -sf /app/node_modules/.bin/tsx /usr/local/bin/tsx 2>/dev/null || true && \
    mkdir -p /app/node_modules/@openclaw-upwork-suite && \
    ln -sf /app/packages/shared-types /app/node_modules/@openclaw-upwork-suite/shared-types && \
    ln -sf /app/packages/policies /app/node_modules/@openclaw-upwork-suite/policies && \
    ln -sf /app/packages/upwork-api /app/node_modules/@openclaw-upwork-suite/upwork-api && \
    ln -sf /app/packages/db /app/node_modules/@openclaw-upwork-suite/db && \
    ln -sf /app/apps/orchestrator /app/node_modules/@openclaw-upwork-suite/orchestrator && \
    ln -sf /app/apps/scout-agent /app/node_modules/@openclaw-upwork-suite/scout-agent && \
    ln -sf /app/apps/client-agent /app/node_modules/@openclaw-upwork-suite/client-agent && \
    ln -sf /app/apps/review-agent /app/node_modules/@openclaw-upwork-suite/review-agent

WORKDIR /app
ENTRYPOINT ["./apps/orchestrator/entrypoint.sh"]
