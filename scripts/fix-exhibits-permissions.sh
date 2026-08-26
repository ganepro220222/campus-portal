#!/usr/bin/env bash
# staging ECS：exhibits 目录权限修复（代码只读 + 展品内容可协作编辑）。
#
# 原则：
#   - Nginx (www-data) 只读：不进写组，靠目录 755 / 文件 644 的 other 位读静态展品
#   - 代码树 root:root 755/644，防止 Web/上传误改 _server、vendor 等
#   - 仅 craft-*、共享背景等内容目录 setgid 2775 + 664，组内（File Browser / studio）可写
#
# 用法（SSH root）：
#   bash scripts/fix-exhibits-permissions.sh
#
# 环境变量：
#   EXHIBITS_ROOT=/opt/shuyuan/exhibits
#   EXHIBITS_GROUP=1000          # File Browser / 部署用户常见 gid
#   NGINX_USER=www-data
#   STUDIO_USER=studio           # systemd 工作台进程用户（存在则加入写组）

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EX="${EXHIBITS_ROOT:-$ROOT/exhibits}"
NGX="${NGINX_USER:-www-data}"
STUDIO_USER="${STUDIO_USER:-studio}"

CODE_DIRS=(_server _launch _dev vendor _staging-editor-pack deploy-test-server e2e _template _runtime _code_backup _content_backup)

if [ ! -d "$EX" ]; then
  echo "错误: 目录不存在 $EX" >&2
  exit 1
fi

resolve_exhibits_gid() {
  if [ -n "${EXHIBITS_GROUP:-}" ]; then
    if [[ "${EXHIBITS_GROUP}" =~ ^[0-9]+$ ]]; then
      echo "${EXHIBITS_GROUP}"
    else
      getent group "${EXHIBITS_GROUP}" | cut -d: -f3
    fi
    return
  fi
  stat -c %g "$EX"
}

ensure_group_registered() {
  local gid="$1" name
  if getent group "$gid" >/dev/null; then
    getent group "$gid" | cut -d: -f1
    return
  fi
  name="${EXHIBITS_GROUP_NAME:-shuyuan-exhibits}"
  groupadd -g "$gid" "$name"
  echo "$name"
}

harden_code_tree() {
  local dir="$1"
  chown -R root:root "$dir"
  find "$dir" -type d -exec chmod 755 {} \;
  find "$dir" -type f -exec chmod 644 {} \;
}

apply_content_tree() {
  local dir="$1"
  chgrp -R "$GID" "$dir"
  find "$dir" -type d -exec chmod 2775 {} \;
  find "$dir" -type f -exec chmod 664 {} \;
}

remove_nginx_from_write_group() {
  if ! id "$NGX" &>/dev/null; then
    echo "警告: 系统用户 $NGX 不存在，跳过组调整" >&2
    return
  fi
  if id -G "$NGX" 2>/dev/null | tr ' ' '\n' | grep -qx "$GID"; then
    gpasswd -d "$NGX" "$GNAME" 2>/dev/null || deluser "$NGX" "$GNAME" 2>/dev/null || true
    echo "OK  已将 $NGX 移出 $GNAME（Nginx 只读，不走组写权限）"
  else
    echo "OK  $NGX 不在写组 $GNAME"
  fi
}

GID="$(resolve_exhibits_gid)"
GNAME="$(ensure_group_registered "$GID")"

echo "=== fix-exhibits-permissions ==="
echo "exhibits: $EX"
echo "group:    $GNAME (gid $GID)"
echo "nginx:    $NGX (只读)"
echo "studio:   $STUDIO_USER"

remove_nginx_from_write_group

if id "$STUDIO_USER" &>/dev/null; then
  if id -G "$STUDIO_USER" 2>/dev/null | tr ' ' '\n' | grep -qx "$GID"; then
    echo "OK  $STUDIO_USER 已在 gid $GID ($GNAME)"
  else
    usermod -aG "$GNAME" "$STUDIO_USER"
    echo "OK  已将 $STUDIO_USER 加入组 $GNAME"
  fi
else
  echo "提示: 用户 $STUDIO_USER 不存在，跳过（见 studio-server.service.example 创建说明）"
fi

# exhibits 根：可遍历，不可被组内随意改
chown root:root "$EX"
chmod 755 "$EX"

echo "模式: 代码 root:root 755/644；内容 setgid 2775 + 664"

for d in "${CODE_DIRS[@]}"; do
  if [ -d "$EX/$d" ]; then
    harden_code_tree "$EX/$d"
    echo "OK  代码 $d"
  fi
done

# 根目录代码文件（html/js/mjs/json/py/bat 等），不含子目录
find "$EX" -maxdepth 1 -type f \( \
  -name '*.html' -o -name '*.js' -o -name '*.mjs' -o -name '*.json' -o \
  -name '*.py' -o -name '*.bat' -o -name '*.css' -o -name '*.md' -o -name '*.php' \
  \) -exec chown root:root {} \; -exec chmod 644 {} \;

shopt -s nullglob
for d in "$EX"/craft-*; do
  if [ -d "$d" ]; then
    apply_content_tree "$d"
    echo "OK  内容 $(basename "$d")"
  fi
done
shopt -u nullglob

if [ -d "$EX/共享背景" ]; then
  apply_content_tree "$EX/共享背景"
  echo "OK  内容 共享背景"
fi

systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true

echo ""
echo "完成。请验证："
echo "  curl -sI http://127.0.0.1/exhibits/craft-001/ | head -1"
echo "  ls -la $EX/_server | head -3   # 应为 root root drwxr-xr-x"
echo "  （File Browser 新上传文件后，浏览器应能直接打开 /exhibits/... 下对应 URL）"
