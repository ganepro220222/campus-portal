#!/usr/bin/env bash
# Mocked tests for staging-studio-rollback.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

MOCK_BIN="$TMP/bin"
mkdir -p "$MOCK_BIN"
IS_ACTIVE_RC="$TMP/is_active_rc"
RESTART_CALLS="$TMP/restart_calls"
RESTART_FAIL="$TMP/restart_fail"
echo 0 >"$IS_ACTIVE_RC"
echo 0 >"$RESTART_CALLS"
echo 0 >"$RESTART_FAIL"

cat >"$MOCK_BIN/systemctl" <<EOF
#!/usr/bin/env bash
case "\$1" in
  is-active)
    [ "\$(cat "$IS_ACTIVE_RC")" = "0" ] && exit 0 || exit 3
    ;;
  restart)
    n=\$(( \$(cat "$RESTART_CALLS") + 1 ))
    echo "\$n" >"$RESTART_CALLS"
    [ "\$(cat "$RESTART_FAIL")" = "1" ] && exit 1 || exit 0
    ;;
  status)
    echo "mock studio-server status"
    exit 0
    ;;
  *)
    echo "unexpected systemctl: \$*" >&2
    exit 99
    ;;
esac
EOF

cat >"$MOCK_BIN/journalctl" <<'EOF'
#!/usr/bin/env bash
echo "mock journalctl"
exit 0
EOF

chmod +x "$MOCK_BIN/systemctl" "$MOCK_BIN/journalctl"
export PATH="$MOCK_BIN:$PATH"

# shellcheck source=staging-studio-rollback.sh
source "$ROOT/staging-studio-rollback.sh"

# 1) 更新前 active → 回滚时即使当前 inactive 也要 restart
echo 0 >"$IS_ACTIVE_RC"
record_studio_was_active
[ "$STUDIO_WAS_ACTIVE" = "1" ] || { echo "FAIL: expected STUDIO_WAS_ACTIVE=1"; exit 1; }
echo 1 >"$IS_ACTIVE_RC"
if ! restart_studio_after_rollback; then
  echo "FAIL: restart should succeed when service was active before update"
  exit 1
fi
[ "$(cat "$RESTART_CALLS")" = "1" ] || { echo "FAIL: expected one restart call"; exit 1; }

# 2) 更新前 inactive → 回滚不擅自启动
echo 1 >"$IS_ACTIVE_RC"
echo 0 >"$RESTART_CALLS"
STUDIO_WAS_ACTIVE=0
record_studio_was_active
[ "$STUDIO_WAS_ACTIVE" = "0" ] || { echo "FAIL: expected STUDIO_WAS_ACTIVE=0"; exit 1; }
restart_studio_after_rollback
[ "$(cat "$RESTART_CALLS")" = "0" ] || { echo "FAIL: must not restart when service was inactive"; exit 1; }

# 3) 更新前 active，restart 失败 → 返回非零
echo 0 >"$IS_ACTIVE_RC"
record_studio_was_active
echo 1 >"$RESTART_FAIL"
if restart_studio_after_rollback; then
  echo "FAIL: expected restart failure to propagate"
  exit 1
fi
echo 0 >"$RESTART_FAIL"

echo "staging-studio-rollback.test: PASS"
