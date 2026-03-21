#!/bin/sh
set -e

DATA_DIR="${DATA_DIR:-/app/state}"
mkdir -p "$DATA_DIR"

for f in capabilities.json search_profiles.json; do
  SRC="/app/apps/orchestrator/data/$f"
  DST="$DATA_DIR/$f"
  if [ -f "$SRC" ] && [ ! -f "$DST" ]; then
    cp "$SRC" "$DST"
    echo "Initialized $DST from image"
  fi
done

chown -R node:node /app/state 2>/dev/null || true

exec su node -c "node --import=tsx /app/apps/orchestrator/src/index.ts"
