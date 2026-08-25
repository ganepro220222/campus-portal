#!/usr/bin/env bash
# staging ECS：从 GitHub 更新「运行相关」路径，避免整仓 reset 拉回 miniapp/design/test 等。
# exhibits 只 checkout 代码路径，不覆盖 craft-*/config.json 等在线编辑内容。
#
# 用法（SSH 登录 ECS 后）：
#   cd /opt/shuyuan
#   bash scripts/update-staging-from-github.sh
#
# 管理后台 admin/dist 不在 Git 中，更新 backend 后若需改后台：
#   在本机 admin/ build，再 scp dist 到服务器（见部署手册）。
#
# 环境变量：
#   GIT_REMOTE=origin   GIT_BRANCH=main
#   SKIP_DOCKER=1       只拉代码不重建容器
#   SKIP_SLIM=1         跳过瘦身（一般不要设）
#
# 若要从 Git 恢复展品 config（覆盖在线编辑），见 scripts/restore-exhibit-content-from-git.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REMOTE="${GIT_REMOTE:-origin}"
BRANCH="${GIT_BRANCH:-main}"
REF="$REMOTE/$BRANCH"
BACKUP=""

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
  for cfg in exhibits/craft-*/config.json; do
    [ -f "$cfg" ] || continue
    rel="${cfg#exhibits/}"
    if [ -f "$BACKUP/$rel" ]; then
      cp "$BACKUP/$rel" "$cfg"
    fi
  done
  echo "已恢复 craft config 自备份"
}

verify_craft_configs_unchanged() {
  local cfg rel changed=0
  for cfg in exhibits/craft-*/config.json; do
    [ -f "$cfg" ] || continue
    rel="${cfg#exhibits/}"
    [ -f "$BACKUP/$rel" ] || continue
    if ! cmp -s "$cfg" "$BACKUP/$rel"; then
      echo "错误: $cfg 在代码更新后被改动，已从备份恢复" >&2
      cp "$BACKUP/$rel" "$cfg"
      changed=1
    fi
  done
  if [ "$changed" -ne 0 ]; then
    echo "craft config 已与备份对齐；请检查 checkout 清单是否误含 craft-* 内容路径" >&2
    exit 1
  fi
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
  for f in docker-compose.staging.yml docker-compose.yml docker-compose.dev.yml; do
    if [ -f "$f" ]; then
      echo "$f"
      return 0
    fi
  done
  return 1
}

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
git checkout "$REF" -- \
  scripts \
  exhibits/staging-editor-paths.mjs \
  exhibits/build-viewer.mjs \
  exhibits/build-viewer-bundle.mjs \
  exhibits/player.html \
  exhibits/studio.html

echo ""
echo "=== checkout 运行路径（不含 miniapp/design/test/admin 源码）==="
checkout_ref_paths "$REF" backend sql docker-compose.staging.yml docker-compose.yml

echo ""
echo "=== checkout exhibits 代码路径（保留 craft-* 在线内容）==="
mapfile -t EXHIBITS_PATHS < <(node scripts/collect-staging-editor-files.mjs --repo)
if [ "${#EXHIBITS_PATHS[@]}" -eq 0 ]; then
  echo "错误: collect-staging-editor-files.mjs 未输出路径" >&2
  exit 1
fi
git checkout "$REF" -- "${EXHIBITS_PATHS[@]}"

restore_craft_configs
verify_craft_configs_unchanged

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
    docker compose -f "$compose_file" up -d --build backend
    echo ""
    echo "=== health ==="
    curl -s http://127.0.0.1:8080/api/v1/health | python3 -m json.tool | head -12
  else
    echo "跳过 Docker：未找到 compose 文件（可设 DOCKER_COMPOSE_FILE=...）" >&2
  fi
else
  echo "SKIP_DOCKER=1，跳过 Docker"
fi

echo ""
echo "完成。若改了管理后台 Vue 代码，请在本机 build 并 scp admin/dist 到 ECS。"
