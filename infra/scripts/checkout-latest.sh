#!/usr/bin/env bash
# Checkout the newest remote/local tip for each app into /tmp/shoofer-src/*
set -euo pipefail
BASE="${SHOOFER_SRC_BASE:-/tmp/shoofer-src}"
mkdir -p "$BASE"

checkout() {
  local name="$1" repo="$2" ref="$3"
  local dest="$BASE/$name"
  echo "==> $name @ $ref"
  git -C "$repo" fetch --all --prune --quiet || true
  git -C "$repo" worktree remove --force "$dest" 2>/dev/null || rm -rf "$dest"
  git -C "$repo" worktree add --detach "$dest" "$ref"
  git -C "$dest" log -1 --oneline
}

checkout ors /Users/sadra/Desktop/repos/MrShoofer-ORS origin/feature/ors-api-v2
checkout org /Users/sadra/Desktop/repos/ORG main
checkout agency "/Users/sadra/Desktop/repos/Shoofer Agencies and Componies panel /MrShoofer-enterprise-selling" origin/main
checkout landing /Users/sadra/Desktop/repos/shoofer-agency-landing origin/editor-mode

echo "Done. Sources under $BASE"
