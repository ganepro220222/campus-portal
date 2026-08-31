#!/usr/bin/env bash
# 把 ECS 上展品的模型/海报/音频/共享背景同步到 OSS（不传播放器代码）。
# 在 ECS：
#   bash scripts/sync-exhibits-assets-to-oss.sh --dry-run
#   bash scripts/sync-exhibits-assets-to-oss.sh
set -euo pipefail

ROOT="${EXHIBITS_ROOT:-/opt/shuyuan/exhibits}"
ENV_FILE="${ENV_FILE:-/opt/shuyuan/.env}"
PREFIX="${OSS_KEY_PREFIX:-exhibits}"
ENDPOINT="${OSS_SYNC_ENDPOINT:-oss-cn-chengdu-internal.aliyuncs.com}"
DRY=0
[ "${1:-}" = "--dry-run" ] && DRY=1

if [ ! -f "$ENV_FILE" ]; then
  echo "缺少 $ENV_FILE" >&2
  exit 1
fi
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

: "${OSS_BUCKET:?OSS_BUCKET 未设置}"
: "${OSS_ACCESS_KEY:?OSS_ACCESS_KEY 未设置}"
: "${OSS_SECRET_KEY:?OSS_SECRET_KEY 未设置}"

OSSUTIL="$(command -v ossutil64 || command -v ossutil || true)"
if [ -z "$OSSUTIL" ]; then
  echo "未找到 ossutil。安装（只需一次）：" >&2
  echo "  curl -fsSL https://gosspublic.alicdn.com/ossutil/install.sh | bash" >&2
  exit 1
fi

sync_dir() {
  local local_dir="$1" key="$2"
  if [ ! -d "$local_dir" ]; then
    echo "跳过（无目录） $local_dir"
    return 0
  fi
  echo "→ oss://${OSS_BUCKET}/${key}/  <=  $local_dir"
  if [ "$DRY" -eq 1 ]; then
    return 0
  fi
  "$OSSUTIL" sync "$local_dir" "oss://${OSS_BUCKET}/${key}" \
    -e "$ENDPOINT" -i "$OSS_ACCESS_KEY" -k "$OSS_SECRET_KEY" \
    --update
}

echo "=== sync exhibits assets → oss://${OSS_BUCKET}/${PREFIX} (${ENDPOINT}) ==="
count=0
for d in "$ROOT"/craft-*; do
  [ -d "$d" ] || continue
  name="$(basename "$d")"
  sync_dir "$d/assets" "${PREFIX}/${name}/assets"
  count=$((count + 1))
done
if [ -d "$ROOT/共享背景" ]; then
  sync_dir "$ROOT/共享背景" "${PREFIX}/共享背景"
else
  echo "提示: 无 ${ROOT}/共享背景"
fi
echo "展品目录 ${count} 个。$([ "$DRY" -eq 1 ] && echo '（dry-run，未上传）')"
