#!/bin/bash
set -euo pipefail

REPO_DIR="/home/openclaw/openclaw-upwork-suite"
cd "$REPO_DIR"

log() { echo "[$(date -Iseconds)] $1"; }

log "=== Deploy starting ==="

log "[1/8] Pulling latest..."
git fetch origin
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse origin/master)
if [ "$LOCAL" != "$REMOTE" ]; then
  log "New commits available, pulling..."
  git pull --ff origin master
else
  log "Already up to date."
fi

log "[2/8] Installing dependencies (hoisted linker)..."
rm -rf node_modules apps/*/node_modules packages/*/node_modules
CI=true pnpm install --ignore-scripts

log "[3/8] Creating workspace symlinks for @openclaw-upwork-suite packages..."
mkdir -p node_modules/@openclaw-upwork-suite
for pkg in shared-types policies upwork-api db; do
  ln -sf "../../packages/$pkg" "node_modules/@openclaw-upwork-suite/$pkg"
done
log "Symlinks created."

log "[4/8] Building Docker images..."
docker compose build

log "[5/8] Starting services..."
docker compose up -d

log "[6/8] Checking orchestrator health..."
sleep 15
docker compose ps

if docker compose ps orchestrator | grep -q "Up"; then
  log "Orchestrator is UP."
  docker compose logs --tail=10 orchestrator 2>&1 | grep -v "^time=" || true
else
  log "Orchestrator may have issues:"
  docker compose logs --tail=30 orchestrator 2>&1 | grep -v "^time=" || true
fi

log "[7/8] Auto-committing config changes to GitHub..."
git add \
  docker-compose.yml \
  apps/orchestrator/.env \
  apps/orchestrator/Dockerfile \
  apps/orchestrator/entrypoint.sh \
  apps/orchestrator/tsconfig.json \
  infra/docker/secrets/postgres_password.txt \
  apps/orchestrator/src/ \
  apps/orchestrator/package.json \
  apps/orchestrator/data/ \
  packages/ \
  .npmrc \
  deploy.sh

if git diff --cached --quiet; then
  log "No config changes to commit."
else
  CHANGES=$(git status --porcelain | grep -v "^??" | head -30)
  log "Committing and pushing..."
  git commit -m "vm deploy $(date -Iseconds)

$CHANGES"
  git push origin master && log "Pushed to GitHub." || log "Push failed (check SSH/GitHub auth)."
fi

log "=== Deploy complete: $(date -Iseconds) ==="
