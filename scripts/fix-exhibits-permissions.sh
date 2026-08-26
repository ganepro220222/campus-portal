#!/usr/bin/env bash
# staging ECS：exhibits 目录权限一次性修复，避免 File Browser 上传后 Nginx 403、或目录 750 打不开。
#
# 原理：
#   - 展品与共享背景由 File Browser（常见 uid/gid 1000）上传，默认 umask 常得到 640/750
#   - Nginx 以 www-data 提供 /exhibits/ 静态访问；www-data 须能读（进组 + setgid 目录）
#   - 父目录设 setgid(2775) 后，新建文件/夹继承组，组内可读可写
#
# 用法（SSH root）：
#   bash scripts/fix-exhibits-permissions.sh
#
# 环境变量：
#   EXHIBITS_ROOT=/opt/shuyuan/exhibits
#   EXHIBITS_GROUP=1000          # File Browser / 部署用户常见 gid
#   NGINX_USER=www-data
#   STAGING_INSECURE=1           # 极端宽松：目录 777、文件 666（仅 staging，勿用于生产）

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EX="${EXHIBITS_ROOT:-$ROOT/exhibits}"
NGX="${NGINX_USER:-www-data}"

if [ ! -d "$EX" ]; then
  echo "错误: 目录不存在 $EX" >&2
  exit 1
fi

# 从目录属组或 EXHIBITS_GROUP 解析 gid；若无 /etc/group 条目则创建（File Browser 常见 1000 只有数字无组名）
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

GID="$(resolve_exhibits_gid)"
GNAME="$(ensure_group_registered "$GID")"

echo "=== fix-exhibits-permissions ==="
echo "exhibits: $EX"
echo "group:    $GNAME (gid $GID)"
echo "nginx:    $NGX"

if id "$NGX" &>/dev/null; then
  if id -G "$NGX" 2>/dev/null | tr ' ' '\n' | grep -qx "$GID"; then
    echo "OK  $NGX 已在 gid $GID ($GNAME)"
  else
    usermod -aG "$GNAME" "$NGX"
    echo "OK  已将 $NGX 加入组 $GNAME（gid $GID）"
  fi
else
  echo "警告: 系统用户 $NGX 不存在，跳过 usermod" >&2
fi

if [ "${STAGING_INSECURE:-0}" = "1" ]; then
  echo "模式: STAGING_INSECURE（目录 777 / 文件 666）"
  find "$EX" -type d -exec chmod 777 {} \;
  find "$EX" -type f -exec chmod 666 {} \;
else
  echo "模式: setgid 2775 + 文件 664 + 组 $GNAME"
  chgrp -R "$GID" "$EX"
  find "$EX" -type d -exec chmod 2775 {} \;
  find "$EX" -type f -exec chmod 664 {} \;
fi

# 仍禁止通过 Web 访问的开发路径保持 nginx 404 即可；权限与公网展品一致
for blocked in _server _launch _dev _runtime _code_backup _content_backup; do
  [ -d "$EX/$blocked" ] && chmod 2775 "$EX/$blocked" 2>/dev/null || true
done

systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true

echo ""
echo "完成。请验证："
echo "  curl -sI http://127.0.0.1/exhibits/craft-001/ | head -1"
echo "  （File Browser 新上传文件后，浏览器应能直接打开 /exhibits/... 下对应 URL）"
