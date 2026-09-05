#!/usr/bin/env bash
# helper 参数门禁（不要求 root；成功 chown 路径见 integration）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HELPER="$ROOT/scripts/chown-exhibit-content-dir.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

chmod +x "$HELPER"
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

# 未以 root 运行时，合法目标应在校验通过后因非 root 失败（不得先 chown）
set +e
OUT="$(run_helper --root "$EX" --name craft-001 --uid 1000 --gid 1000 2>&1)"
EC=$?
set -e
[ "$EC" -ne 0 ] || fail "non-root helper must not succeed"
echo "$OUT" | grep -q '必须以 root 运行' || fail "non-root helper must say 必须以 root 运行"

echo "chown-exhibit-content-dir.test: PASS"
