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
import json
import os
import re
import shutil
import sys
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get('PORT') or (sys.argv[1] if len(sys.argv) > 1 else 8199))
USER = os.environ.get('STUDIO_USER', 'admin')
PASS = os.environ.get('STUDIO_PASS', '')
SAFE = re.compile(r'^[A-Za-z0-9_-]+$')
BAK_KEEP = 20

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
            st = cp.stat()
            out.append({
                'dir': d.name,
                'title': zh.get('title') or d.name,
                'subtitle': zh.get('subtitle') or '',
                'hotspots': len(c.get('hotspots') or []),
                'audio': len(c.get('audio') or []),
                'hasPano': bool((c.get('assets') or {}).get('panorama')),
                'poster': f"{d.name}/{(c.get('assets') or {}).get('poster')}" if (c.get('assets') or {}).get('poster') else '',
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

    def _authed(self) -> bool:
        if not PASS:
            return True
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
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _path(self) -> str:
        return unquote(urlparse(self.path).path)

    def do_GET(self):
        if not self._authed():
            return
        p = self._path()
        if p.startswith('/studio-api/list'):
            try:
                return self._json(200, {'exhibits': list_exhibits()})
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
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if not self._authed():
            return
        p = self._path()
        if not p.startswith('/studio-api/save'):
            self.send_error(404)
            return
        length = int(self.headers.get('Content-Length') or 0)
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


if __name__ == '__main__':
    if not PASS:
        print('WARN: STUDIO_PASS not set - no auth, local use only')
    with HTTPServer(('', PORT), Handler) as httpd:
        print('Exhibits server: http://127.0.0.1:%s/studio.html  %s' % (
            PORT, '(auth on)' if PASS else '(no auth, local only)'))
        httpd.serve_forever()
