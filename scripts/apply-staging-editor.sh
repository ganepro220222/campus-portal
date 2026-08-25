#!/usr/bin/env bash
# 在 ECS 上应用已上传的编辑器文件（不访问 GitHub）
# 用法：先把 player.html / studio.html 放到 exhibits/，再：
#   bash scripts/apply-staging-editor.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EX="$ROOT/exhibits"
PLAYER="$EX/player.html"

echo "=== apply-staging-editor @ $ROOT ==="

for f in player.html studio.html; do
  if [ ! -f "$EX/$f" ]; then
    echo "缺少 $EX/$f — 请先用 scp 或 FileBrowser 上传" >&2
    exit 1
  fi
  echo "OK  exhibits/$f"
done

if ! grep -q '__SAVE_API__' "$PLAYER"; then
  sed -i 's|</head>|<script>window.__SAVE_API__="/studio-api/save"</script>\n</head>|' "$PLAYER"
  echo "已注入 __SAVE_API__"
else
  echo "player.html 已有 __SAVE_API__"
fi

probe() {
  local url="$1"
  printf '%-55s ' "$url"
  curl -sI "$url" 2>/dev/null | head -1 || echo "curl failed"
}
echo ""
probe "http://127.0.0.1/exhibits/studio.html"
probe "http://127.0.0.1/exhibits/player.html"
probe "http://127.0.0.1/studio-api/list"
probe "http://127.0.0.1/exhibits/studio-api/list"
echo ""
echo "外网：http://47.109.0.192/exhibits/studio.html"
