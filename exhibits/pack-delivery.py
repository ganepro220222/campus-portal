#!/usr/bin/env python3
"""Pack exhibits/ as a portable Windows zip for local editing."""
from __future__ import annotations

import os
import zipfile
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = Path(os.environ.get('PACK_OUT', ROOT / 'exhibits-便携包.zip'))
if not OUT.is_absolute():
    OUT = ROOT / OUT

EXCLUDE_ANY_DIRS = frozenset({
    'node_modules', 'e2e', 'test-results', 'playwright-report', 'blob-report',
    '__pycache__', '_dev', '.venv-build', 'build', 'dist',
})

EXCLUDE_FILES = frozenset({
    '.gitignore', '.gitattributes', '.studio-instance-id',
    'package.json', 'package-lock.json', 'playwright.config.mjs',
    'exhibits-便携包.zip', 'exhibits-交付包.zip', 'exhibits.zip', 'pack-delivery.py',
    'check-static-deps.mjs', 'build-viewer.mjs',
    '_verify_zip.py', '_normalize_bats.py',
})

EXCLUDE_SUFFIXES = ('.test.mjs', '.test.py')

PACK_README = f"""立体鉴赏 · 拷贝说明
打包日期：{date.today().isoformat()}

【解压】
  解压后应能看到：安装便携环境.bat、打开工作台.bat、新建展品.bat、停止服务.bat

【首次使用】
  1. 双击「安装便携环境.bat」（需联网，约 12MB）
  2. 双击「打开工作台.bat」
  3. 编辑完成后双击「停止服务.bat」

【新建展品】
  工作台里点「＋ 新建展品」，或双击「新建展品.bat」
  然后把 model.glb、panorama.jpg 放入 craft-XXX/assets/，刷新即可预览；需改热点/相机时点「编辑」→ 保存

【常见问题】
  · 窗口一闪就关：文件夹名含 (2) 等括号 → 改名为 exhibits2；或运行「诊断.bat」
  · 保存没反应：必须用「打开工作台.bat」启动，不要直接双击 html
  · 端口被占用：先「停止服务.bat」

详细说明见「使用说明.txt」
"""


def should_include(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    parts = rel.parts
    if not parts:
        return False
    if any(part in EXCLUDE_ANY_DIRS for part in parts[:-1]):
        return False
    if any(p.startswith('._creating') for p in parts):
        return False
    if parts[0].startswith('_test'):
        return False
    if path.name in EXCLUDE_FILES:
        return False
    if path.name.endswith(EXCLUDE_SUFFIXES):
        return False
    if path.suffix == '.spec':
        return False
    if '.bak' in parts:
        return False
    rel_posix = rel.as_posix()
    if rel_posix.startswith('_runtime/python') or rel_posix.startswith('_runtime/node'):
        return False
    return True


def read_bytes_for_zip(path: Path) -> bytes:
    raw = path.read_bytes()
    if path.suffix.lower() != '.bat':
        return raw
    text = raw.decode('utf-8-sig').replace('\r\n', '\n').replace('\r', '\n')
    return text.replace('\n', '\r\n').encode('utf-8')


def main() -> None:
    if OUT.exists():
        OUT.unlink()
    files: list[Path] = []
    for path in sorted(ROOT.rglob('*')):
        if path.is_file() and should_include(path):
            files.append(path)

    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for path in files:
            arcname = path.relative_to(ROOT).as_posix()
            zf.writestr(arcname, read_bytes_for_zip(path))
        zf.writestr('拷贝说明.txt', PACK_README.encode('utf-8'))

    size_mb = OUT.stat().st_size / (1024 * 1024)
    print(f'OK  {OUT.name}')
    print(f'    {len(files) + 1} entries, {size_mb:.2f} MiB')
    print('    top-level included:')
    tops = sorted({p.relative_to(ROOT).parts[0] for p in files})
    for name in tops:
        print(f'      - {name}')


if __name__ == '__main__':
    main()
