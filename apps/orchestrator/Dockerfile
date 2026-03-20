FROM node:22-alpine

RUN apk add --no-cache su-exec

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY packages ./packages
COPY apps/orchestrator/package*.json ./apps/orchestrator/
COPY apps/orchestrator/tsconfig.json ./apps/orchestrator/
COPY apps/orchestrator/src ./apps/orchestrator/src
COPY apps/orchestrator/data ./apps/orchestrator/data
COPY apps/orchestrator/entrypoint.sh ./apps/orchestrator/entrypoint.sh
COPY node_modules ./node_modules

RUN chmod +x ./apps/orchestrator/entrypoint.sh

WORKDIR /app
ENTRYPOINT ["./apps/orchestrator/entrypoint.sh"]
