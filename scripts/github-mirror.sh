#!/bin/bash
# GitHub Mirror Script
# Force-pushes the current workspace contents to a GitHub repository.
# Excludes: .git, node_modules, dist, .local, .cache
#
# Configuration (env vars):
#   GITHUB_TOKEN          - Personal access token with repo scope (REQUIRED)
#   GITHUB_MIRROR_REPO    - Target repo in "owner/name" format (default: shanio786/content-planer)
#   GITHUB_MIRROR_BRANCH  - Branch to push to (default: main)
#   GITHUB_MIRROR_DISABLED - Set to "1" to skip mirroring entirely
#
# This script is intentionally non-fatal: any failure logs a warning
# but exits 0 so it never blocks the post-merge pipeline.
#
# Security notes:
# - GITHUB_TOKEN is never embedded in the remote URL or in command args.
#   It is delivered to git via a one-shot GIT_ASKPASS helper that reads
#   the value from this process's environment only.
# - The temp work tree is removed on exit.

set -u

if [ "${GITHUB_MIRROR_DISABLED:-0}" = "1" ]; then
  echo "[github-mirror] Skipped (GITHUB_MIRROR_DISABLED=1)"
  exit 0
fi

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "[github-mirror] Skipped: GITHUB_TOKEN is not set"
  exit 0
fi

REPO="${GITHUB_MIRROR_REPO:-shanio786/content-planer}"
BRANCH="${GITHUB_MIRROR_BRANCH:-main}"
SOURCE_DIR="$(pwd)"
TMP_DIR="$(mktemp -d -t gh-mirror-XXXXXX)"
ASKPASS_FILE="$(mktemp -t gh-mirror-askpass-XXXXXX.sh)"

cleanup() {
  rm -rf "$TMP_DIR" 2>/dev/null || true
  rm -f "$ASKPASS_FILE" 2>/dev/null || true
}
trap cleanup EXIT

# Build a one-shot GIT_ASKPASS helper. Git invokes it with a prompt
# argument like "Username for ..." or "Password for ..."; we return
# "x-access-token" for the username and the token for the password.
# The token is read from the environment at invocation time, never
# baked into the file or the command line.
cat > "$ASKPASS_FILE" <<'ASKPASS_EOF'
#!/bin/bash
case "$1" in
  Username*) printf '%s\n' "x-access-token" ;;
  Password*) printf '%s\n' "$GITHUB_TOKEN" ;;
  *)         printf '%s\n' "$GITHUB_TOKEN" ;;
esac
ASKPASS_EOF
chmod 700 "$ASKPASS_FILE"

echo "[github-mirror] Mirroring workspace -> github.com/${REPO} (branch: ${BRANCH})"

# Copy workspace contents to temp dir, excluding heavy/private directories.
if command -v rsync >/dev/null 2>&1; then
  rsync -a \
    --exclude='.git/' \
    --exclude='node_modules/' \
    --exclude='dist/' \
    --exclude='.local/' \
    --exclude='.cache/' \
    --exclude='.tmp/' \
    --exclude='*.log' \
    "$SOURCE_DIR/" "$TMP_DIR/"
else
  echo "[github-mirror] rsync not found, falling back to tar"
  tar --exclude='./.git' \
      --exclude='./node_modules' \
      --exclude='*/node_modules' \
      --exclude='./dist' \
      --exclude='*/dist' \
      --exclude='./.local' \
      --exclude='./.cache' \
      --exclude='*/.cache' \
      --exclude='./.tmp' \
      --exclude='*.log' \
      -cf - -C "$SOURCE_DIR" . | tar -xf - -C "$TMP_DIR"
fi

cd "$TMP_DIR" || { echo "[github-mirror] ERROR: cannot cd to temp dir"; exit 0; }

# Initialize a fresh repo on the target branch.
git init -q -b "$BRANCH" 2>/dev/null || git init -q
git checkout -q -B "$BRANCH"

git config user.email "mirror@replit.local"
git config user.name "Replit Mirror"

git add -A
if git diff --cached --quiet; then
  echo "[github-mirror] Nothing to commit (empty workspace?)"
  exit 0
fi

if ! git commit -q -m "Mirror snapshot $(date -u +%Y-%m-%dT%H:%M:%SZ)"; then
  echo "[github-mirror] WARN: commit failed"
  exit 0
fi

# Push using credential-helper-based auth: the token never appears in
# the URL, command line, or remote-tracking config.
REMOTE_URL="https://github.com/${REPO}.git"

if GIT_ASKPASS="$ASKPASS_FILE" GIT_TERMINAL_PROMPT=0 \
     git -c credential.helper= push --force --quiet "$REMOTE_URL" "$BRANCH"; then
  echo "[github-mirror] OK: pushed to github.com/${REPO} (${BRANCH})"
else
  echo "[github-mirror] WARN: push failed (token expired? repo missing?)"
fi

exit 0
