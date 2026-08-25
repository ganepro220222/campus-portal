#!/usr/bin/env bash
# 在 ECS 上应用已上传的编辑器文件（不访问 GitHub）
# 用法：先把编辑器文件放到 exhibits/，再：
#   bash scripts/apply-staging-editor.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EX="$ROOT/exhibits"
PLAYER="$EX/player.html"
PROBE_FAIL=0

echo "=== apply-staging-editor @ $ROOT ==="

for f in player.html studio.html; do
  if [ ! -f "$EX/$f" ]; then
    echo "缺少 $EX/$f — 请先用 scp 或 FileBrowser 上传" >&2
    exit 1
  fi
  echo "OK  exhibits/$f"
done

bash "$ROOT/scripts/staging-save-api.sh" "$PLAYER"

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

echo ""
echo "=== HTTP 探测（本机 Nginx）==="
probe "http://127.0.0.1/exhibits/studio.html"
probe "http://127.0.0.1/exhibits/player.html"
probe "http://127.0.0.1/studio-api/list"
probe "http://127.0.0.1/exhibits/studio-api/list" 0

echo ""
if [ "$PROBE_FAIL" -ne 0 ]; then
  echo "HTTP 探测有失败项，请检查 Nginx / studio-server" >&2
  exit 1
fi

echo "外网：http://47.109.0.192/exhibits/studio.html"
