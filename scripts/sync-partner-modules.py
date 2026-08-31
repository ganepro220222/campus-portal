#!/usr/bin/env python3
"""Sync partner-facing local folders from exhibits/ (not committed to Git).

  编辑器模块/   ← exhibits minus 模型转换 & dev-only paths (local 3D editor)
  模型转换模块/ ← exhibits/模型转换 only (OBJ→GLB)

Run from repo root:
  python scripts/sync-partner-modules.py
  python scripts/sync-partner-modules.py --zip   # also refresh *.zip at repo root
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import zipfile
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
EXHIBITS = REPO / 'exhibits'
EDITOR_OUT = REPO / '编辑器模块'
CONVERT_OUT = REPO / '模型转换模块'

# Reuse pack-delivery inclusion rules for the editor tree
sys.path.insert(0, str(EXHIBITS))
from importlib.util import spec_from_file_location, module_from_spec

_spec = spec_from_file_location('pack_delivery', EXHIBITS / 'pack-delivery.py')
_pack = module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(_pack)

EDITOR_EXTRA_EXCLUDE_PREFIXES = (
    '模型转换/',
    'deploy-test-server/',
    'player.deploy.html',
)

CONVERT_EXCLUDE_PREFIXES = _pack.EXCLUDE_REL_PREFIXES + (
    '__pycache__/',
)

CONVERT_EXCLUDE_FILES = frozenset({
    'tool.spec',
})


def editor_should_include(path: Path) -> bool:
    if not _pack.should_include(path):
        return False
    rel = path.relative_to(EXHIBITS).as_posix()
    if rel.startswith(EDITOR_EXTRA_EXCLUDE_PREFIXES):
        return False
    if rel in EDITOR_EXTRA_EXCLUDE_PREFIXES:
        return False
    return True


def convert_should_include(path: Path) -> bool:
    rel = path.relative_to(EXHIBITS / '模型转换').as_posix()
    if not rel:
        return False
    if path.name in CONVERT_EXCLUDE_FILES:
        return False
    if any(part in {'.pytest_cache', '__pycache__', '.mypy_cache'} for part in path.parts):
        return False
    if any(rel.startswith(p.rstrip('/')) for p in CONVERT_EXCLUDE_PREFIXES if p.endswith('/')):
        return False
    if rel.endswith('.pyc') or rel.endswith('.test.py'):
        return False
    return True


def rimraf_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)


def copy_tree(src_root: Path, dst_root: Path, should_include) -> int:
    rimraf_dir(dst_root)
    dst_root.mkdir(parents=True, exist_ok=True)
    n = 0
    for path in sorted(src_root.rglob('*')):
        if not path.is_file() or not should_include(path):
            continue
        rel = path.relative_to(src_root)
        out = dst_root / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        if path.suffix.lower() == '.bat':
            text = path.read_text(encoding='utf-8-sig').replace('\r\n', '\n').replace('\r', '\n')
            out.write_bytes(text.replace('\n', '\r\n').encode('utf-8'))
        else:
            shutil.copy2(path, out)
        n += 1
    return n


def write_editor_readme() -> None:
    text = f"""立体鉴赏 · 编辑器模块（本地）
同步日期：{date.today().isoformat()}

【用途】在 Windows 上编辑展品 config、热点、灯光；保存后通过 FileBrowser 上传到服务器。

【首次】
  1. 双击「安装便携环境.bat」（需联网，约 12MB）
  2. 双击「打开工作台.bat」→ http://127.0.0.1:8888/studio.html

【上传】
  服务器 FileBrowser：http://47.109.0.192/fm/
  上传整个 craft-XXX/ 文件夹（与 craft-001 同级）

【不含】模型转换器 → 请使用同级的「模型转换模块」文件夹。

详细说明见「使用说明.txt」
"""
    (EDITOR_OUT / '拷贝说明.txt').write_text(text, encoding='utf-8')


def write_convert_readme() -> None:
    text = f"""OBJ → GLB · 模型转换模块
同步日期：{date.today().isoformat()}

【用途】将 OBJ+MTL+贴图转为自包含 GLB，再放入编辑器模块的 craft-XXX/assets/

【图形界面】需完整 Python 3.12+（含 tkinter）→ 双击「打开转换器.bat」
【命令行】可用 exhibits 便携 Python → 「转换模型.bat」

说明见「使用说明.md」
"""
    (CONVERT_OUT / '拷贝说明.txt').write_text(text, encoding='utf-8')


def zip_dir(src: Path, zip_path: Path) -> None:
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for path in sorted(src.rglob('*')):
            if path.is_file():
                zf.write(path, path.relative_to(src).as_posix())
    mb = zip_path.stat().st_size / (1024 * 1024)
    print(f'  zip  {zip_path.name}  ({mb:.2f} MiB)')


def run_build_viewer() -> None:
    print('build-viewer.mjs …')
    r = subprocess.run(
        ['node', 'build-viewer.mjs'],
        cwd=EXHIBITS,
        check=False,
    )
    if r.returncode != 0:
        raise SystemExit('build-viewer.mjs failed — fix before syncing partner modules')


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--zip', action='store_true', help='also write 编辑器模块.zip / 模型转换模块.zip')
    ap.add_argument('--skip-build', action='store_true', help='skip node build-viewer.mjs')
    args = ap.parse_args()

    if not args.skip_build:
        run_build_viewer()

    ed_n = copy_tree(EXHIBITS, EDITOR_OUT, editor_should_include)
    write_editor_readme()
    print(f'编辑器模块/  {ed_n + 1} files')

    cv_n = copy_tree(EXHIBITS / '模型转换', CONVERT_OUT, convert_should_include)
    write_convert_readme()
    print(f'模型转换模块/  {cv_n + 1} files')

    if args.zip:
        zip_dir(EDITOR_OUT, REPO / '编辑器模块.zip')
        zip_dir(CONVERT_OUT, REPO / '模型转换模块.zip')

    print('OK')


if __name__ == '__main__':
    main()
