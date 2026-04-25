#!/bin/bash
# Post-merge hook. Runs after a task agent's changes are merged into main.
#
# Order of operations:
#   1. pnpm install + db push (required for the app to run correctly).
#   2. GitHub mirror push (independent — runs even if step 1 fails so
#      the GitHub copy stays as fresh as possible).
#
# Each phase is wrapped in its own scope; failures in one do not skip
# the next.

# --- Phase 1: install + schema sync (must succeed for the app) ---
(
  set -e
  pnpm install --frozen-lockfile
  pnpm --filter db push
)
PHASE1_STATUS=$?

# --- Phase 2: mirror to GitHub (always attempted, never fatal) ---
if [ -x "$(dirname "$0")/github-mirror.sh" ]; then
  "$(dirname "$0")/github-mirror.sh" || true
fi

# Surface phase 1 failure to the caller (so the platform retries / alerts),
# but only after the mirror has had its chance to run.
exit $PHASE1_STATUS
