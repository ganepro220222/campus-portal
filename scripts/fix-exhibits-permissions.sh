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
#   FILEBROWSER_USER=filebrowser # File Browser 进程用户（存在则加入写组）

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EX="${EXHIBITS_ROOT:-$ROOT/exhibits}"
NGX="${NGINX_USER:-www-data}"
STUDIO_USER="${STUDIO_USER:-studio}"
FILEBROWSER_USER="${FILEBROWSER_USER:-filebrowser}"
STUDIO_GROUP_ADDED=0

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
  # 脚本会把 exhibits 根设为 root:root，不能再靠 stat 推断写组
  local name="${EXHIBITS_GROUP_NAME:-shuyuan-exhibits}"
  if getent group "$name" >/dev/null; then
    getent group "$name" | cut -d: -f3
    return
  fi
  local g
  g="$(stat -c %g "$EX")"
  if [ "$g" != "0" ]; then
    echo "$g"
    return
  fi
  echo "1000"
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
  find "$dir" -type d -exec chmod g-s {} \;
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

add_user_to_write_group() {
  local u="$1" hint="$2"
  if ! id "$u" &>/dev/null; then
    echo "提示: 用户 $u 不存在，跳过（$hint）"
    return 0
  fi
  if id -G "$u" 2>/dev/null | tr ' ' '\n' | grep -qx "$GID"; then
    echo "OK  $u 已在 gid $GID ($GNAME)"
    return 0
  fi
  usermod -aG "$GNAME" "$u"
  echo "OK  已将 $u 加入组 $GNAME"
  if [ "$u" = "$STUDIO_USER" ]; then
    STUDIO_GROUP_ADDED=1
  fi
}

GID="$(resolve_exhibits_gid)"
GNAME="$(ensure_group_registered "$GID")"

if [ "$GID" = "0" ]; then
  echo "错误: EXHIBITS_GROUP 不能为 0 (root 组)" >&2
  exit 1
fi

echo "=== fix-exhibits-permissions ==="
echo "exhibits: $EX"
echo "group:    $GNAME (gid $GID)"
echo "nginx:    $NGX (只读)"
echo "studio:   $STUDIO_USER"
echo "filebrowser: $FILEBROWSER_USER"

remove_nginx_from_write_group
add_user_to_write_group "$STUDIO_USER" "见 studio-server.service.example"
add_user_to_write_group "$FILEBROWSER_USER" "见 filebrowser.service.example"

# exhibits 根：可遍历，不可被组内随意改
chown root:root "$EX"
chmod g-s "$EX" 2>/dev/null || true
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

# default ACL：新上传即时可读（不依赖 File Browser umask）；SET_CONTENT_ACL=0 可关
maybe_apply_nginx_read_acl() {
  [ "${SET_CONTENT_ACL:-1}" = "1" ] || return 0
  if ! command -v setfacl >/dev/null; then
    echo "警告: 无 setfacl，跳过 ACL（请 apt install acl；或修 File Browser UMask=0022）" >&2
    return 0
  fi
  if ! id "$NGX" &>/dev/null; then
    return 0
  fi
  local d
  for d in "$EX"/craft-* "$EX/共享背景"; do
    [ -e "$d" ] || continue
    setfacl -R -m "u:${NGX}:r-X" "$d" 2>/dev/null || true
    setfacl -R -d -m "u:${NGX}:rX" "$d" 2>/dev/null || true
    echo "OK  ACL 只读 $NGX → $(basename "$d")"
  done
}
maybe_apply_nginx_read_acl

as_studio() {
  if command -v runuser >/dev/null; then
    runuser -u "$STUDIO_USER" -- "$@"
  elif command -v sudo >/dev/null; then
    sudo -u "$STUDIO_USER" -- "$@"
  else
    echo "错误: 缺少 runuser 或 sudo，无法验证 studio 实际权限（Debian: apt install util-linux）" >&2
    return 127
  fi
}

verify_studio_gate() {
  if ! id "$STUDIO_USER" &>/dev/null; then
    echo "提示: 跳过 studio 权限门禁（$STUDIO_USER 不存在）"
    return 0
  fi
  local craft_sample="$EX/_server/studio-server.mjs"
  local content_cfg=""
  local d rc
  for d in "$EX"/craft-*; do
    [ -d "$d" ] || continue
    if [ -f "$d/config.json" ]; then
      content_cfg="$d/config.json"
      break
    fi
  done
  if [ -n "$content_cfg" ]; then
    if ! as_studio test -w "$content_cfg" 2>/dev/null; then
      rc=$?
      if [ "$rc" = "127" ]; then
        exit 127
      fi
      echo "错误: $STUDIO_USER 无法写入 $content_cfg" >&2
      echo "  请确认已执行 usermod -aG $GNAME $STUDIO_USER" >&2
      exit 1
    fi
    echo "OK  $STUDIO_USER 可写内容 $(basename "$(dirname "$content_cfg")")/config.json"
  else
    echo "警告: 无 craft-*/config.json，跳过 studio 写内容抽样" >&2
  fi
  if [ -f "$craft_sample" ]; then
    if as_studio test -w "$craft_sample" 2>/dev/null; then
      echo "错误: $STUDIO_USER 不应能写 $craft_sample" >&2
      exit 1
    fi
    echo "OK  $STUDIO_USER 不可写 _server 代码"
  fi
}
verify_studio_gate

studio_pid_groups_line() {
  local pid="$1"
  [ -n "$pid" ] && [ "$pid" != "0" ] && [ -r "/proc/$pid/status" ] || return 1
  grep '^Groups:' "/proc/$pid/status" || return 1
}

studio_pid_has_write_gid() {
  local pid="$1" groups_line
  groups_line="$(studio_pid_groups_line "$pid")" || return 1
  echo "$groups_line" | grep -qE "(^Groups:[[:space:]]|^|[[:space:]])${GID}([[:space:]]|$)"
}

verify_studio_process_groups() {
  if ! id "$STUDIO_USER" &>/dev/null; then
    return 0
  fi
  if ! command -v systemctl >/dev/null; then
    if [ "${STUDIO_GROUP_ADDED:-0}" = "1" ]; then
      echo "提示: 无 systemctl，请手动 restart studio-server 使附加组生效" >&2
    fi
    return 0
  fi
  if ! systemctl is-active --quiet studio-server 2>/dev/null; then
    return 0
  fi

  local pid need_restart=0
  pid="$(systemctl show -p MainPID --value studio-server 2>/dev/null || true)"
  if studio_pid_has_write_gid "$pid"; then
    studio_pid_groups_line "$pid" || true
    echo "OK  运行中 studio-server (PID $pid) 已含写组 gid $GID"
    return 0
  fi

  if [ -n "$pid" ] && [ "$pid" != "0" ]; then
    echo "运行中 studio-server (PID $pid) 缺少写组 gid $GID，正在 restart..." >&2
    studio_pid_groups_line "$pid" 2>/dev/null || true
    need_restart=1
  elif [ "${STUDIO_GROUP_ADDED:-0}" = "1" ]; then
    need_restart=1
  fi

  if [ "$need_restart" = "1" ]; then
    systemctl restart studio-server
    pid="$(systemctl show -p MainPID --value studio-server 2>/dev/null || true)"
    if ! studio_pid_has_write_gid "$pid"; then
      studio_pid_groups_line "$pid" 2>/dev/null || true
      echo "错误: restart 后 studio-server (PID $pid) 仍未含写组 gid $GID" >&2
      exit 1
    fi
    studio_pid_groups_line "$pid" || true
    echo "OK  restart 后 studio-server (PID $pid) 已含写组 gid $GID"
  fi
}
verify_studio_process_groups

systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true

echo ""
echo "完成。请验证："
echo "  curl -sI http://127.0.0.1/exhibits/craft-001/ | head -1"
echo "  ls -la $EX/_server | head -3   # 应为 root root drwxr-xr-x"
echo "  （File Browser 上传后 Nginx 应 200；若 403 请确认 setfacl/acl 已装且本脚本已跑）"
echo "  （File Browser systemd 建议 UMask=0022 + User=filebrowser，见 scripts/filebrowser.service.example）"
