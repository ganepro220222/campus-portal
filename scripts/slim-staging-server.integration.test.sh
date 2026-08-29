#!/usr/bin/env bash
# 验证 slim-staging-server 重复执行、run 唯一性与 SLIM_RUNS_KEEP 参数校验。
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

setup_sandbox() {
  local dir="$1"
  mkdir -p "$dir/scripts" "$dir/admin/dist" "$dir/backend" "$dir/exhibits/craft-001" "$dir/exhibits/_server"
  cp "$REPO_ROOT/scripts/slim-staging-server.sh" "$dir/scripts/"
  touch "$dir/.env" "$dir/docker-compose.staging.yml" "$dir/admin/dist/index.html"
  touch "$dir/backend/Dockerfile" "$dir/exhibits/studio.html" "$dir/exhibits/player.html"
  touch "$dir/exhibits/_server/studio-server.mjs" "$dir/exhibits/craft-001/config.json"
  touch "$dir/exhibits/check-static-deps.mjs"
}

setup_sandbox_with_sources() {
  local dir="$1"
  setup_sandbox "$dir"
  mkdir -p "$dir/design" "$dir/test" "$dir/miniapp" "$dir/docs"
  echo design > "$dir/design/marker"
  echo test > "$dir/test/marker"
  echo miniapp > "$dir/miniapp/marker"
  echo docs > "$dir/docs/marker"
}

assert_sources_unmoved() {
  [ -d design ] && [ -f design/marker ] || { echo "design was moved unexpectedly" >&2; return 1; }
  [ -d test ] && [ -f test/marker ] || { echo "test was moved unexpectedly" >&2; return 1; }
  [ -d miniapp ] && [ -f miniapp/marker ] || { echo "miniapp was moved unexpectedly" >&2; return 1; }
  [ -d docs ] && [ -f docs/marker ] || { echo "docs was moved unexpectedly" >&2; return 1; }
}

count_runs() {
  find _slim_archive/runs -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' '
}

slim_once() {
  local archive_line
  archive_line="$(bash scripts/slim-staging-server.sh 2>&1 | sed -n 's/^本次 run: //p' | tail -1)"
  [ -n "$archive_line" ] || { echo "missing archive line from slim script" >&2; return 1; }
  printf '%s\n' "$archive_line"
}

# --- 非法 SLIM_RUNS_KEEP 必须在移动前拒绝 ---
for bad in 0 -1 abc 1.5; do
  sb="$TMP/keep-$bad"
  setup_sandbox "$sb"
  cd "$sb"
  mkdir -p miniapp docs
  echo keep-test > miniapp/version
  if SLIM_RUNS_KEEP="$bad" bash scripts/slim-staging-server.sh >/dev/null 2>&1; then
    echo "expected failure for SLIM_RUNS_KEEP=$bad" >&2
    exit 1
  fi
  [ -d miniapp ] || { echo "miniapp moved despite invalid SLIM_RUNS_KEEP=$bad" >&2; exit 1; }
  [ -d docs ] || { echo "docs moved despite invalid SLIM_RUNS_KEEP=$bad" >&2; exit 1; }
done

# --- 非法 SLIM_ARCHIVE 必须在移动前拒绝 ---
for bad in miniapp/_archive docs/archive exhibits/archive admin/src/archive design ../archive; do
  sb="$TMP/archive-$bad"
  setup_sandbox_with_sources "$sb"
  cd "$sb"
  if SLIM_ARCHIVE="$bad" bash scripts/slim-staging-server.sh >/dev/null 2>&1; then
    echo "expected failure for SLIM_ARCHIVE=$bad" >&2
    exit 1
  fi
  assert_sources_unmoved
done
sb="$TMP/archive-abs"
setup_sandbox_with_sources "$sb"
cd "$sb"
if SLIM_ARCHIVE=/tmp/archive bash scripts/slim-staging-server.sh >/dev/null 2>&1; then
  echo "expected failure for SLIM_ARCHIVE=/tmp/archive" >&2
  exit 1
fi
assert_sources_unmoved

# --- 合法 SLIM_ARCHIVE 独立目录名 ---
for good in _slim_archive _slim_archive_custom; do
  sb="$TMP/archive-ok-$good"
  setup_sandbox "$sb"
  cd "$sb"
  mkdir -p miniapp
  echo "good-$good" > miniapp/version
  archive_line="$(SLIM_ARCHIVE="$good" bash scripts/slim-staging-server.sh 2>&1 | sed -n 's/^本次 run: //p' | tail -1)"
  [[ "$archive_line" == *"/$good/runs/"* ]] || {
    echo "SLIM_ARCHIVE=$good did not archive under expected root: $archive_line" >&2
    exit 1
  }
done

# --- 同秒连续两次执行：run 不同，第一轮独有文件保留 ---
sandbox="$TMP/repo-seq"
setup_sandbox "$sandbox"
cd "$sandbox"
mkdir -p miniapp
echo old > miniapp/version

run1="$(slim_once)"
[ "$(count_runs)" = "1" ] || { echo "expected 1 run after first slim, got $(count_runs)" >&2; exit 1; }
echo local-only > "$run1/miniapp/local-only"

mkdir -p miniapp
echo new > miniapp/version

run2="$(slim_once)"
run_count="$(count_runs)"
[ "$run_count" -ge 2 ] || {
  echo "expected >=2 runs after second slim, got $run_count (run1=$run1 run2=$run2)" >&2
  find _slim_archive/runs -mindepth 1 -maxdepth 1 -type d >&2 || true
  exit 1
}
[ "$run1" != "$run2" ] || { echo "sequential runs must use different directories: $run1" >&2; exit 1; }
[ -f "$run1/miniapp/local-only" ] || { echo "first run local-only file was deleted" >&2; exit 1; }
grep -q '^new$' "$run2/miniapp/version" || { echo "second run did not archive new miniapp" >&2; exit 1; }

# --- 不同 sandbox 并发执行：各自生成的 run 目录名应唯一 ---
run_dirs="$TMP/run_dirs.txt"
: > "$run_dirs"
for i in 1 2; do
  (
    sb="$TMP/repo-par-$i"
    setup_sandbox "$sb"
    cd "$sb"
    mkdir -p miniapp
    echo "parallel-$i" > miniapp/version
    bash scripts/slim-staging-server.sh >/dev/null
    find _slim_archive/runs -mindepth 1 -maxdepth 1 -type d
  ) >> "$run_dirs" &
done
wait
unique_count="$(sort -u "$run_dirs" | wc -l | tr -d ' ')"
[ "$unique_count" = "2" ] || { echo "parallel runs must produce two unique run dirs, got $unique_count" >&2; cat "$run_dirs" >&2; exit 1; }

# --- SLIM_RUNS_KEEP=1 只保留最近一次 run ---
sandbox="$TMP/repo-keep1"
setup_sandbox "$sandbox"
cd "$sandbox"
for pass in 1 2 3; do
  mkdir -p miniapp
  echo "keep-$pass" > miniapp/version
  SLIM_RUNS_KEEP=1 bash scripts/slim-staging-server.sh >/dev/null
done
keep_count="$(find _slim_archive/runs -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
[ "$keep_count" = "1" ] || { echo "SLIM_RUNS_KEEP=1 should leave one run, got $keep_count" >&2; exit 1; }
latest="$(find _slim_archive/runs -mindepth 1 -maxdepth 1 -type d | sort | tail -1)"
grep -q '^keep-3$' "$latest/miniapp/version" || { echo "SLIM_RUNS_KEEP=1 did not keep latest run" >&2; exit 1; }

echo "slim-staging-server.integration.test: PASS"
