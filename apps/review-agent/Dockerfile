FROM node:20-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/review-agent/package.json ./apps/review-agent/
RUN npm install --legacy-peer-deps
COPY apps/review-agent ./apps/review-agent
RUN groupadd --gid 1001 appuser && useradd --uid 1001 --gid appuser --shell /bin/bash --create-home appuser \
    && chown -R appuser:appuser /app
USER appuser
ENV NODE_ENV=production
CMD ["node", "-e", "console.log('upwork-review-agent ready (no-op stub)')"]
