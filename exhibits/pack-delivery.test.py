"""Verify pack-delivery.py output (writes to temp dir via PACK_OUT)."""
from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main() -> int:
    with tempfile.TemporaryDirectory(prefix='exhibits-pack-') as td:
        out = Path(td) / 'test.zip'
        env = os.environ.copy()
        env['PACK_OUT'] = str(out)
        r = subprocess.run([sys.executable, str(ROOT / 'pack-delivery.py')], cwd=ROOT, env=env, capture_output=True, text=True)
        if r.returncode != 0:
            print(r.stdout, r.stderr)
            raise RuntimeError('pack-delivery failed')
        if not out.is_file():
            raise RuntimeError('zip not created')

        with zipfile.ZipFile(out) as zf:
            names = set(zf.namelist())
            for required in ('serve.py', 'exhibit_create.py', '拷贝说明.txt', '_launch/start-server.bat', 'studio.html'):
                if required not in names:
                    raise RuntimeError(f'missing {required} in zip')
            for forbidden in ('node_modules/', 'e2e/'):
                if any(n.startswith(forbidden) for n in names):
                    raise RuntimeError(f'forbidden prefix {forbidden}')
            bats = [n for n in names if n.endswith('.bat')]
            for n in bats:
                data = zf.read(n)
                lf = data.count(b'\n') - data.count(b'\r\n')
                if lf:
                    raise RuntimeError(f'{n} has LF-only lines in zip')

    print('ok pack-delivery zip contents')
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as e:
        print('FAIL', e)
        raise SystemExit(1)
