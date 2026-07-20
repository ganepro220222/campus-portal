#!/usr/bin/env bash
# exhibits 本地启动（请在 Git Bash 里运行：bash start.sh）
# Windows 双击请用 start.bat，不要双击本文件。
set -e
cd "$(dirname "$0")"
PORT="${1:-8199}"
echo ""
echo "============================================"
echo "  exhibits local server  port $PORT"
echo "============================================"
echo "  craft-001: http://127.0.0.1:$PORT/craft-001/"
echo "  studio:    http://127.0.0.1:$PORT/studio.html"
echo "  Stop with Ctrl+C"
echo "============================================"
echo ""
if command -v node >/dev/null 2>&1; then
  echo "[start] node _server/studio-server.mjs"
  PORT="$PORT" exec node _server/studio-server.mjs
else
  echo "[start] python serve.py $PORT"
  exec python serve.py "$PORT"
fi
