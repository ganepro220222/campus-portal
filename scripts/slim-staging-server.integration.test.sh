#!/usr/bin/env bash
# 验证 slim-staging-server 重复执行不会删除上一轮 run 中的独有文件。
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

sandbox="$TMP/repo"
mkdir -p "$sandbox/scripts" "$sandbox/admin/dist" "$sandbox/backend" "$sandbox/exhibits/craft-001"
cp "$REPO_ROOT/scripts/slim-staging-server.sh" "$sandbox/scripts/"
touch "$sandbox/.env" "$sandbox/docker-compose.staging.yml" "$sandbox/admin/dist/index.html"
touch "$sandbox/backend/Dockerfile" "$sandbox/exhibits/studio.html" "$sandbox/exhibits/player.html"
mkdir -p "$sandbox/exhibits/_server" "$sandbox/exhibits/craft-001"
touch "$sandbox/exhibits/_server/studio-server.mjs" "$sandbox/exhibits/craft-001/config.json"
touch "$sandbox/exhibits/check-static-deps.mjs"

cd "$sandbox"
mkdir -p miniapp
echo old > miniapp/version

bash scripts/slim-staging-server.sh >/dev/null
run1="$(find _slim_archive/runs -mindepth 1 -maxdepth 1 -type d | sort | head -1)"
[ -n "$run1" ] || { echo "missing first run dir" >&2; exit 1; }
echo local-only > "$run1/miniapp/local-only"

mkdir -p miniapp
echo new > miniapp/version

bash scripts/slim-staging-server.sh >/dev/null

[ -f "$run1/miniapp/local-only" ] || { echo "first run local-only file was deleted" >&2; exit 1; }
run2="$(find _slim_archive/runs -mindepth 1 -maxdepth 1 -type d | sort | tail -1)"
grep -q '^new$' "$run2/miniapp/version" || { echo "second run did not archive new miniapp" >&2; exit 1; }

echo "slim-staging-server.integration.test: PASS"
