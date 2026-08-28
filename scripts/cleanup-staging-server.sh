#!/usr/bin/env bash
# staging ECS 垃圾清理：部署残留、过期备份、可选 Docker 悬空资源。
# 不删运行中的 admin/dist、craft 内容、数据库卷。
#
# 用法（SSH 登录 ECS 后）：
#   cd /opt/shuyuan
#   bash scripts/cleanup-staging-server.sh
#
# 环境变量：
#   DEPLOY_BACKUP_KEEP=5   各 _deploy_backup 子目录保留最近 N 份（与 update 脚本一致）
#   DOCKER_PRUNE=1         额外执行 docker system prune -f（不含 -a，不删未使用的镜像层以外的命名镜像）
#   DRY_RUN=1              只打印将删除的内容，不执行

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

KEEP="${DEPLOY_BACKUP_KEEP:-5}"
DRY="${DRY_RUN:-0}"

run() {
  if [ "$DRY" = "1" ]; then
    echo "[dry-run] $*"
  else
    echo "+ $*"
    eval "$@"
  fi
}

prune_timestamped_backups() {
  local parent="$1" keep="$2"
  [ -d "$parent" ] || return 0
  mapfile -t dirs < <(find "$parent" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort)
  local total="${#dirs[@]}"
  if [ "$total" -le "$keep" ]; then
    echo "  备份 $parent：${total} 份，保留 ${keep}，无需清理"
    return 0
  fi
  local i remove=$((total - keep))
  for ((i = 0; i < remove; i++)); do
    run "rm -rf $(printf '%q' "${dirs[$i]}")"
    echo "  已删旧备份: ${dirs[$i]}"
  done
}

echo "=== cleanup-staging-server @ $ROOT ==="
echo "DEPLOY_BACKUP_KEEP=$KEEP  DRY_RUN=$DRY  DOCKER_PRUNE=${DOCKER_PRUNE:-0}"
echo ""
echo "--- 磁盘（清理前）---"
df -h / /opt 2>/dev/null || df -h /
echo ""

echo "=== 1. admin 部署残留（dist.staging / dist.old）==="
ADMIN_DIST="/opt/shuyuan/admin/dist"
for leftover in "${ADMIN_DIST}.staging" "${ADMIN_DIST}.old"; do
  if [ -d "$leftover" ]; then
    if [ -f "$ADMIN_DIST/index.html" ]; then
      run "rm -rf $(printf '%q' "$leftover")"
      echo "  已删: $leftover"
    else
      echo "  跳过 $leftover：正式 dist 不可用，请人工检查" >&2
    fi
  else
    echo "  无: $leftover"
  fi
done

echo ""
echo "=== 2. 过期部署备份 _deploy_backup/*（保留最近 ${KEEP} 份）==="
for sub in exhibits_content exhibits_code backend; do
  echo "  → _deploy_backup/$sub"
  prune_timestamped_backups "_deploy_backup/$sub" "$KEEP"
done

echo ""
echo "=== 3. exhibits 公网目录下的历史遗留备份 ==="
for legacy in exhibits/_code_backup exhibits/_content_backup; do
  if [ -e "$legacy" ]; then
    run "rm -rf $(printf '%q' "$legacy")"
    echo "  已删: $legacy"
  fi
done

echo ""
echo "=== 4. 临时/缓存（安全项）==="
for tmp in /tmp/shuyuan-* /tmp/admin-dist-*; do
  if [ -e "$tmp" ]; then
    run "rm -rf $(printf '%q' "$tmp")"
  fi
done
if [ -d "admin/node_modules/.vite" ]; then
  run "rm -rf admin/node_modules/.vite"
  echo "  已删: admin/node_modules/.vite"
fi

if [ "${DOCKER_PRUNE:-0}" = "1" ]; then
  echo ""
  echo "=== 5. Docker 悬空资源（DOCKER_PRUNE=1）==="
  if command -v docker >/dev/null 2>&1; then
    run "docker system prune -f"
  else
    echo "  未安装 docker，跳过"
  fi
else
  echo ""
  echo "=== 5. Docker ==="
  echo "  跳过（设 DOCKER_PRUNE=1 可清理悬空层/停止容器网络）"
fi

echo ""
echo "--- 磁盘（清理后）---"
df -h / /opt 2>/dev/null || df -h /
echo ""
echo "完成。若要归档 miniapp/docs 等非运行目录，另跑: bash scripts/slim-staging-server.sh"
