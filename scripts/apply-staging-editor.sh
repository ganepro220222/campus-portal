#!/usr/bin/env bash
# 在 ECS 上应用已上传的编辑器文件（不访问 GitHub）
# 用法：先把编辑器文件放到 exhibits/，再：
#   bash scripts/apply-staging-editor.sh
#
# staging Nginx 通常把编辑器反代到 /studio/（不是 /exhibits/），可用：
#   STUDIO_HTTP_PREFIX=/studio  bash scripts/apply-staging-editor.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EX="$ROOT/exhibits"
PLAYER="$EX/player.html"
STUDIO_PREFIX="${STUDIO_HTTP_PREFIX:-/studio}"
PUBLIC_HOST="${STUDIO_PUBLIC_HOST:-47.109.0.192}"
PROBE_FAIL=0
STUDIO_OK=0

echo "=== apply-staging-editor @ $ROOT ==="

for f in player.html studio.html; do
  if [ ! -f "$EX/$f" ]; then
    echo "缺少 $EX/$f — 请先用 scp 或 FileBrowser 上传" >&2
    exit 1
  fi
  echo "OK  exhibits/$f"
done

if systemctl is-active --quiet studio-server 2>/dev/null; then
  echo "studio-server 运行中：__SAVE_API__ 由服务响应时注入，跳过磁盘 sed"
else
  bash "$ROOT/scripts/staging-save-api.sh" "$PLAYER"
fi
if grep -q '`n' "$PLAYER" 2>/dev/null; then
  echo "警告: player.html 含损坏注入（旧 push 脚本遗留 \`n），请从本机重新 scp exhibits/player.html" >&2
fi

if command -v node >/dev/null 2>&1; then
  echo ""
  echo "=== 静态依赖校验 ==="
  (cd "$EX" && node check-static-deps.mjs)
else
  echo "警告: 未找到 node，跳过 check-static-deps" >&2
fi

probe() {
  local url="$1"
  local expect_ok="${2:-1}"
  local line code
  line="$(curl -sI "$url" 2>/dev/null | head -1 || true)"
  code="$(echo "$line" | awk '{print $2}')"
  printf '%-55s ' "$url"
  if [ "$expect_ok" = "1" ]; then
    case "$code" in
      200|301|302|401) echo "OK  $line" ;;
      *) echo "FAIL $line"; PROBE_FAIL=1 ;;
    esac
  else
    echo "${line:-curl failed}"
  fi
}

probe_studio() {
  local url="$1"
  local line code
  line="$(curl -sI "$url" 2>/dev/null | head -1 || true)"
  code="$(echo "$line" | awk '{print $2}')"
  printf '%-55s ' "$url"
  case "$code" in
    200|301|302|401) echo "OK  $line"; STUDIO_OK=1 ;;
    *) echo "FAIL $line"; PROBE_FAIL=1 ;;
  esac
}

echo ""
echo "=== HTTP 探测（本机 Nginx，编辑器入口 ${STUDIO_PREFIX}/）==="
probe_studio "http://127.0.0.1${STUDIO_PREFIX}/studio.html"
probe_studio "http://127.0.0.1${STUDIO_PREFIX}/player.html"
probe "http://127.0.0.1/studio-api/list"
echo ""
echo "=== 参考（/exhibits/ 未配置 alias 时 404 属正常）==="
probe "http://127.0.0.1/exhibits/studio.html" 0
probe "http://127.0.0.1/exhibits/studio-api/list" 0

echo ""
if [ "$STUDIO_OK" -eq 0 ]; then
  echo "编辑器 HTTP 探测失败：请确认 studio-server 在跑且 Nginx 已配置 ${STUDIO_PREFIX}/ 反代" >&2
  exit 1
fi
if [ "$PROBE_FAIL" -ne 0 ]; then
  echo "部分探测失败（若 ${STUDIO_PREFIX}/ 已 OK 可忽略 /exhibits/ 404）" >&2
fi

echo "外网：http://${PUBLIC_HOST}${STUDIO_PREFIX}/studio.html"
