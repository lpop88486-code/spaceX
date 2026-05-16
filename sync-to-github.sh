#!/bin/bash
set -e

echo "=== Syncing to GitHub ==="

REMOTE_URL="https://${GITHUB_TOKEN}@github.com/lpop88486-code/spaceX.git"
WORK_DIR="$(dirname "$0")"

cd "$WORK_DIR"

# Use a temp directory to create a clean git repo with just the current files
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

echo "Preparing clean snapshot..."

# Copy files using git archive (respects .gitignore, no .git folder)
git archive HEAD | tar -x -C "$TMPDIR"

# Also copy any untracked/unstaged important files not in HEAD
# (the sync-to-github.sh itself may not be committed yet)
cp -f "$WORK_DIR/sync-to-github.sh" "$TMPDIR/sync-to-github.sh" 2>/dev/null || true

cd "$TMPDIR"

git init -q
git checkout -q -b main

git config user.name "SpaceXStarlinkHQ"
git config user.email "managementstarlinkhq@gmail.com"

git add -A

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
git commit -q -m "OrbitFuture platform — ${TIMESTAMP}"

echo "Pushing to GitHub..."
git -c http.postBuffer=524288000 push --force "$REMOTE_URL" main

echo ""
echo "✓ Successfully pushed to lpop88486-code/spaceX on GitHub!"
echo "  View at: https://github.com/lpop88486-code/spaceX"
