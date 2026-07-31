"""Regression: embeddable Python must import exhibit_create when serve.py runs."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PY = ROOT / '_runtime' / 'python' / 'python.exe'


def main() -> int:
    if not PY.is_file():
        print('skip: portable python not installed')
        return 0
    code = (
        'import sys\n'
        'from pathlib import Path\n'
        'ROOT = Path(__file__).resolve().parent\n'
        'if str(ROOT) not in sys.path:\n'
        '    sys.path.insert(0, str(ROOT))\n'
        'from exhibit_create import create_exhibit\n'
        'print("ok")\n'
    )
    script = ROOT / '._serve_import_test.py'
    script.write_text(code, encoding='utf-8')
    try:
        r = subprocess.run([str(PY), str(script)], cwd=ROOT, capture_output=True, text=True)
    finally:
        script.unlink(missing_ok=True)
    out = (r.stdout or '') + (r.stderr or '')
    if r.returncode != 0 or 'ok' not in out:
        print('FAIL portable python cannot import exhibit_create')
        print(out)
        return 1
    print('ok serve import path (portable python)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
