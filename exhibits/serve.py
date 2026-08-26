#!/usr/bin/env python3
"""
exhibits 本地工作台服务（纯 Python 标准库，与 studio-server.mjs 等价）

  python serve.py [port]

环境变量（可选）:
  PORT, STUDIO_USER, STUDIO_PASS

提供：静态托管 + /studio-api/list + /studio-api/save + player.html 注入 __SAVE_API__
"""
from __future__ import annotations

import base64
import hashlib
import json
import errno
import os
import re
import shutil
import sys
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
NO_STORE = 'no-store, no-cache, must-revalidate'
DEFAULT_PORT = 8888  # 固定工作台端口；避开 Win/Hyper-V 常见保留段 8100-8699、8901-9000

# 与 studio-port.mjs 保持同一张表：任何写死的端口都可能在某台 Windows 上被
# Hyper-V/WSL/Docker 划进动态排除段，几档跨不同段位才不会一锅端。
# 两份实现的候选表由 scripts/check-studio-port.js 校验一致。
PORT_CANDIDATES = (8888, 8010, 7788, 9310, 8200)
PORT_FILE_REL = '_runtime/studio-port.txt'


def fallback_enabled() -> bool:
    """默认不回退：服务器上端口必须确定，绑不上要响亮地失败。"""
    return os.environ.get('STUDIO_PORT_FALLBACK') == '1'


def port_attempts(preferred, fallback: bool):
    try:
        first = int(preferred)
    except (TypeError, ValueError):
        first = PORT_CANDIDATES[0]
    if not (1 <= first <= 65535):
        first = PORT_CANDIDATES[0]
    if not fallback:
        return [first]
    out = [first]
    for p in PORT_CANDIDATES:
        if p not in out:
            out.append(p)
    return out


def is_port_unavailable(err: BaseException) -> bool:
    """只有「端口被占/被拒」才值得换一个再试，其它错误直接暴露。"""
    if isinstance(err, PermissionError):
        return True
    return getattr(err, 'errno', None) in (errno.EADDRINUSE, errno.EACCES) or getattr(err, 'winerror', None) == 10013


def write_port_file(root: Path, port: int) -> None:
    """记下实际端口供启动器读取；写不进去不影响服务运行。"""
    try:
        f = root / PORT_FILE_REL
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(str(port), encoding='utf-8')
    except OSError:
        pass


def remove_port_file(root: Path) -> None:
    try:
        (root / PORT_FILE_REL).unlink(missing_ok=True)
    except OSError:
        pass

PORT = int(os.environ.get('PORT') or (sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PORT))
USER = os.environ.get('STUDIO_USER', 'admin')
PASS = os.environ.get('STUDIO_PASS', '')
SAFE = re.compile(r'^[A-Za-z0-9_-]+$')
BAK_KEEP = 20


def normalize_root(root: Path) -> str:
    s = str(root.resolve()).replace('\\', '/')
    if os.name == 'nt':
        s = s.lower()
    return s


def compute_root_hash(root: Path) -> str:
    return hashlib.sha256(normalize_root(root).encode()).hexdigest()[:32]


def identity_payload(root: Path) -> dict:
    h = compute_root_hash(root)
    return {'rootHash': h, 'instanceId': h}


from pano_check import asset_fingerprint, has_asset_file, list_panorama_candidates, check_panorama_path_availability

ROOT_HASH = compute_root_hash(ROOT)

MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
}


def list_exhibits():
    out = []
    for d in sorted(ROOT.iterdir()):
        if not d.is_dir() or d.name.startswith('_') or d.name.startswith('.'):
            continue
        cp = d / 'config.json'
        if not cp.is_file():
            continue
        try:
            c = json.loads(cp.read_text(encoding='utf-8'))
            zh = (c.get('i18n') or {}).get('zh') or {}
            assets = c.get('assets') or {}
            st = cp.stat()
            out.append({
                'dir': d.name,
                'title': zh.get('title') or d.name,
                'subtitle': zh.get('subtitle') or '',
                'hotspots': len(c.get('hotspots') or []),
                'audio': len(c.get('audio') or []),
                'hasPano': has_asset_file(d, assets.get('panorama'), ROOT),
                'usesPanorama': (c.get('environment') or {}).get('mode') == 'panorama' and has_asset_file(d, assets.get('panorama'), ROOT),
                'envMode': (c.get('environment') or {}).get('mode') or '',
                # 背景分组只能按内容判断：路径既会误并（各展品自带的 assets/panorama.jpg
                # 其实是不同的图）也会误分（同一张图复制进多个目录）
                'panoramaHash': asset_fingerprint(d, assets.get('panorama'), ROOT),
                # 工作台按这两项做「分组 / 待完善」筛选：模型是否真在盘上、当前用的是哪套背景
                'hasModel': has_asset_file(d, assets.get('model'), ROOT),
                'panorama': assets.get('panorama') or '',
                'envPreset': (c.get('environment') or {}).get('preset') or 'room',
                'poster': f"{d.name}/{assets.get('poster')}" if assets.get('poster') else '',
                'mtime': int(st.st_mtime * 1000),
            })
        except Exception as e:
            out.append({'dir': d.name, 'title': d.name, 'error': str(e)})
    out.sort(key=lambda x: x.get('mtime') or 0, reverse=True)
    return out


def save_config(ex: str, config: dict, poster: str | None):
    if not SAFE.match(ex):
        raise ValueError('非法展品目录')
    dir_path = ROOT / ex
    cfg_path = dir_path / 'config.json'
    if not dir_path.is_dir():
        raise ValueError('展品目录不存在：' + ex)
    if not config or not isinstance(config, dict) or not (config.get('assets') or {}).get('model'):
        raise ValueError('配置无效（缺 assets.model）')
    bak_dir = dir_path / '.bak'
    bak_dir.mkdir(parents=True, exist_ok=True)
    if cfg_path.is_file():
        shutil.copy2(cfg_path, bak_dir / f"config.{int(time.time() * 1000)}.json")
    baks = sorted(bak_dir.glob('config.*.json'))
    while len(baks) > BAK_KEEP:
        baks.pop(0).unlink(missing_ok=True)
    if isinstance(poster, str) and poster.startswith('data:image'):
        assets = dir_path / 'assets'
        assets.mkdir(parents=True, exist_ok=True)
        b64 = poster.split(',', 1)[1]
        (assets / 'poster.jpg').write_bytes(base64.b64decode(b64))
        config.setdefault('assets', {})['poster'] = 'assets/poster.jpg'
    cfg_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, **MIME}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        if args and isinstance(args[0], str) and args[0].startswith('GET /vendor/'):
            return
        super().log_message(fmt, *args)

    def _is_localhost(self) -> bool:
        addr = self.client_address[0] if self.client_address else ''
        return addr in ('127.0.0.1', '::1')

    def _authed(self) -> bool:
        if not PASS:
            if os.environ.get('STUDIO_ALLOW_INSECURE') == '1':
                return True
            self._json(503, {
                'error': 'STUDIO_PASS 未配置',
                'hint': '请设置 STUDIO_PASS 或 STUDIO_ALLOW_INSECURE=1（仅本地）',
            })
            return False
        auth = self.headers.get('Authorization', '')
        if not auth.startswith('Basic '):
            self.send_response(401)
            self.send_header('WWW-Authenticate', 'Basic realm="3D Studio", charset="UTF-8"')
            self.end_headers()
            self.wfile.write('需要登录'.encode('utf-8'))
            return False
        try:
            u, p = base64.b64decode(auth[6:]).decode('utf-8', 'replace').split(':', 1)
        except Exception:
            u, p = '', ''
        if u == USER and p == PASS:
            return True
        self.send_response(401)
        self.send_header('WWW-Authenticate', 'Basic realm="3D Studio", charset="UTF-8"')
        self.end_headers()
        self.wfile.write('需要登录'.encode('utf-8'))
        return False

    def _json(self, code: int, obj):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', NO_STORE)
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _path(self) -> str:
        return unquote(urlparse(self.path).path)

    def do_GET(self):
        p = self._path()
        if p.startswith('/studio-api/identity'):
            if self._is_localhost() or self._authed():
                return self._json(200, identity_payload(ROOT))
            return
        if not self._authed():
            return
        if p.startswith('/studio-api/list'):
            try:
                return self._json(200, {
                    'exhibits': list_exhibits(),
                    'panoramas': list_panorama_candidates(ROOT),
                    'capabilities': {'save': True, 'create': True, 'batch': True},
                })
            except Exception as e:
                return self._json(500, {'error': str(e)})
        if p.startswith('/studio-api/check-panorama'):
            try:
                q = urlparse(self.path).query
                from urllib.parse import parse_qs
                path = (parse_qs(q).get('path') or [''])[0]
                availability = check_panorama_path_availability(path, ROOT)
                return self._json(200, {'availability': availability, 'exists': availability is True})
            except Exception as e:
                return self._json(500, {'error': str(e)})
        rel = p.lstrip('/') or 'studio.html'
        if rel.endswith('/'):
            rel += 'index.html'
        full = (ROOT / rel).resolve()
        if not str(full).startswith(str(ROOT.resolve())):
            self.send_error(403)
            return
        if not full.is_file():
            self.send_error(404, f'Not Found: {rel}')
            return
        data = full.read_bytes()
        ctype = MIME.get(full.suffix.lower(), 'application/octet-stream')
        if full.name == 'player.html':
            text = data.decode('utf-8').replace(
                '</head>',
                '<script>window.__SAVE_API__="/studio-api/save"</script>\n</head>',
                1,
            )
            data = text.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        if full.suffix.lower() == '.json':
            self.send_header('Cache-Control', NO_STORE)
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if not self._authed():
            return
        p = self._path()
        length = int(self.headers.get('Content-Length') or 0)
        if p.startswith('/studio-api/create'):
            if length > 1_000_000:
                self.send_error(413)
                return
            raw = self.rfile.read(length)
            try:
                from exhibit_create import create_exhibit
                payload = json.loads(raw.decode('utf-8'))
                created = create_exhibit(ROOT, payload.get('dir', ''), payload.get('title', ''), payload.get('subtitle') or '')
                self._json(200, {'ok': True, **created})
            except Exception as e:
                self._json(400, {'ok': False, 'error': str(e)})
            return
        if not p.startswith('/studio-api/save'):
            self.send_error(404)
            return
        if length > 5_000_000:
            self.send_error(413)
            return
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode('utf-8'))
            save_config(payload.get('ex', ''), payload.get('config'), payload.get('poster'))
            self._json(200, {'ok': True})
        except Exception as e:
            self._json(400, {'ok': False, 'error': str(e)})


def _bind_error_hint(port: int, err: BaseException) -> None:
    winerr = getattr(err, 'winerror', None)
    print('ERROR: 无法绑定端口 %s — %s' % (port, err), file=sys.stderr)
    if os.name == 'nt' and winerr == 10013:
        print('  Windows 可能已将此端口列入系统保留段（Hyper-V/WSL/Docker 常见）。', file=sys.stderr)
        print('  请右键管理员运行：_dev\\释放系统保留端口.bat', file=sys.stderr)
        print('  查看保留段：netsh interface ipv4 show excludedportrange protocol=tcp', file=sys.stderr)
        return


if __name__ == '__main__':
    if not PASS:
        if os.environ.get('STUDIO_ALLOW_INSECURE') == '1':
            print('WARN: STUDIO_PASS not set; STUDIO_ALLOW_INSECURE=1 — no auth, local use only')
        else:
            print('ERROR: STUDIO_PASS not set. Set STUDIO_PASS or STUDIO_ALLOW_INSECURE=1 for local dev.', file=sys.stderr)
            raise SystemExit(1)
    bind_host = '127.0.0.1' if (not PASS and os.environ.get('STUDIO_ALLOW_INSECURE') == '1') else ''
    attempts = port_attempts(PORT, fallback_enabled())
    last_err = None
    for i, port in enumerate(attempts):
        try:
            with HTTPServer((bind_host, port), Handler) as httpd:
                host_label = bind_host or '0.0.0.0'
                write_port_file(ROOT, port)
                print('Exhibits server: http://127.0.0.1:%s/studio.html  %s  (bind %s)' % (
                    port, '(auth on)' if PASS else '(insecure local)', host_label))
                print('  rootHash: %s' % ROOT_HASH)
                try:
                    httpd.serve_forever()
                finally:
                    remove_port_file(ROOT)
            raise SystemExit(0)
        except (PermissionError, OSError) as e:
            last_err = e
            if is_port_unavailable(e) and i + 1 < len(attempts):
                print('  port %s unavailable (%s), trying %s' % (port, getattr(e, 'errno', '?'), attempts[i + 1]),
                      file=sys.stderr)
                continue
            _bind_error_hint(port, e)
            raise SystemExit(1)
    _bind_error_hint(attempts[-1], last_err)
    raise SystemExit(1)
