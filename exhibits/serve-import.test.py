"""Integration smoke: serve.py list/create with portable or system Python."""
from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PY = ROOT / '_runtime' / 'python' / 'python.exe'
EX = 'craft-99887'


def free_port() -> int:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    return port


def wait_http(url: str, timeout: float = 15.0) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=1) as r:
                if r.status == 200:
                    return
        except (urllib.error.URLError, TimeoutError):
            time.sleep(0.1)
    raise RuntimeError(f'timeout waiting for {url}')


def pick_python() -> list[str]:
    if PY.is_file():
        return [str(PY)]
    return [sys.executable]


def main() -> int:
    ex_dir = ROOT / EX
    shutil.rmtree(ex_dir, ignore_errors=True)
    port = free_port()
    env = os.environ.copy()
    env['PORT'] = str(port)
    proc = subprocess.Popen(
        pick_python() + [str(ROOT / 'serve.py'), str(port)],
        cwd=ROOT,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
    )
    try:
        wait_http(f'http://127.0.0.1:{port}/studio-api/list')
        body = json.dumps({'dir': EX.replace('craft-', ''), 'title': 'Smoke', 'subtitle': ''}).encode()
        req = urllib.request.Request(
            f'http://127.0.0.1:{port}/studio-api/create',
            data=body,
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        with urllib.request.urlopen(req) as r:
            created = json.loads(r.read().decode())
        if not created.get('ok'):
            raise RuntimeError(f'create failed: {created}')

        with urllib.request.urlopen(f'http://127.0.0.1:{port}/studio-api/list') as r:
            smoke = next(x for x in json.loads(r.read().decode())['exhibits'] if x['dir'] == EX)
        if smoke.get('hasPano') is not False:
            raise RuntimeError(f'expected hasPano false for new exhibit, got {smoke!r}')

        assets = ex_dir / 'assets'
        assets.mkdir(parents=True, exist_ok=True)
        (assets / 'panorama.jpg').write_bytes(b'x')
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/studio-api/list') as r:
            smoke2 = next(x for x in json.loads(r.read().decode())['exhibits'] if x['dir'] == EX)
        if smoke2.get('hasPano') is not True:
            raise RuntimeError(f'expected hasPano true after adding file, got {smoke2!r}')
    finally:
        proc.kill()
        proc.wait(timeout=5)
        shutil.rmtree(ex_dir, ignore_errors=True)

    print('ok serve.py list/create smoke')
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as e:
        print('FAIL', e)
        raise SystemExit(1)
