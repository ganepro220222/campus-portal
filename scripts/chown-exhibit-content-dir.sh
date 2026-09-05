#!/usr/bin/env bash
# 只把 exhibits 根下「一个内容目录」的 inode 交给 File Browser UID。
# 供 studio-server 在新建展品后 sudo -n 调用；禁止递归 chown、禁止改代码树。
#
# 用法（必须 root）：
#   chown-exhibit-content-dir --root /opt/shuyuan/exhibits --name craft-012 --uid 1000 --gid 1000
#
# 若存在 /etc/shuyuan/exhibits-chown-root（一行绝对路径），--root 必须与其 realpath 相同。

set -euo pipefail

usage() {
  echo "用法: chown-exhibit-content-dir --root DIR --name NAME --uid UID --gid GID" >&2
  exit 2
}

ROOT=""
NAME=""
UID_NUM=""
GID_NUM=""

while [ $# -gt 0 ]; do
  case "$1" in
    --root)
      ROOT="${2:-}"
      shift 2
      ;;
    --name)
      NAME="${2:-}"
      shift 2
      ;;
    --uid)
      UID_NUM="${2:-}"
      shift 2
      ;;
    --gid)
      GID_NUM="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "错误: 未知参数 $1" >&2
      usage
      ;;
  esac
done

if [ -z "$ROOT" ] || [ -z "$NAME" ] || [ -z "$UID_NUM" ] || [ -z "$GID_NUM" ]; then
  usage
fi

if [[ ! "$UID_NUM" =~ ^[1-9][0-9]*$ ]] || [[ ! "$GID_NUM" =~ ^[1-9][0-9]*$ ]]; then
  echo "错误: uid/gid 必须是非 0 数字" >&2
  exit 2
fi
if [ "$UID_NUM" -ge 4000000000 ] || [ "$GID_NUM" -ge 4000000000 ]; then
  echo "错误: uid/gid 超出范围" >&2
  exit 2
fi

case "$NAME" in
  ''|*/*|*\\*|.*|*..*)
    echo "错误: 非法目录名" >&2
    exit 2
    ;;
esac

if [ "$NAME" != "共享背景" ] && [[ ! "$NAME" =~ ^craft-[A-Za-z0-9_-]+$ ]]; then
  echo "错误: 只允许 craft-* 或 共享背景" >&2
  exit 2
fi

case "$NAME" in
  _server|_launch|_dev|vendor|_template|_runtime|_staging-editor-pack|deploy-test-server|e2e)
    echo "错误: 拒绝代码目录名" >&2
    exit 2
    ;;
esac

case "$ROOT" in
  /*) ;;
  *)
    echo "错误: --root 必须是绝对路径" >&2
    exit 2
    ;;
esac

if ! command -v realpath >/dev/null; then
  echo "错误: 需要 realpath（Debian: apt install coreutils）" >&2
  exit 2
fi

if [ ! -d "$ROOT" ]; then
  echo "错误: --root 不是目录" >&2
  exit 2
fi

ROOT_REAL="$(realpath -e "$ROOT")"
PIN="${EXHIBITS_CHOWN_PIN:-/etc/shuyuan/exhibits-chown-root}"
if [ -f "$PIN" ]; then
  PINNED_RAW="$(tr -d '\r' <"$PIN" | head -n 1)"
  if [ -z "$PINNED_RAW" ]; then
    echo "错误: $PIN 为空" >&2
    exit 2
  fi
  PINNED_REAL="$(realpath -e "$PINNED_RAW")"
  if [ "$ROOT_REAL" != "$PINNED_REAL" ]; then
    echo "错误: --root 不在允许的 exhibits 根内" >&2
    exit 2
  fi
fi

TARGET="$ROOT_REAL/$NAME"
if [ -L "$TARGET" ]; then
  echo "错误: 拒绝符号链接" >&2
  exit 2
fi
if [ ! -d "$TARGET" ]; then
  echo "错误: 目标不是目录" >&2
  exit 2
fi

TARGET_REAL="$(realpath -e "$TARGET")"
if [ "$TARGET_REAL" != "$ROOT_REAL/$NAME" ]; then
  echo "错误: 路径逃逸" >&2
  exit 2
fi

if [ "$(id -u)" != 0 ]; then
  echo "错误: 必须以 root 运行" >&2
  exit 1
fi

# 只改顶层 inode：sticky 根下 File Browser 才能 unlink 整个夹；不递归，避免动代码或误收权
chown "$UID_NUM:$GID_NUM" "$TARGET"
chmod 2775 "$TARGET"
