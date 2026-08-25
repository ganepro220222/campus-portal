#!/usr/bin/env python3
"""Verify localhost:PORT serves this exhibits root. Exit 0=match, 4=mismatch/foreign."""
from __future__ import annotations

import base64
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path


def normalize_root(root: Path) -> str:
    s = str(root.resolve()).replace('\\', '/')
    if os.name == 'nt':
        s = s.lower()
    return s


def compute_root_hash(root: Path) -> str:
    return hashlib.sha256(normalize_root(root).encode()).hexdigest()[:32]


def main() -> int:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8888
    root = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent
    url = f'http://127.0.0.1:{port}/studio-api/identity'
    headers = {'Cache-Control': 'no-store'}
    passwd = os.environ.get('STUDIO_PASS', '')
    if passwd:
        user = os.environ.get('STUDIO_USER', 'admin')
        cred = base64.b64encode(f'{user}:{passwd}'.encode()).decode()
        headers['Authorization'] = f'Basic {cred}'
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f'[ERROR] 端口 {port} 上的服务不是 3D 工作台（identity HTTP {e.code}）', file=sys.stderr)
        return 4
    except OSError as e:
        print(f'[ERROR] 无法连接 http://127.0.0.1:{port} — {e}', file=sys.stderr)
        return 4
    except json.JSONDecodeError:
        print(f'[ERROR] 端口 {port} 响应不是有效的工作台 identity JSON', file=sys.stderr)
        return 4

    remote = body.get('rootHash') or body.get('instanceId')
    local = compute_root_hash(root)
    if not remote or local != remote:
        print('', file=sys.stderr)
        print(f'[ERROR] 端口 {port} 已被另一份 exhibits 工作台占用。', file=sys.stderr)
        print(f'  当前目录 rootHash：{local}', file=sys.stderr)
        print(f'  占用端口 rootHash：{remote or "?"}', file=sys.stderr)
        print('', file=sys.stderr)
        print('请先在本目录运行「停止服务.bat」，或关闭占用端口的旧副本，再重新打开工作台。', file=sys.stderr)
        print('也可指定其他端口：打开工作台.bat 8300', file=sys.stderr)
        return 4
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
