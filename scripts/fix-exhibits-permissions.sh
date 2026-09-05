#!/usr/bin/env bash
# staging ECS：exhibits 目录权限修复（代码只读 + 展品内容可协作编辑）。
#
# 原则：
#   - Nginx (www-data) 只读：不进写组，靠目录 other 位读静态展品
#   - 代码树 root:root 755/644，防止 Web/上传误改 _server、vendor、player.html 等
#   - 仅 craft-*、共享背景等内容目录 setgid 2775 + 664，组内（File Browser / studio）可写
#   - exhibits 根 3775（setgid+sticky+组写）：写组可新建/删除自己拥有的子项
#     （才能从 File Browser 删掉整个 craft-* / 共享背景），但删不掉 root 属主的代码文件/目录
#   - 内容目录 inode 属主改为 File Browser UID（Docker 默认 1000），sticky 下才能 unlink 整个夹
#
# 用法（SSH root）：
#   bash scripts/fix-exhibits-permissions.sh
#
# 环境变量：
#   EXHIBITS_ROOT=/opt/shuyuan/exhibits
#   EXHIBITS_GROUP=1000          # File Browser / 部署用户常见 gid
#   NGINX_USER=www-data
#   STUDIO_USER=studio           # systemd 工作台进程用户（存在则加入写组）
#   FILEBROWSER_USER=filebrowser # 原生 systemd File Browser（存在则加入写组）
#   FILEBROWSER_UID=1000         # Docker File Browser 宿主机 UID（无 filebrowser 用户时用）
#   CONTENT_OWNER_UID=           # 覆盖内容目录属主；默认 filebrowser 用户或 FILEBROWSER_UID

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
  # 根目录会写成 root:写组；仍优先用显式组名，避免误用其它非 0 组
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

resolve_content_owner_uid() {
  if [ -n "${CONTENT_OWNER_UID:-}" ]; then
    echo "${CONTENT_OWNER_UID}"
    return
  fi
  # 显式 FILEBROWSER_UID 优先（staging Docker 固定 1000，避免宿主机碰巧有 filebrowser 用户）
  if [ -n "${FILEBROWSER_UID:-}" ]; then
    echo "${FILEBROWSER_UID}"
    return
  fi
  if id "$FILEBROWSER_USER" &>/dev/null; then
    id -u "$FILEBROWSER_USER"
    return
  fi
  echo "1000"
}

apply_content_tree() {
  local dir="$1"
  chgrp -R "$GID" "$dir"
  find "$dir" -type d -exec chmod 2775 {} \;
  find "$dir" -type f -exec chmod 664 {} \;
  # 只改目录 inode 属主：sticky 根下 File Browser 才能 unlink 整个展品夹/共享背景
  # 内部文件仍可保持 root:写组 664，组员照常改内容
  chown "$OWNER_UID:$GID" "$dir"
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

OWNER_UID="$(resolve_content_owner_uid)"
if [ "$OWNER_UID" = "0" ]; then
  echo "错误: 内容目录属主不能为 root（CONTENT_OWNER_UID / FILEBROWSER_UID）" >&2
  exit 1
fi

OWNER_NAME="$(getent passwd "$OWNER_UID" | cut -d: -f1 || true)"

echo "=== fix-exhibits-permissions ==="
echo "exhibits: $EX"
echo "group:    $GNAME (gid $GID)"
echo "nginx:    $NGX (只读)"
echo "studio:   $STUDIO_USER"
echo "filebrowser: $FILEBROWSER_USER"
echo "content-owner: uid $OWNER_UID${OWNER_NAME:+ ($OWNER_NAME)}"

remove_nginx_from_write_group
add_user_to_write_group "$STUDIO_USER" "见 studio-server.service.example"
add_user_to_write_group "$FILEBROWSER_USER" "见 filebrowser.service.example"
if [ -n "$OWNER_NAME" ]; then
  add_user_to_write_group "$OWNER_NAME" "File Browser 宿主机映射用户 (UID $OWNER_UID)"
fi

# exhibits 根：写组可建/删自己拥有的子项（craft-* / 共享背景）；
# sticky 阻止删除 root 属主的 player.html、_server、vendor 等
chown root:"$GID" "$EX"
chmod 3775 "$EX"

echo "模式: 根 3775 sticky+setgid；代码 root:root 755/644；内容 2775/664 属主 $OWNER_UID"

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
    if setfacl -R -m "u:${NGX}:r-X" "$d" && setfacl -R -d -m "u:${NGX}:rX" "$d"; then
      echo "OK  ACL 只读 $NGX → $(basename "$d")"
    else
      echo "错误: 无法对 $(basename "$d") 应用 ACL（请确认文件系统支持 ACL 且已 apt install acl）" >&2
      return 1
    fi
  done
}
maybe_apply_nginx_read_acl

as_studio_available() {
  command -v runuser >/dev/null || command -v sudo >/dev/null
}

as_user() {
  local u="$1"
  shift
  if command -v runuser >/dev/null; then
    runuser -u "$u" -- "$@"
  elif command -v sudo >/dev/null; then
    sudo -u "$u" -- "$@"
  else
    echo "错误: 缺少 runuser 或 sudo，无法验证 studio 实际权限（Debian: apt install util-linux）" >&2
    return 127
  fi
}

as_studio() {
  as_user "$STUDIO_USER" "$@"
}

as_content_owner() {
  if [ -z "${OWNER_NAME:-}" ]; then
    echo "错误: UID $OWNER_UID 无 passwd 项，无法验证 File Browser 删除权限" >&2
    return 127
  fi
  as_user "$OWNER_NAME" "$@"
}

verify_studio_gate() {
  if ! id "$STUDIO_USER" &>/dev/null; then
    echo "提示: 跳过 studio 权限门禁（$STUDIO_USER 不存在）"
    return 0
  fi
  if ! as_studio_available; then
    echo "错误: 缺少 runuser 或 sudo，无法验证 studio 实际权限（Debian: apt install util-linux）" >&2
    exit 127
  fi
  local craft_sample="$EX/_server/studio-server.mjs"
  local content_cfg=""
  local d
  for d in "$EX"/craft-*; do
    [ -d "$d" ] || continue
    if [ -f "$d/config.json" ]; then
      content_cfg="$d/config.json"
      break
    fi
  done
  if [ -n "$content_cfg" ]; then
    if ! as_studio test -w "$content_cfg"; then
      echo "错误: $STUDIO_USER 无法写入 $content_cfg" >&2
      echo "  请确认已执行 usermod -aG $GNAME $STUDIO_USER" >&2
      exit 1
    fi
    echo "OK  $STUDIO_USER 可写内容 $(basename "$(dirname "$content_cfg")")/config.json"
  else
    echo "警告: 无 craft-*/config.json，跳过 studio 写内容抽样" >&2
  fi
  if [ -f "$craft_sample" ]; then
    if as_studio test -w "$craft_sample"; then
      echo "错误: $STUDIO_USER 不应能写 $craft_sample" >&2
      exit 1
    fi
    echo "OK  $STUDIO_USER 不可写 _server 代码"
  fi
}
verify_studio_gate

verify_content_delete_gate() {
  local d owner probe_dir probe_file probe_code_dir
  for d in "$EX"/craft-* "$EX/共享背景"; do
    [ -d "$d" ] || continue
    case "$(basename "$d")" in
      craft-__perm_probe__) continue ;;
    esac
    owner="$(stat -c %u "$d")"
    if [ "$owner" != "$OWNER_UID" ]; then
      echo "错误: $(basename "$d") 属主是 uid $owner，应为 $OWNER_UID（否则 File Browser 删不掉整个文件夹）" >&2
      exit 1
    fi
  done

  if [ -z "${OWNER_NAME:-}" ]; then
    echo "提示: 跳过删除门禁（UID $OWNER_UID 无 passwd 项；Docker 仍按数值 uid 写盘）"
    return 0
  fi
  if ! as_studio_available; then
    echo "错误: 缺少 runuser 或 sudo，无法验证 File Browser 删除权限（Debian: apt install util-linux）" >&2
    exit 127
  fi

  probe_dir="$EX/craft-__perm_probe__"
  rm -rf "$probe_dir"
  mkdir "$probe_dir"
  apply_content_tree "$probe_dir"
  if ! as_content_owner rmdir "$probe_dir"; then
    echo "错误: $OWNER_NAME (uid $OWNER_UID) 无法删除内容目录（检查根目录是否 3775、属主是否 $OWNER_UID）" >&2
    rm -rf "$probe_dir"
    exit 1
  fi
  echo "OK  $OWNER_NAME 可删除 craft-* 整个文件夹"

  probe_file="$EX/.perm-probe-code-file"
  printf 'probe\n' >"$probe_file"
  chown root:root "$probe_file"
  chmod 644 "$probe_file"
  if as_content_owner rm -f "$probe_file" 2>/dev/null && [ ! -f "$probe_file" ]; then
    echo "错误: $OWNER_NAME 不应能删除根上 root 属主文件（sticky 失效）" >&2
    exit 1
  fi
  rm -f "$probe_file"

  probe_code_dir="$EX/.perm-probe-code-dir"
  rm -rf "$probe_code_dir"
  mkdir "$probe_code_dir"
  chown root:root "$probe_code_dir"
  chmod 755 "$probe_code_dir"
  if as_content_owner rmdir "$probe_code_dir" 2>/dev/null; then
    echo "错误: $OWNER_NAME 不应能删除根上 root 属主目录（_server / vendor 同类）" >&2
    exit 1
  fi
  rmdir "$probe_code_dir"
  echo "OK  $OWNER_NAME 不能删除根上代码文件/目录"
}
verify_content_delete_gate

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
echo "  ls -ld $EX                 # 应为 root:写组 drwxrwsr-t (3775)"
echo "  ls -ld $EX/craft-* $EX/共享背景 2>/dev/null | head"
echo "  ls -la $EX/_server | head -3   # 应为 root root drwxr-xr-x"
echo "  （File Browser 应能删除整个 craft-* / 共享背景，不能删 player.html / _server）"
echo "  （上传后 Nginx 应 200；若 403 请确认 setfacl/acl 已装且本脚本已跑）"
echo "  （File Browser systemd 建议 UMask=0022 + User=filebrowser，见 scripts/filebrowser.service.example）"
