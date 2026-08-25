#!/usr/bin/env bash
# 从 Git 恢复 exhibits/craft-*/config.json（覆盖在线编辑内容）。
# 普通代码更新请用 update-staging-from-github.sh，不会动 craft config。
#
# 用法：
#   cd /opt/shuyuan
#   bash scripts/restore-exhibit-content-from-git.sh
#   bash scripts/restore-exhibit-content-from-git.sh craft-001 craft-002

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REF="${GIT_REF:-origin/main}"
REMOTE="${REF%%/*}"
BRANCH="${REF#*/}"

echo "=== restore-exhibit-content-from-git @ $ROOT ==="
echo "git ref: $REF"
echo ""

if [ ! -d .git ]; then
  echo "错误: $ROOT 不是 git 仓库" >&2
  exit 1
fi

git fetch "$REMOTE" "$BRANCH"

paths=()
if [ "$#" -gt 0 ]; then
  for ex in "$@"; do
    paths+=("exhibits/${ex}/config.json")
  done
else
  for cfg in exhibits/craft-*/config.json; do
    [ -f "$cfg" ] || continue
    paths+=("$cfg")
  done
fi

if [ "${#paths[@]}" -eq 0 ]; then
  echo "没有找到可恢复的 craft config" >&2
  exit 1
fi

echo "将 checkout 以下路径（覆盖本地）："
printf '  %s\n' "${paths[@]}"
echo ""
read -r -p "确认覆盖？[y/N] " ans
if [ "$ans" != "y" ] && [ "$ans" != "Y" ]; then
  echo "已取消"
  exit 0
fi

git checkout "$REF" -- "${paths[@]}"
echo "完成。"
