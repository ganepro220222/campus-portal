#!/usr/bin/env bash
# Mocked tests for staging-backend-health.sh (exited container must fail fast).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

MOCK_BIN="$TMP/bin"
mkdir -p "$MOCK_BIN"
COMPOSE_FILE="$TMP/docker-compose.yml"
touch "$COMPOSE_FILE"

export MOCK_PS_CID="${MOCK_PS_CID:-deadbeef}"
export MOCK_INSPECT_STATUS="${MOCK_INSPECT_STATUS:-exited}"
export MOCK_HEALTH_OK="${MOCK_HEALTH_OK:-0}"
SLEEP_CALLS="$TMP/sleep_calls"
echo 0 >"$SLEEP_CALLS"

cat >"$MOCK_BIN/docker" <<'EOF'
#!/usr/bin/env bash
case "$*" in
  *"compose"*"ps -a"*"backend"*)
    echo "${MOCK_PS_CID}"
    ;;
  *"inspect"*"State.Status"*)
    echo "${MOCK_INSPECT_STATUS}"
    ;;
  *"compose"*"logs"*)
    echo "mock backend logs"
    ;;
  *"image inspect"*)
    exit 1
    ;;
  *)
    echo "unexpected docker: $*" >&2
    exit 99
    ;;
esac
EOF

cat >"$MOCK_BIN/curl" <<'EOF'
#!/usr/bin/env bash
if [ "${MOCK_HEALTH_OK}" = "1" ]; then
  printf '{"code":200,"data":{"status":"UP"}}'
  exit 0
fi
exit 7
EOF

cat >"$MOCK_BIN/sleep" <<EOF
#!/usr/bin/env bash
n=\$(($(cat "$SLEEP_CALLS") + 1))
echo "\$n" >"$SLEEP_CALLS"
exit 0
EOF

chmod +x "$MOCK_BIN/docker" "$MOCK_BIN/curl" "$MOCK_BIN/sleep"
export PATH="$MOCK_BIN:$PATH"

# shellcheck source=staging-backend-health.sh
source "$ROOT/staging-backend-health.sh"

BACKEND_HEALTH_TIMEOUT=120
BACKEND_HEALTH_INTERVAL=3

if wait_backend_health "$COMPOSE_FILE"; then
  echo "FAIL: expected wait_backend_health to fail for exited container" >&2
  exit 1
fi

sleeps="$(cat "$SLEEP_CALLS")"
if [ "$sleeps" -ne 0 ]; then
  echo "FAIL: exited container should fail immediately without sleep (slept ${sleeps}x)" >&2
  exit 1
fi

# ps -a must be used (default ps -q would miss exited containers)
if ! backend_compose_cid "$COMPOSE_FILE" | grep -q deadbeef; then
  echo "FAIL: backend_compose_cid did not return mocked cid" >&2
  exit 1
fi

export MOCK_INSPECT_STATUS=running
export MOCK_HEALTH_OK=1
echo 0 >"$SLEEP_CALLS"

if ! wait_backend_health "$COMPOSE_FILE"; then
  echo "FAIL: expected wait_backend_health to succeed when health UP" >&2
  exit 1
fi

echo "staging-backend-health.test: PASS"
