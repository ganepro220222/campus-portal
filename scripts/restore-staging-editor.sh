#!/usr/bin/env bash
# staging ECS：恢复在线编辑器静态页（studio-api / PHP 后端应已存在）
#
# 用法（SSH 登录后）：
#   cd /opt/shuyuan
#   bash scripts/restore-staging-editor.sh
#
# 可选：GIT_REF=origin/main  EXHIBITS=/opt/shuyuan/exhibits

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
EXHIBITS="${EXHIBITS:-$ROOT/exhibits}"
REF="${GIT_REF:-origin/main}"

echo "=== restore-staging-editor @ $ROOT ==="
echo "exhibits: $EXHIBITS"
echo "git ref:  $REF"
echo ""

if [ ! -d .git ]; then
  echo "错误: $ROOT 不是 git 仓库" >&2
  exit 1
fi

git fetch "${REF%%/*}" "${REF#*/}" 2>/dev/null || git fetch origin main

git checkout "$REF" -- \
  exhibits/player.html \
  exhibits/studio.html \
  exhibits/_server/api.php \
  exhibits/_server/studio-identity.mjs \
  exhibits/pano-check.mjs \
  exhibits/pano-check.py \
  exhibits/exhibit-create.mjs \
  exhibits/exhibit_create.py \
  exhibits/_template

PLAYER="$EXHIBITS/player.html"
if [ -f "$PLAYER" ] && ! grep -q '__SAVE_API__' "$PLAYER"; then
  # Nginx 子路径 /exhibits/ 下须用根绝对路径
  sed -i 's|</head>|<script>window.__SAVE_API__="/studio-api/save"</script>\n</head>|' "$PLAYER"
  echo "已注入 __SAVE_API__ → /studio-api/save"
fi

echo ""
echo "=== 文件抽查 ==="
for f in \
  exhibits/player.html \
  exhibits/studio.html \
  exhibits/_server/api.php \
  exhibits/studio-batch.mjs \
  exhibits/leader-geom.js; do
  if [ -e "$f" ]; then echo "OK  $f"; else echo "MISS $f" >&2; fi
done

echo ""
echo "=== HTTP 探测（本机 Nginx）==="
probe() {
  local url="$1"
  local line
  line="$(curl -sI "$url" 2>/dev/null | head -1 || true)"
  printf '%-55s %s\n' "$url" "${line:-curl failed}"
}
probe "http://127.0.0.1/studio-api/list"
probe "http://127.0.0.1/exhibits/studio-api/list"
probe "http://127.0.0.1/exhibits/studio.html"
probe "http://127.0.0.1/exhibits/player.html?ex=craft-001&mode=edit"

echo ""
if curl -sI "http://127.0.0.1/exhibits/studio-api/list" 2>/dev/null | head -1 | grep -q 404; then
  echo "注意: /exhibits/studio-api/ 返回 404。"
  echo "工作台在 /exhibits/studio.html 时会请求相对路径 studio-api/*。"
  echo "请在 Nginx 增加与 /studio-api/ 等价的 location，见 scripts/nginx-exhibits-editor.conf.example"
fi

echo ""
echo "完成。浏览器访问（需 Basic Auth）："
echo "  http://47.109.0.192/exhibits/studio.html"
echo "  http://47.109.0.192/exhibits/player.html?ex=craft-001&mode=edit"
