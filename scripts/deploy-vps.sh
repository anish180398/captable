#!/usr/bin/env bash
# Run this on the VPS to deploy (pull latest, rebuild, restart).
# Usage: ./scripts/deploy-vps.sh [branch]
# Default branch: main. Run from repo root or set CAPTABLE_REPO_PATH.

set -e

BRANCH="${1:-main}"
REPO_PATH="${CAPTABLE_REPO_PATH:-$(git rev-parse --show-toplevel 2>/dev/null)}"

if [ -z "$REPO_PATH" ] || [ ! -d "$REPO_PATH" ]; then
  echo "Error: Not inside a git repo and CAPTABLE_REPO_PATH not set."
  exit 1
fi

cd "$REPO_PATH"
echo "Deploying from $REPO_PATH (branch: $BRANCH)"
git fetch origin
git reset --hard "origin/$BRANCH"
docker compose build --no-cache
docker compose up -d
docker compose exec -T app pnpm db:migrate 2>/dev/null || true
echo "Deploy finished: $(git rev-parse --short HEAD)"
