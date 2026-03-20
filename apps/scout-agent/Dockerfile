FROM node:20-slim AS runner
WORKDIR /app
COPY node_modules ./node_modules
COPY apps/scout-agent ./apps/scout-agent
COPY apps/scout-agent/package.json ./apps/scout-agent/
RUN groupadd --gid 1001 appuser && useradd --uid 1001 --gid appuser --shell /bin/bash --create-home appuser \
    && chown -R appuser:appuser /app
USER appuser
ENV NODE_ENV=production
CMD ["node", "-e", "console.log('upwork-scout-agent ready (no-op stub)')"]
