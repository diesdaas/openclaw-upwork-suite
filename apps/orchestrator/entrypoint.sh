#!/bin/bash
set -euo pipefail

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

if [ "$(stat -c '%u' "$DATA_DIR")" != "1000" ]; then
  chown -R 1000:1000 "$DATA_DIR" 2>/dev/null || true
fi

exec su node -c "node --import=tsx apps/orchestrator/src/index.ts"
