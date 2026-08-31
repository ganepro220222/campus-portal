#!/usr/bin/env bash
# 在 ECS 上应用已上传的编辑器文件（不访问 GitHub）
# 用法：先把编辑器文件放到 exhibits/，再：
#   bash scripts/apply-staging-editor.sh
#
# staging Nginx 通常把编辑器反代到 /studio/（不是 /exhibits/），可用：
#   STUDIO_HTTP_PREFIX=/studio  bash scripts/apply-staging-editor.sh
#
# 若设置了 STUDIO_PASS，会用 Basic Auth 拉取页面正文并校验 marker / JSON。
# 正式验收须设置 STUDIO_PASS；仅测 auth 时可设 ALLOW_AUTH_ONLY_PROBE=1。

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EX="$ROOT/exhibits"
PLAYER="$EX/player.html"
STUDIO_PREFIX="${STUDIO_HTTP_PREFIX:-/studio}"
PUBLIC_HOST="${STUDIO_PUBLIC_HOST:-api.yunmanvr.com}"
STUDIO_USER="${STUDIO_USER:-admin}"
STUDIO_PASS="${STUDIO_PASS:-}"
PROBE_ORIGIN="${STUDIO_PROBE_ORIGIN:-http://127.0.0.1}"
PROBE_FAIL=0
STUDIO_HTML_OK=0
PLAYER_HTML_OK=0
API_OK=0

# 本机 HTTP 常 301 到 https://api.yunmanvr.com；curl -L 跨主机会丢掉 Authorization → 假 401。
CURL_COMMON=()
CURL_AUTH=()
if [ -n "$STUDIO_PASS" ]; then
  CURL_AUTH=(-u "${STUDIO_USER}:${STUDIO_PASS}")
elif [ "${ALLOW_AUTH_ONLY_PROBE:-0}" != "1" ]; then
  echo "错误: 正式验收须设置 STUDIO_PASS（仅测 Basic Auth 可用 ALLOW_AUTH_ONLY_PROBE=1）" >&2
  exit 1
fi

detect_probe_origin() {
  local loc
  loc="$(curl -sSI --max-redirs 0 "http://127.0.0.1${STUDIO_PREFIX}/studio.html" 2>/dev/null \
    | awk 'BEGIN{IGNORECASE=1} /^Location:/{print $2; exit}' | tr -d '\r')"
  if [[ "${loc}" == https://* ]]; then
    PROBE_ORIGIN="https://127.0.0.1"
    CURL_COMMON=(-k)
    echo "HTTP 被 301 到 ${loc}，探测改用 ${PROBE_ORIGIN}（curl -k，避免跨主机丢掉 Basic Auth）"
  else
    echo "探测源 ${PROBE_ORIGIN}"
  fi
}

echo "=== apply-staging-editor @ $ROOT ==="

for f in player.html studio.html; do
  if [ ! -f "$EX/$f" ]; then
    echo "缺少 $EX/$f — 请先用 scp 或 FileBrowser 上传" >&2
    exit 1
  fi
  echo "OK  exhibits/$f"
done

wait_studio_upstream() {
  local url="$1"
  local timeout="${STUDIO_READY_TIMEOUT:-30}"
  local interval=1 elapsed=0 code=000
  while [ "$elapsed" -lt "$timeout" ]; do
    code="$(curl -sS "${CURL_COMMON[@]}" -o /dev/null -w '%{http_code}' "${CURL_AUTH[@]}" "$url" 2>/dev/null || echo "000")"
    case "$code" in
      200|401)
        echo "studio 上游就绪（${url} → HTTP/${code}，${elapsed}s）"
        return 0
        ;;
    esac
    sleep "$interval"
    elapsed=$((elapsed + interval))
  done
  echo "警告: studio 上游 ${timeout}s 内未就绪（${url} 最后 HTTP/${code}）" >&2
  return 1
}

if systemctl is-active --quiet studio-server 2>/dev/null; then
  echo "studio-server 运行中：__SAVE_API__ 由服务响应时注入，跳过磁盘 sed"
  echo ""
  echo "=== 等待 studio 上游就绪（避免 restart 后立即探测 502）==="
  detect_probe_origin
  wait_studio_upstream "${PROBE_ORIGIN}/studio-api/list" || true
else
  bash "$ROOT/scripts/staging-save-api.sh" "$PLAYER"
fi
if grep -q '`n' "$PLAYER" 2>/dev/null; then
  echo "警告: player.html 含损坏注入（旧 push 脚本遗留 \`n），请从本机重新 scp exhibits/player.html" >&2
fi

if command -v node >/dev/null 2>&1; then
  echo ""
  echo "=== 静态依赖校验 ==="
  (cd "$EX" && node check-static-deps.mjs)
else
  echo "警告: 未找到 node，跳过 check-static-deps" >&2
fi

probe_optional() {
  local url="$1"
  local line code
  line="$(curl -sI "${CURL_COMMON[@]}" "$url" 2>/dev/null | head -1 || true)"
  code="$(echo "$line" | awk '{print $2}')"
  printf '%-55s ' "$url"
  echo "${line:-curl failed}"
}

# 跟随重定向，最终须 200（有凭据时可验正文）或 401（无凭据）；301/302 不算成功
probe_html_required() {
  local url="$1" expect_path="$2" marker="$3"
  local tmp code effective
  tmp="$(mktemp)"
  code="$(curl -sS "${CURL_COMMON[@]}" -L --max-redirs 5 "${CURL_AUTH[@]}" -o "$tmp" -w '%{http_code}' "$url" 2>/dev/null || echo "000")"
  effective="$(curl -sS "${CURL_COMMON[@]}" -L --max-redirs 5 "${CURL_AUTH[@]}" -o /dev/null -w '%{url_effective}' "$url" 2>/dev/null || true)"
  printf '%-55s ' "$url"
  if [[ "$effective" != *"$expect_path"* ]]; then
    echo "FAIL redirect→${effective:-unknown} (expected *${expect_path}*)"
    PROBE_FAIL=1
    rm -f "$tmp"
    return 1
  fi
  case "$code" in
    200)
      if grep -qF "$marker" "$tmp" 2>/dev/null; then
        echo "OK  HTTP/1.1 200 marker"
        rm -f "$tmp"
        return 0
      fi
      echo "FAIL HTTP/1.1 200 missing marker"
      PROBE_FAIL=1
      rm -f "$tmp"
      return 1
      ;;
    401)
      if [ -n "$STUDIO_PASS" ]; then
        echo "FAIL HTTP/1.1 401 (STUDIO_PASS 可能被拒)"
        PROBE_FAIL=1
        rm -f "$tmp"
        return 1
      fi
      echo "WARN HTTP/1.1 401 auth-only (未验证 marker)"
      rm -f "$tmp"
      return 0
      ;;
    *)
      echo "FAIL HTTP/${code} (301/302 须跟随到 200/401，不可直接视为成功)"
      PROBE_FAIL=1
      rm -f "$tmp"
      return 1
      ;;
  esac
}

probe_api_list_required() {
  local url="$1"
  local body code
  body="$(curl -sS "${CURL_COMMON[@]}" -L --max-redirs 5 "${CURL_AUTH[@]}" -w '\n%{http_code}' "$url" 2>/dev/null || printf '\n000')"
  code="${body##*$'\n'}"
  body="${body%$'\n'*}"
  printf '%-55s ' "$url"
  case "$code" in
    200)
      if printf '%s' "$body" | python3 -c 'import json,sys; d=json.load(sys.stdin); assert isinstance(d.get("exhibits"), list)' 2>/dev/null; then
        echo "OK  HTTP/1.1 200 JSON exhibits[]"
        return 0
      fi
      echo "FAIL HTTP/1.1 200 but body is not studio-api JSON"
      PROBE_FAIL=1
      return 1
      ;;
    401)
      if [ -n "$STUDIO_PASS" ]; then
        echo "FAIL HTTP/1.1 401 (STUDIO_PASS 可能被拒)"
        PROBE_FAIL=1
        return 1
      fi
      echo "WARN HTTP/1.1 401 auth-only (未验证 JSON)"
      return 0
      ;;
    *)
      echo "FAIL HTTP/${code}"
      PROBE_FAIL=1
      return 1
      ;;
  esac
}

probe_api_list_requires_unauth() {
  local url="$1" code
  code="$(curl -sS "${CURL_COMMON[@]}" -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo "000")"
  printf '%-55s ' "(no auth) $url"
  if [ -n "$STUDIO_PASS" ]; then
    case "$code" in
      401|403)
        echo "OK  HTTP/1.1 ${code} blocked without credentials"
        return 0
        ;;
      *)
        echo "FAIL HTTP/${code} (未带凭据应 401/403，表示接口可能未鉴权)"
        PROBE_FAIL=1
        return 1
        ;;
    esac
  fi
  echo "SKIP (未设 STUDIO_PASS)"
  return 0
}

probe_module_required() {
  local url="$1" name="$2"
  local code
  code="$(curl -sS "${CURL_COMMON[@]}" -L "${CURL_AUTH[@]}" -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo "000")"
  printf '%-55s ' "$url"
  case "$code" in
    200)
      echo "OK  HTTP/1.1 200 module (${name})"
      return 0
      ;;
    401)
      if [ -n "$STUDIO_PASS" ]; then
        echo "FAIL HTTP/401 (${name} 须 200；STUDIO_PASS 可能被拒)"
        PROBE_FAIL=1
        return 1
      fi
      echo "WARN HTTP/1.1 401 auth-only (未验证 ${name})"
      return 0
      ;;
    *)
      echo "FAIL HTTP/${code} (${name} 须 200；若 404 检查 Nginx location ^~ /studio/ 与 proxy_pass 尾斜杠)"
      PROBE_FAIL=1
      return 1
      ;;
  esac
}

if ! systemctl is-active --quiet studio-server 2>/dev/null; then
  detect_probe_origin
fi

echo ""
echo "=== HTTP 探测（本机 Nginx，编辑器入口 ${STUDIO_PREFIX}/，源 ${PROBE_ORIGIN}）==="
if [ -n "$STUDIO_PASS" ]; then
  echo "使用 STUDIO_USER/STUDIO_PASS 进行完整验收（marker + JSON）"
elif [ "${ALLOW_AUTH_ONLY_PROBE:-0}" = "1" ]; then
  echo "ALLOW_AUTH_ONLY_PROBE=1：仅验证 401，不验证页面内容与 API JSON"
fi
probe_html_required "${PROBE_ORIGIN}${STUDIO_PREFIX}/studio.html" "${STUDIO_PREFIX}/studio.html" "3D 鉴赏工作台" && STUDIO_HTML_OK=1 || true
probe_module_required "${PROBE_ORIGIN}${STUDIO_PREFIX}/light-rig.mjs" "light-rig" || true
probe_html_required "${PROBE_ORIGIN}${STUDIO_PREFIX}/player.html" "${STUDIO_PREFIX}/player.html" "window.__SY_PLAYER" && PLAYER_HTML_OK=1 || true
probe_api_list_required "${PROBE_ORIGIN}/studio-api/list" && API_OK=1 || true
probe_api_list_requires_unauth "${PROBE_ORIGIN}/studio-api/list" || true
echo ""
echo "=== 参考（/exhibits/ 未配置 alias 时 404 属正常）==="
probe_optional "${PROBE_ORIGIN}/exhibits/studio.html"
probe_optional "${PROBE_ORIGIN}/exhibits/studio-api/list"

echo ""
if [ "$PROBE_FAIL" -ne 0 ]; then
  echo "编辑器 HTTP 探测失败（studio/player/API 均须 OK）" >&2
  echo "  studio.html: $([ "$STUDIO_HTML_OK" -eq 1 ] && echo OK || echo FAIL)" >&2
  echo "  player.html: $([ "$PLAYER_HTML_OK" -eq 1 ] && echo OK || echo FAIL)" >&2
  echo "  studio-api:  $([ "$API_OK" -eq 1 ] && echo OK || echo FAIL)" >&2
  exit 1
fi

if [ -z "$STUDIO_PASS" ] && [ "${ALLOW_AUTH_ONLY_PROBE:-0}" = "1" ]; then
  echo "警告: 仅完成 auth 探测，未验证 marker 与 API JSON（退出码 2）" >&2
  exit 2
fi

echo "外网：https://${PUBLIC_HOST}${STUDIO_PREFIX}/studio.html"
