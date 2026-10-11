#!/usr/bin/env bash
set -o pipefail
cd "$(dirname "$0")/../../../../react-components" || exit 1
if ! out=$(npm run -s typecheck 2>&1); then
  echo "TYPECHECK FAILED"
  echo "$out" | head -40
  exit 1
fi
if ! out=$(npm run -s build 2>&1); then
  echo "BUILD FAILED"
  echo "$out" | tail -40
  exit 1
fi
echo "OK $(echo "$out" | tail -4 | tr -s ' \n' ' ')"
