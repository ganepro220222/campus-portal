#!/usr/bin/env bash
# helper 参数门禁。身份断言按当前 uid 分支：root 用 nobody 降权，非 root 直接应失败。
# 不修改仓库里的 helper 文件模式。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HELPER_SRC="$ROOT/scripts/chown-exhibit-content-dir.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

HELPER="$TMP/helper.sh"
cp "$HELPER_SRC" "$HELPER"
chmod 755 "$HELPER"
EX="$TMP/exhibits"
mkdir -p "$EX/craft-001" "$EX/_server"
printf 'code\n' >"$EX/_server/keep.txt"
printf 'html\n' >"$EX/player.html"
ln -s "$EX/craft-001" "$EX/craft-link"

fail() { echo "FAIL: $1" >&2; exit 1; }

run_helper() {
  bash "$HELPER" "$@"
}

if run_helper --root "$EX" --name craft-001 --uid 0 --gid 1000 2>/dev/null; then
  fail "uid 0 must be rejected"
fi
if run_helper --root "$EX" --name craft-001 --uid 1000 --gid 0 2>/dev/null; then
  fail "gid 0 must be rejected"
fi
if run_helper --root "$EX" --name _server --uid 1000 --gid 1000 2>/dev/null; then
  fail "_server must be rejected"
fi
if run_helper --root "$EX" --name player.html --uid 1000 --gid 1000 2>/dev/null; then
  fail "player.html must be rejected"
fi
if run_helper --root "$EX" --name '../craft-001' --uid 1000 --gid 1000 2>/dev/null; then
  fail "path traversal name must be rejected"
fi
if run_helper --root "$EX" --name craft-link --uid 1000 --gid 1000 2>/dev/null; then
  fail "symlink target must be rejected"
fi
if run_helper --root exhibits --name craft-001 --uid 1000 --gid 1000 2>/dev/null; then
  fail "relative --root must be rejected"
fi

PIN="$TMP/pin"
printf '%s\n' "$EX" >"$PIN"
mkdir -p "$TMP/other/craft-001"
if EXHIBITS_CHOWN_PIN="$PIN" run_helper --root "$TMP/other" --name craft-001 --uid 1000 --gid 1000 2>/dev/null; then
  fail "pinned root mismatch must be rejected"
fi

assert_non_root_rejected() {
  local out="$1"
  local ec="$2"
  [ "$ec" -ne 0 ] || fail "non-root helper must not succeed"
  echo "$out" | grep -q '必须以 root 运行' || fail "non-root helper must say 必须以 root 运行"
}

if [ "$(id -u)" -eq 0 ]; then
  chmod 755 "$TMP" "$EX" "$EX/craft-001"
  DROP_USER=""
  if id nobody >/dev/null 2>&1; then
    DROP_USER=nobody
  elif id www-data >/dev/null 2>&1; then
    DROP_USER=www-data
  fi
  [ -n "$DROP_USER" ] || fail "root CI needs a nobody/www-data account to drop privileges"

  set +e
  if command -v runuser >/dev/null 2>&1; then
    OUT="$(runuser -u "$DROP_USER" -- bash "$HELPER" --root "$EX" --name craft-001 --uid 1000 --gid 1000 2>&1)"
    EC=$?
  elif command -v sudo >/dev/null 2>&1; then
    OUT="$(sudo -u "$DROP_USER" -n -- bash "$HELPER" --root "$EX" --name craft-001 --uid 1000 --gid 1000 2>&1)"
    EC=$?
  elif command -v su >/dev/null 2>&1; then
    OUT="$(su "$DROP_USER" -s /bin/bash -c 'bash "$1" --root "$2" --name craft-001 --uid 1000 --gid 1000' -- "$HELPER" "$EX" 2>&1)"
    EC=$?
  else
    set -e
    fail "root CI needs runuser, sudo -u, or su to test non-root helper"
  fi
  set -e
  assert_non_root_rejected "$OUT" "$EC"

  run_helper --root "$EX" --name craft-001 --uid 1000 --gid 1000 || fail "root helper must succeed"
else
  set +e
  OUT="$(run_helper --root "$EX" --name craft-001 --uid 1000 --gid 1000 2>&1)"
  EC=$?
  set -e
  assert_non_root_rejected "$OUT" "$EC"
fi

echo "chown-exhibit-content-dir.test: PASS"
