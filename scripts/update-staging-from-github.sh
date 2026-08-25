#!/usr/bin/env bash
# staging ECS：从 GitHub 更新「运行相关」路径，避免整仓 reset 拉回 miniapp/design/test 等。
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

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REMOTE="${GIT_REMOTE:-origin}"
BRANCH="${GIT_BRANCH:-main}"
REF="$REMOTE/$BRANCH"

echo "=== update-staging-from-github @ $ROOT ==="
echo "拉取: $REF"
echo ""

if [ ! -d .git ]; then
  echo "错误: $ROOT 不是 git 仓库" >&2
  exit 1
fi

git fetch "$REMOTE" "$BRANCH"

# 只 checkout 服务器需要的路径（勿加 design / test / miniapp / docs / admin）
git checkout "$REF" -- \
  backend \
  sql \
  scripts \
  docker-compose.staging.yml \
  exhibits

echo ""
echo "=== 瘦身（移回 _slim_archive，exhibits 里被拉回的测试目录也会被清掉）==="
if [ "${SKIP_SLIM:-0}" != "1" ]; then
  bash scripts/slim-staging-server.sh
else
  echo "SKIP_SLIM=1，跳过"
fi

echo ""
if [ "${SKIP_DOCKER:-0}" != "1" ]; then
  echo "=== 重建 backend 容器 ==="
  docker compose -f docker-compose.staging.yml up -d --build backend
  echo ""
  echo "=== health ==="
  curl -s http://127.0.0.1:8080/api/v1/health | python3 -m json.tool | head -12
else
  echo "SKIP_DOCKER=1，跳过 Docker"
fi

echo ""
echo "完成。若改了管理后台 Vue 代码，请在本机 build 并 scp admin/dist 到 ECS。"
