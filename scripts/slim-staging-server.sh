#!/usr/bin/env bash
# staging ECS 瘦身：移走 Git 里有、但服务器运行不需要的目录/文件。
# 每次执行写入 _slim_archive/runs/<时间戳>/，只移动、不覆盖历史 run；默认保留最近 5 次 run。
#
# 用法（在 /opt/shuyuan 下）：
#   bash scripts/slim-staging-server.sh
#   SLIM_ARCHIVE=_slim_archive_custom bash scripts/slim-staging-server.sh
#   SLIM_RUNS_KEEP=3 bash scripts/slim-staging-server.sh
#
# 勿在本地开发机随意执行（会移动 miniapp/、design/ 等）。

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SLIM_RUNS_KEEP="${SLIM_RUNS_KEEP:-5}"

resolve_slim_root() {
  local raw="${SLIM_ARCHIVE:-_slim_archive}"
  if [[ -z "$raw" || "$raw" == "." || "$raw" == ".." ]]; then
    echo "SLIM_ARCHIVE 无效: ${raw:-<empty>}" >&2
    exit 1
  fi
  if [[ "$raw" == /* ]]; then
    echo "SLIM_ARCHIVE 必须是相对仓库根的路径: $raw" >&2
    exit 1
  fi
  if [[ "$raw" == *"/.."* || "$raw" == "../"* ]]; then
    echo "SLIM_ARCHIVE 不能含 .. : $raw" >&2
    exit 1
  fi
  local root_resolved slim_resolved
  root_resolved="$(cd "$ROOT" && pwd)"
  mkdir -p "$ROOT/$raw"
  slim_resolved="$(cd "$ROOT/$raw" && pwd)"
  case "$slim_resolved" in
    "$root_resolved"/*) ;;
    *)
      echo "SLIM_ARCHIVE 必须在仓库根内: $raw" >&2
      exit 1
      ;;
  esac
  printf '%s\n' "$slim_resolved"
}

prune_old_slim_runs() {
  local runs_dir="$1"
  local keep="$2"
  local -a runs=()
  [ -d "$runs_dir" ] || return 0
  while IFS= read -r -d '' run; do
    runs+=("$run")
  done < <(find "$runs_dir" -mindepth 1 -maxdepth 1 -type d -print0 | sort -z -r)
  if ((${#runs[@]} <= keep)); then
    return 0
  fi
  local i
  for ((i = keep; i < ${#runs[@]}; i++)); do
    echo "清理旧归档 run（保留最近 ${keep} 次）: ${runs[$i]}"
    rm -rf "${runs[$i]}"
  done
}

SLIM_ROOT="$(resolve_slim_root)"
# 秒级时间戳在 CI 连续两次执行时会撞车，追加 PID 保证每次 run 目录唯一
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)-$$"
ARCHIVE="${SLIM_ROOT}/runs/${RUN_ID}"
while [ -e "$ARCHIVE" ]; do
  RUN_ID="${RUN_ID}-dup"
  ARCHIVE="${SLIM_ROOT}/runs/${RUN_ID}"
done
mkdir -p "$ARCHIVE/admin" "$ARCHIVE/exhibits/win_and_tests"

mv_if_exists() {
  local src="$1"
  local dest="$2"
  if [ -e "$src" ]; then
    if [ -e "$dest" ]; then
      echo "归档目标已存在（同一 run 内不应重复）: $dest" >&2
      exit 1
    fi
    mkdir -p "$(dirname "$dest")"
    mv "$src" "$dest"
    echo "已归档: $src"
  fi
}

echo "=== slim-staging-server @ $ROOT ==="
echo "归档根: $SLIM_ROOT"
echo "本次 run: $ARCHIVE"
echo ""

# 根目录：设计与测试、小程序源码、文档、本地 dev compose
for name in design test miniapp docs; do
  mv_if_exists "$name" "$ARCHIVE/$name"
done
for f in docker-compose.dev.yml CHANGELOG.md README.md package.json; do
  mv_if_exists "$f" "$ARCHIVE/$f"
done

# admin：只保留 dist（dist 在 .gitignore，不会被 git checkout 覆盖）
for item in src public package.json package-lock.json vite.config.ts tsconfig.json tsconfig.node.json index.html .gitignore tsconfig.tsbuildinfo tsconfig.node.tsbuildinfo; do
  mv_if_exists "admin/$item" "$ARCHIVE/admin/$item"
done

# exhibits：开发/测试/Windows 本地工具（保留 craft-*、vendor、player、studio、_server 等）
for d in e2e _runtime deploy-test-server 模型转换 _launch _dev playwright-report test-results node_modules; do
  mv_if_exists "exhibits/$d" "$ARCHIVE/exhibits/$d"
done
while IFS= read -r -d '' bat; do
  mv "$bat" "$ARCHIVE/exhibits/win_and_tests/"
  echo "已归档: $bat"
done < <(find exhibits -maxdepth 1 -name '*.bat' -print0 2>/dev/null || true)
while IFS= read -r -d '' t; do
  mv "$t" "$ARCHIVE/exhibits/win_and_tests/"
  echo "已归档: $t"
done < <(find exhibits -maxdepth 1 \( -name '*.test.mjs' -o -name '*.test.py' \) -print0 2>/dev/null || true)

# exhibits 根目录：Git / npm / 测试配置 / 重复脚本 / 本地说明（公网 /exhibits/ 可读，运行不需要）
mkdir -p "$ARCHIVE/exhibits/root_clutter"
for f in .gitattributes .gitignore .studio-instance-id \
  _normalize_bats.py pack-delivery.py pano_check.py \
  playwright.config.mjs package.json package-lock.json \
  README.md 使用说明.txt; do
  mv_if_exists "exhibits/$f" "$ARCHIVE/exhibits/root_clutter/$(basename "$f")"
done
for d in _staging-editor-pack; do
  mv_if_exists "exhibits/$d" "$ARCHIVE/exhibits/$d"
done

# 迁移前的备份目录：曾经建在 exhibits/ 下，也就是公网托管的目录里，且没有保留策略。
# 现在备份统一写到仓库根的 _deploy_backup/（不对外），这里把历史遗留的清掉。
for legacy in exhibits/_code_backup exhibits/_content_backup; do
  if [ -d "$legacy" ]; then
    mv_if_exists "$legacy" "$ARCHIVE/$(basename "$legacy")"
    echo "已归档历史备份（原先位于公网目录下）: $legacy"
  fi
done

prune_old_slim_runs "${SLIM_ROOT}/runs" "$SLIM_RUNS_KEEP"

echo ""
echo "=== 保留项抽查 ==="
for f in .env docker-compose.staging.yml admin/dist/index.html backend/Dockerfile \
  exhibits/studio.html exhibits/player.html exhibits/_server/studio-server.mjs \
  exhibits/craft-001/config.json exhibits/check-static-deps.mjs; do
  if [ -e "$f" ]; then
    echo "OK  $f"
  else
    echo "MISS $f" >&2
  fi
done

echo ""
du -sh "$ARCHIVE" 2>/dev/null || true
echo "完成。"
