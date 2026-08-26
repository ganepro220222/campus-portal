#!/usr/bin/env bash
# 在 disposable 容器内运行 fix-exhibits-permissions 集成断言（不污染宿主机 /etc/group）。
# 由 fix-exhibits-permissions.test.mjs 通过 docker run 调用。
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq >/dev/null
apt-get install -y -qq acl sudo util-linux >/dev/null

groupadd --system studio 2>/dev/null || true
useradd --system --gid studio --shell /usr/sbin/nologin --no-create-home studio 2>/dev/null || true

groupadd -g 10001 syperm-exhibits 2>/dev/null || groupadd syperm-exhibits 2>/dev/null || true

TMP="$(mktemp -d)"
chmod 755 "$TMP"
EX="$TMP/exhibits"
mkdir -p "$EX/_server" "$EX/craft-001"
printf '// code\n' >"$EX/_server/studio-server.mjs"
printf '{}\n' >"$EX/craft-001/config.json"
printf '<html></html>\n' >"$EX/studio.html"

export EXHIBITS_ROOT="$EX"
export EXHIBITS_GROUP=10001
export EXHIBITS_GROUP_NAME=syperm-exhibits
export NGINX_USER=www-data
export STUDIO_USER=studio
export SET_CONTENT_ACL=1

bash /repo/scripts/fix-exhibits-permissions.sh

mode_file="$(stat -c '%a' "$EX/_server/studio-server.mjs")"
mode_cfg="$(stat -c '%a' "$EX/craft-001/config.json")"
mode_dir="$(stat -c '%a' "$EX/_server")"
[ "$mode_file" = "644" ] || { echo "FAIL: _server file mode=$mode_file"; exit 1; }
[ "$mode_cfg" = "664" ] || { echo "FAIL: craft config mode=$mode_cfg"; exit 1; }
[ "$mode_dir" = "755" ] || { echo "FAIL: _server dir mode=$mode_dir"; exit 1; }

runuser -u studio -- test -w "$EX/craft-001/config.json"
runuser -u studio -- test ! -w "$EX/_server/studio-server.mjs"

NEST="$EX/craft-001/nested-acl-test"
mkdir "$NEST"
printf 'probe\n' >"$NEST/file.txt"
chmod 640 "$NEST/file.txt"
runuser -u www-data -- test -x "$NEST" || { echo "FAIL: www-data cannot traverse new subdir (default ACL missing x)"; exit 1; }
runuser -u www-data -- test -r "$NEST/file.txt" || { echo "FAIL: www-data cannot read file in new subdir"; exit 1; }

rm -rf "$TMP"
echo "fix-exhibits-permissions.integration: OK"
