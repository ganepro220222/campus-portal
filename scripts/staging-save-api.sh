#!/usr/bin/env bash
# 检测 player.html 是否已注入 SAVE 端点；未注入则写入 STUDIO-SAVE-ENDPOINT 标记块。
# 用法: staging-save-api.sh /path/to/player.html

set -euo pipefail

PLAYER="${1:?player.html path required}"

has_save_api() {
  grep -qE 'window\.__SAVE_API__[[:space:]]*=' "$1" \
    || grep -q 'STUDIO-SAVE-ENDPOINT' "$1"
}

inject_save_api() {
  sed -i 's|</head>|<!-- STUDIO-SAVE-ENDPOINT --><script>window.__SAVE_API__="/studio-api/save"</script>\n</head>|' "$1"
}

if has_save_api "$PLAYER"; then
  echo "player.html 已有 __SAVE_API__ 赋值"
else
  inject_save_api "$PLAYER"
  echo "已注入 __SAVE_API__ → /studio-api/save"
fi
