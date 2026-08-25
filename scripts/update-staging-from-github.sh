#!/usr/bin/env bash
# staging ECS：从 GitHub 更新「运行相关」路径，避免整仓 reset 拉回 miniapp/design/test 等。
# exhibits 只 checkout 代码路径，不覆盖 craft-*/config.json 等在线编辑内容。
#
# 用法（SSH 登录 ECS 后）：
#   cd /opt/shuyuan
#   SKIP_DOCKER=1 bash scripts/update-staging-from-github.sh
#
# 环境变量：
#   GIT_REMOTE=origin   GIT_BRANCH=main
#   SKIP_DOCKER=1       只拉代码不重建容器
#   SKIP_SLIM=1         跳过瘦身（一般不要设）
#   DOCKER_COMPOSE_FILE=...  显式指定 compose（推荐 staging 服务器设置）
#
# 若要从 Git 恢复展品 config（覆盖在线编辑），见 scripts/restore-exhibit-content-from-git.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REMOTE="${GIT_REMOTE:-origin}"
BRANCH="${GIT_BRANCH:-main}"
REF="$REMOTE/$BRANCH"
BACKUP=""
CODE_BACKUP=""
CODE_MANIFEST=""
CODE_PATHS=()
BACKEND_BACKUP=""
BACKEND_MANIFEST=""
BACKEND_CHECKED_OUT=0
DOCKER_ATTEMPTED=0
BACKEND_ROLLBACK_TAG="shuyuan-backend-predeploy:staging"
UPDATE_OK=0

backup_craft_configs() {
  BACKUP="exhibits/_content_backup/$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$BACKUP"
  for cfg in exhibits/craft-*/config.json; do
    [ -f "$cfg" ] || continue
    rel="${cfg#exhibits/}"
    mkdir -p "$BACKUP/$(dirname "$rel")"
    cp "$cfg" "$BACKUP/$rel"
  done
  echo "已备份 craft config → $BACKUP"
}

restore_craft_configs() {
  [ -n "$BACKUP" ] || return 0
  for cfg in exhibits/craft-*/config.json; do
    [ -f "$cfg" ] || continue
    rel="${cfg#exhibits/}"
    if [ -f "$BACKUP/$rel" ]; then
      cp "$BACKUP/$rel" "$cfg"
    fi
  done
  echo "已恢复 craft config 自备份"
}

# checkout 后、restore 前：检测 craft config 是否被 git 覆盖
detect_craft_configs_changed_by_checkout() {
  local cfg rel changed=0
  for cfg in exhibits/craft-*/config.json; do
    [ -f "$cfg" ] || continue
    rel="${cfg#exhibits/}"
    [ -f "$BACKUP/$rel" ] || continue
    if ! cmp -s "$cfg" "$BACKUP/$rel"; then
      echo "错误: $cfg 被 checkout 改动（collector 清单可能误含 craft 内容）" >&2
      changed=1
    fi
  done
  if [ "$changed" -ne 0 ]; then
    restore_craft_configs
    exit 1
  fi
}

assert_exhibits_paths_safe() {
  local p
  for p in "$@"; do
    case "$p" in
      exhibits/craft-*|exhibits/craft-*/*)
        echo "错误: collector 清单含展品内容路径: $p" >&2
        exit 1
        ;;
    esac
  done
}

manifest_record() {
  local p="$1"
  [ -n "${CODE_MANIFEST:-}" ] || return 0
  if [ -e "$p" ]; then
    printf '%s\t1\n' "$p" >> "$CODE_MANIFEST"
  else
    printf '%s\t0\n' "$p" >> "$CODE_MANIFEST"
  fi
}

backup_code_paths() {
  local p rel
  CODE_BACKUP="exhibits/_code_backup/$(date +%Y%m%d_%H%M%S)"
  CODE_MANIFEST="$CODE_BACKUP/manifest.tsv"
  mkdir -p "$CODE_BACKUP"
  : > "$CODE_MANIFEST"
  for p in "$@"; do
    manifest_record "$p"
    [ -e "$p" ] || continue
    rel="${p#exhibits/}"
    if [ -d "$p" ]; then
      mkdir -p "$CODE_BACKUP/$(dirname "$rel")"
      rm -rf "$CODE_BACKUP/$rel"
      cp -a "$p" "$CODE_BACKUP/$rel"
    else
      mkdir -p "$CODE_BACKUP/$(dirname "$rel")"
      cp "$p" "$CODE_BACKUP/$rel"
    fi
  done
  echo "已备份 exhibits 代码 → $CODE_BACKUP"
}

backup_path_into_code_backup() {
  local p="$1" rel
  manifest_record "$p"
  [ -e "$p" ] || return 0
  rel="${p#exhibits/}"
  if [ -d "$p" ]; then
    mkdir -p "$CODE_BACKUP/$(dirname "$rel")"
    rm -rf "$CODE_BACKUP/$rel"
    cp -a "$p" "$CODE_BACKUP/$rel"
  else
    mkdir -p "$CODE_BACKUP/$(dirname "$rel")"
    cp "$p" "$CODE_BACKUP/$rel"
  fi
}

restore_code_paths() {
  local p rel existed
  [ -n "$CODE_BACKUP" ] || return 0
  [ -d "$CODE_BACKUP" ] || return 0
  if [ -f "$CODE_MANIFEST" ]; then
    while IFS=$'\t' read -r p existed; do
      [ -n "$p" ] || continue
      if [ "$existed" = "0" ]; then
        if [ -e "$p" ]; then
          rm -rf "$p"
          echo "  删除本轮新增: $p"
        fi
        continue
      fi
      rel="${p#exhibits/}"
      [ -e "$CODE_BACKUP/$rel" ] || continue
      rm -rf "$p"
      if [ -d "$CODE_BACKUP/$rel" ]; then
        mkdir -p "$(dirname "$p")"
        cp -a "$CODE_BACKUP/$rel" "$p"
      else
        mkdir -p "$(dirname "$p")"
        cp "$CODE_BACKUP/$rel" "$p"
      fi
    done < "$CODE_MANIFEST"
  fi
  echo "已恢复 exhibits 代码自备份"
}

backend_manifest_record() {
  local p="$1"
  [ -n "${BACKEND_MANIFEST:-}" ] || return 0
  if [ -e "$p" ]; then
    printf '%s\t1\n' "$p" >> "$BACKEND_MANIFEST"
  else
    printf '%s\t0\n' "$p" >> "$BACKEND_MANIFEST"
  fi
}

backup_backend_paths() {
  local p ref="$1"
  shift
  local paths=("$@")
  BACKEND_BACKUP="_deploy_backup/backend/$(date +%Y%m%d_%H%M%S)"
  BACKEND_MANIFEST="$BACKEND_BACKUP/manifest.tsv"
  mkdir -p "$BACKEND_BACKUP"
  : > "$BACKEND_MANIFEST"
  for p in "${paths[@]}"; do
    if git cat-file -e "$ref:$p" 2>/dev/null; then
      backend_manifest_record "$p"
      if [ -e "$p" ]; then
        if [ -d "$p" ]; then
          mkdir -p "$BACKEND_BACKUP/$(dirname "$p")"
          rm -rf "$BACKEND_BACKUP/$p"
          cp -a "$p" "$BACKEND_BACKUP/$p"
        else
          mkdir -p "$BACKEND_BACKUP/$(dirname "$p")"
          cp "$p" "$BACKEND_BACKUP/$p"
        fi
      fi
    fi
  done
  echo "已备份 backend/sql/compose → $BACKEND_BACKUP"
}

restore_backend_paths() {
  local p existed
  [ -n "$BACKEND_BACKUP" ] || return 0
  [ -d "$BACKEND_BACKUP" ] || return 0
  [ -f "$BACKEND_MANIFEST" ] || return 0
  while IFS=$'\t' read -r p existed; do
    [ -n "$p" ] || continue
    if [ "$existed" = "0" ]; then
      if [ -e "$p" ]; then
        rm -rf "$p"
        echo "  删除本轮新增: $p"
      fi
      continue
    fi
    [ -e "$BACKEND_BACKUP/$p" ] || continue
    rm -rf "$p"
    if [ -d "$BACKEND_BACKUP/$p" ]; then
      mkdir -p "$(dirname "$p")"
      cp -a "$BACKEND_BACKUP/$p" "$p"
    else
      mkdir -p "$(dirname "$p")"
      cp "$BACKEND_BACKUP/$p" "$p"
    fi
  done < "$BACKEND_MANIFEST"
  echo "已恢复 backend/sql/compose 自备份"
}

on_update_err() {
  local ec=$?
  if [ "$UPDATE_OK" -eq 1 ]; then
    exit "$ec"
  fi
  echo "更新失败 (exit $ec)，回滚 craft config 与 exhibits 代码..." >&2
  restore_craft_configs || true
  restore_code_paths || true
  if [ "$BACKEND_CHECKED_OUT" -eq 1 ]; then
    restore_backend_paths || true
    echo "注意: backend 源码已尝试回滚。" >&2
    if [ "$DOCKER_ATTEMPTED" -eq 1 ]; then
      echo "      若 health 阶段已尝试容器回滚仍失败，请检查:" >&2
      echo "        docker compose ps && docker compose logs backend --tail 80" >&2
    fi
  fi
  exit "$ec"
}

# 仅 checkout Git 中存在的路径（staging compose 等可能只在服务器本地维护）
checkout_ref_paths() {
  local ref="$1"
  shift
  local path existing=()
  for path in "$@"; do
    if git cat-file -e "$ref:$path" 2>/dev/null; then
      existing+=("$path")
    else
      echo "跳过（Git 中无此路径，保留服务器本地文件）: $path"
    fi
  done
  if [ "${#existing[@]}" -gt 0 ]; then
    git checkout "$ref" -- "${existing[@]}"
  fi
}

resolve_compose_file() {
  if [ -n "${DOCKER_COMPOSE_FILE:-}" ] && [ -f "$DOCKER_COMPOSE_FILE" ]; then
    echo "$DOCKER_COMPOSE_FILE"
    return 0
  fi
  for f in docker-compose.staging.yml docker-compose.yml; do
    if [ -f "$f" ]; then
      echo "$f"
      return 0
    fi
  done
  return 1
}

run_exhibits_post_checks() {
  if ! command -v node >/dev/null 2>&1; then
    echo "警告: 未找到 node，跳过 exhibits 静态校验" >&2
    return 0
  fi
  echo ""
  echo "=== exhibits 静态校验 ==="
  (cd exhibits && node check-static-deps.mjs)
  if [ -f exhibits/node_modules/esbuild/package.json ]; then
    (cd exhibits && node build-viewer.mjs --check)
  else
    echo "跳过 build-viewer --check（ECS 无 node_modules/esbuild）"
  fi
}

tag_predeploy_backend_image() {
  local compose_file="$1" cid image
  cid="$(docker compose -f "$compose_file" ps -q backend 2>/dev/null | head -1 || true)"
  [ -n "$cid" ] || return 0
  image="$(docker inspect --format='{{.Image}}' "$cid")"
  docker tag "$image" "$BACKEND_ROLLBACK_TAG" 2>/dev/null || true
  echo "已标记部署前 backend image: $BACKEND_ROLLBACK_TAG"
}

verify_backend_health() {
  curl -sf http://127.0.0.1:8080/api/v1/health | python3 -c '
import json, sys
d = json.load(sys.stdin)
assert d.get("code") == 200, d
assert d.get("data", {}).get("status") == "UP", d
'
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
  if verify_backend_health; then
    curl -s http://127.0.0.1:8080/api/v1/health | python3 -m json.tool | head -12
    return 0
  fi
  echo "backend health 检查失败" >&2
  if docker image inspect "$BACKEND_ROLLBACK_TAG" >/dev/null 2>&1; then
    echo "尝试回滚 backend 容器..." >&2
    rollback_backend_container "$compose_file" || true
    if verify_backend_health; then
      echo "backend 容器已回滚，health 恢复" >&2
    else
      echo "P0: backend 容器回滚后 health 仍失败，请人工检查 docker compose logs backend" >&2
    fi
  fi
  return 1
}

trap on_update_err ERR

echo "=== update-staging-from-github @ $ROOT ==="
echo "拉取: $REF"
echo ""

if [ ! -d .git ]; then
  echo "错误: $ROOT 不是 git 仓库" >&2
  exit 1
fi

git fetch "$REMOTE" "$BRANCH"

dirty="$(git status --porcelain -- exhibits/craft-*/config.json 2>/dev/null || true)"
if [ -n "$dirty" ]; then
  echo "注意: 以下 craft config 相对 Git 有本地修改（在线编辑正常现象），更新后会保留：" >&2
  echo "$dirty" >&2
fi

backup_craft_configs

echo ""
echo "=== bootstrap collector 依赖（跨版本升级必须先于 collect）==="
BOOTSTRAP_PATHS=(
  scripts
  exhibits/staging-editor-paths.mjs
  exhibits/build-viewer.mjs
  exhibits/build-viewer-bundle.mjs
  exhibits/player.html
  exhibits/studio.html
)
CODE_PATHS=("${BOOTSTRAP_PATHS[@]}")
backup_code_paths "${BOOTSTRAP_PATHS[@]}"
git checkout "$REF" -- "${BOOTSTRAP_PATHS[@]}"

echo ""
echo "=== checkout 运行路径（不含 miniapp/design/test/admin 源码）==="
BACKEND_CHECKOUT_PATHS=(backend sql docker-compose.staging.yml docker-compose.yml)
backup_backend_paths "$REF" "${BACKEND_CHECKOUT_PATHS[@]}"
checkout_ref_paths "$REF" "${BACKEND_CHECKOUT_PATHS[@]}"
BACKEND_CHECKED_OUT=1

echo ""
echo "=== checkout exhibits 代码路径（保留 craft-* 在线内容）==="
mapfile -t EXHIBITS_PATHS < <(node scripts/collect-staging-editor-files.mjs --repo)
if [ "${#EXHIBITS_PATHS[@]}" -eq 0 ]; then
  echo "错误: collect-staging-editor-files.mjs 未输出路径" >&2
  exit 1
fi
assert_exhibits_paths_safe "${EXHIBITS_PATHS[@]}"
for p in "${EXHIBITS_PATHS[@]}"; do
  case " ${CODE_PATHS[*]} " in
    *" $p "*) ;;
    *) CODE_PATHS+=("$p") ;;
  esac
done
# 追加备份 collector 清单里 bootstrap 未覆盖的路径
for p in "${EXHIBITS_PATHS[@]}"; do
  case " ${BOOTSTRAP_PATHS[*]} " in
    *" $p "*) continue ;;
  esac
  backup_path_into_code_backup "$p"
done

git checkout "$REF" -- "${EXHIBITS_PATHS[@]}"

detect_craft_configs_changed_by_checkout
restore_craft_configs
run_exhibits_post_checks

echo ""
echo "=== 瘦身（移回 _slim_archive，exhibits 里被拉回的测试目录也会被清掉）==="
if [ "${SKIP_SLIM:-0}" != "1" ]; then
  bash scripts/slim-staging-server.sh
else
  echo "SKIP_SLIM=1，跳过"
fi

echo ""
if [ "${SKIP_DOCKER:-0}" != "1" ]; then
  if compose_file="$(resolve_compose_file)"; then
    echo "=== 重建 backend 容器 ($compose_file) ==="
    DOCKER_ATTEMPTED=1
    deploy_backend_with_health "$compose_file"
  else
    echo "跳过 Docker：未找到 compose 文件（可设 DOCKER_COMPOSE_FILE=...）" >&2
  fi
else
  echo "SKIP_DOCKER=1，跳过 Docker"
fi

UPDATE_OK=1
trap - ERR

echo ""
echo "完成。若改了管理后台 Vue 代码，请在本机 build 并 scp admin/dist 到 ECS。"
