#!/usr/bin/env python3
"""Create exhibit from _template (Python CLI for portable installs)."""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from exhibit_create import create_exhibit, suggest_next_exhibit_dir  # noqa: E402


def main() -> int:
    args = sys.argv[1:]
    try:
        suggested = suggest_next_exhibit_dir(ROOT)
        default_num = suggested.replace('craft-', '', 1)
    except ValueError:
        default_num = ''
    dir_name = args[0] if args else input(
        f'展品编号（如 005 或 craft-005） [{default_num}]: '
    ).strip() or default_num
    title = args[1] if len(args) > 1 else input('展品名称（左上角显示）: ').strip()
    subtitle = args[2] if len(args) > 2 else ''
    try:
        result = create_exhibit(ROOT, dir_name, title, subtitle)
    except Exception as e:
        print(f'[ERROR] {e}', file=sys.stderr)
        return 1
    print('')
    print('[OK] 已创建', result['dir'])
    print('  名称:', result['title'])
    print('  目录:', ROOT / result['dir'])
    print('')
    print('下一步：')
    print('  1. 把 model.glb、panorama.jpg 放入', result['dir'] + '/assets')
    print('  2. 刷新工作台 → 点「编辑」→ 调相机/热点 → 保存')
    print('')
    if os.name == 'nt':
        subprocess.Popen(['explorer', str(ROOT / result['assetsDir'])])
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
