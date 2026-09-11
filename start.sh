#!/usr/bin/env bash
# Aria - one-command start for macOS / Linux.
# Installs dependencies on first run, then runs the chat API (5070) and UI (5176).
# Use Chrome or Edge for microphone + speech. Press Ctrl+C to stop both.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

if [ ! -d "$ROOT/node_modules" ]; then
  echo "Installing packages..."
  (cd "$ROOT" && npm install)
fi

cleanup() { kill 0 2>/dev/null || true; }
trap cleanup EXIT INT TERM

(cd "$ROOT" && npm run server) &
(cd "$ROOT" && npm run dev) &

sleep 4
URL="http://localhost:5176"
if command -v xdg-open >/dev/null; then xdg-open "$URL" >/dev/null 2>&1 || true
elif command -v open >/dev/null; then open "$URL" || true; fi
echo "Aria: API http://127.0.0.1:5070  UI $URL"
wait
