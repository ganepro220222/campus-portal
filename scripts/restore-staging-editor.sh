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
MISS=0

echo "=== restore-staging-editor @ $ROOT ==="
echo "exhibits: $EXHIBITS"
echo "git ref:  $REF"
echo ""

if [ ! -d .git ]; then
  echo "错误: $ROOT 不是 git 仓库" >&2
  exit 1
fi

git fetch "${REF%%/*}" "${REF#*/}" 2>/dev/null || git fetch origin main

mapfile -t EXHIBITS_PATHS < <(node scripts/collect-staging-editor-files.mjs --repo)
if [ "${#EXHIBITS_PATHS[@]}" -eq 0 ]; then
  echo "错误: collect-staging-editor-files.mjs 未输出路径" >&2
  exit 1
fi
existing=()
for p in "${EXHIBITS_PATHS[@]}"; do
  if git cat-file -e "$REF:$p" 2>/dev/null; then
    existing+=("$p")
  else
    echo "跳过（Git 中无此路径，保留服务器本地文件）: $p"
  fi
done
if [ "${#existing[@]}" -eq 0 ]; then
  echo "错误: collector 清单在 Git 中没有任何可检出路径" >&2
  exit 1
fi
git checkout "$REF" -- "${existing[@]}"

PLAYER="$EXHIBITS/player.html"
if [ -f "$PLAYER" ]; then
  bash "$ROOT/scripts/staging-save-api.sh" "$PLAYER"
fi

echo ""
echo "=== 文件抽查 ==="
for f in \
  exhibits/player.html \
  exhibits/studio.html \
  exhibits/_server/api.php \
  exhibits/pano-check.mjs \
  exhibits/studio-static-path.mjs \
  exhibits/exhibit-create.mjs \
  exhibits/studio-batch.mjs \
  exhibits/leader-geom.js; do
  if [ -e "$f" ]; then
    echo "OK  $f"
  else
    echo "MISS $f" >&2
    MISS=1
  fi
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

if [ "$MISS" -ne 0 ]; then
  echo "文件抽查有缺失项" >&2
  exit 1
fi
