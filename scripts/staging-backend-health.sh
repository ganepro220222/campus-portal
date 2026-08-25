#!/usr/bin/env bash
# Backend health / rollback helpers for staging deploy.
# Sourced by update-staging-from-github.sh; tested via staging-backend-health.test.sh

: "${BACKEND_ROLLBACK_TAG:=shuyuan-backend-predeploy:staging}"
BACKEND_ROLLBACK_READY="${BACKEND_ROLLBACK_READY:-0}"

backend_compose_cid() {
  local compose_file="$1"
  docker compose -f "$compose_file" ps -a -q backend 2>/dev/null | head -1 || true
}

backend_container_status() {
  local compose_file="$1" cid
  cid="$(backend_compose_cid "$compose_file")"
  if [ -z "$cid" ]; then
    echo "missing"
    return 0
  fi
  docker inspect --format='{{.State.Status}}' "$cid" 2>/dev/null || echo "unknown"
}

# Exit 0 when the container state means health wait should stop immediately.
backend_container_fatal() {
  local compose_file="$1" state
  state="$(backend_container_status "$compose_file")"
  case "$state" in
    missing)
      echo "backend 容器不存在（compose ps -a 无记录）" >&2
      docker compose -f "$compose_file" ps -a backend >&2 || true
      return 0
      ;;
    exited | dead)
      echo "backend 容器已退出 (state=${state})" >&2
      docker compose -f "$compose_file" logs --tail 40 backend >&2 || true
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

verify_backend_health() {
  curl -sf http://127.0.0.1:8080/api/v1/health | python3 -c '
import json, sys
d = json.load(sys.stdin)
assert d.get("code") == 200, d
assert d.get("data", {}).get("status") == "UP", d
'
}

wait_backend_health() {
  local compose_file="${1:-}" timeout interval elapsed restarting_streak max_restarting state
  timeout="${BACKEND_HEALTH_TIMEOUT:-120}"
  interval="${BACKEND_HEALTH_INTERVAL:-3}"
  max_restarting="${BACKEND_RESTART_FATAL:-5}"
  elapsed=0
  restarting_streak=0

  while [ "$elapsed" -lt "$timeout" ]; do
    if [ -n "$compose_file" ]; then
      if backend_container_fatal "$compose_file"; then
        return 1
      fi
      state="$(backend_container_status "$compose_file")"
      case "$state" in
        restarting)
          restarting_streak=$((restarting_streak + 1))
          if [ "$restarting_streak" -ge "$max_restarting" ]; then
            echo "backend 容器持续 restarting（${restarting_streak} 次），停止等待" >&2
            docker compose -f "$compose_file" logs --tail 40 backend >&2 || true
            return 1
          fi
          ;;
        running)
          restarting_streak=0
          ;;
      esac
    fi
    if verify_backend_health; then
      return 0
    fi
    echo "等待 backend ready：${elapsed}/${timeout}s"
    sleep "$interval"
    elapsed=$((elapsed + interval))
  done
  echo "backend health 在 ${timeout}s 内未就绪" >&2
  return 1
}

tag_predeploy_backend_image() {
  local compose_file="$1" cid image state
  BACKEND_ROLLBACK_READY=0
  docker image rm "$BACKEND_ROLLBACK_TAG" 2>/dev/null || true
  cid="$(backend_compose_cid "$compose_file")"
  if [ -z "$cid" ]; then
    echo "无 backend 容器，跳过部署前 image 标记（不使用历史 rollback tag）" >&2
    return 0
  fi
  state="$(backend_container_status "$compose_file")"
  case "$state" in
    running | restarting) ;;
    *)
      echo "backend 容器状态为 ${state}，跳过部署前 image 标记" >&2
      return 0
      ;;
  esac
  image="$(docker inspect --format='{{.Image}}' "$cid")"
  docker tag "$image" "$BACKEND_ROLLBACK_TAG" 2>/dev/null || true
  BACKEND_ROLLBACK_READY=1
  echo "已标记部署前 backend image: $BACKEND_ROLLBACK_TAG"
}

rollback_backend_container() {
  local compose_file="$1" override
  if ! docker image inspect "$BACKEND_ROLLBACK_TAG" >/dev/null 2>&1; then
    echo "无部署前 backend image，无法自动回滚容器" >&2
    return 1
  fi
  override="$(mktemp /tmp/shuyuan-backend-rollback.XXXXXX.yml)"
  printf 'services:\n  backend:\n    image: %s\n' "$BACKEND_ROLLBACK_TAG" > "$override"
  docker compose -f "$compose_file" -f "$override" up -d --no-build backend
  rm -f "$override"
  echo "已用部署前 image 重建 backend 容器"
}

deploy_backend_with_health() {
  local compose_file="$1"
  tag_predeploy_backend_image "$compose_file"
  docker compose -f "$compose_file" up -d --build backend
  echo ""
  echo "=== health ==="
  if wait_backend_health "$compose_file"; then
    curl -s http://127.0.0.1:8080/api/v1/health | python3 -m json.tool | head -12
    return 0
  fi
  echo "backend health 检查失败" >&2
  if [ "${BACKEND_ROLLBACK_READY:-0}" = "1" ] && docker image inspect "$BACKEND_ROLLBACK_TAG" >/dev/null 2>&1; then
    echo "尝试回滚 backend 容器..." >&2
    rollback_backend_container "$compose_file" || true
    if wait_backend_health "$compose_file"; then
      echo "backend 容器已回滚，health 恢复" >&2
    else
      echo "P0: backend 容器回滚后 health 仍失败，请人工检查 docker compose logs backend" >&2
    fi
  elif docker image inspect "$BACKEND_ROLLBACK_TAG" >/dev/null 2>&1; then
    echo "跳过自动回滚：本轮未成功标记部署前 image（避免恢复到更早版本）" >&2
  fi
  return 1
}
