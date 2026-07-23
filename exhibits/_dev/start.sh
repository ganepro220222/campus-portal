#!/usr/bin/env bash
# Git Bash / macOS / Linux — Windows 请用 打开工作台.bat
set -e
cd "$(dirname "$0")/.."
PORT="${1:-8199}"
echo "Studio: http://127.0.0.1:$PORT/studio.html"
if command -v node >/dev/null 2>&1; then
  PORT="$PORT" exec node _server/studio-server.mjs
elif [ -x "_runtime/python/python.exe" ]; then
  PORT="$PORT" exec ./_runtime/python/python.exe serve.py "$PORT"
elif command -v python3 >/dev/null 2>&1; then
  PORT="$PORT" exec python3 serve.py "$PORT"
else
  PORT="$PORT" exec python serve.py "$PORT"
fi
