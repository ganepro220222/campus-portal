#!/usr/bin/env bash
# staging ECS 瘦身：移走 Git 里有、但服务器运行不需要的目录/文件。
# 只「移动」到归档目录，不永久删除。可重复执行（git pull 后又出现的会被再次归档）。
#
# 用法（在 /opt/shuyuan 下）：
#   bash scripts/slim-staging-server.sh
#   SLIM_ARCHIVE=_slim_archive_20260824 bash scripts/slim-staging-server.sh
#
# 勿在本地开发机随意执行（会移动 miniapp/、design/ 等）。

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ARCHIVE="${SLIM_ARCHIVE:-_slim_archive}"
mkdir -p "$ARCHIVE/admin" "$ARCHIVE/exhibits/win_and_tests"

mv_if_exists() {
  local src="$1"
  local dest="$2"
  if [ -e "$src" ]; then
    mkdir -p "$(dirname "$dest")"
    mv "$src" "$dest"
    echo "已归档: $src"
  fi
}

echo "=== slim-staging-server @ $ROOT ==="
echo "归档目录: $ARCHIVE"
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

echo ""
echo "=== 保留项抽查 ==="
for f in .env docker-compose.staging.yml admin/dist/index.html backend/Dockerfile \
  exhibits/studio.html exhibits/player.html exhibits/_server/studio-server.mjs \
  exhibits/craft-001/config.json; do
  if [ -e "$f" ]; then
    echo "OK  $f"
  else
    echo "MISS $f" >&2
  fi
done

echo ""
du -sh "$ARCHIVE" 2>/dev/null || true
echo "完成。"
