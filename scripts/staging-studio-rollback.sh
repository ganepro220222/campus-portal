#!/usr/bin/env bash
# studio-server 回滚重启辅助（由 update-staging-from-github.sh source）

STUDIO_WAS_ACTIVE="${STUDIO_WAS_ACTIVE:-0}"

record_studio_was_active() {
  STUDIO_WAS_ACTIVE=0
  command -v systemctl >/dev/null 2>&1 || return 0
  if systemctl is-active --quiet studio-server 2>/dev/null; then
    STUDIO_WAS_ACTIVE=1
  fi
}

restart_studio_after_rollback() {
  [ "${STUDIO_WAS_ACTIVE:-0}" = "1" ] || return 0
  command -v systemctl >/dev/null 2>&1 || return 0
  echo "回滚后重启 studio-server，使其加载回滚代码..." >&2
  systemctl restart studio-server || {
    echo "错误: 旧代码已恢复，但 studio-server 恢复启动失败" >&2
    systemctl status studio-server --no-pager >&2 || true
    journalctl -u studio-server -n 80 --no-pager >&2 || true
    return 1
  }
}
