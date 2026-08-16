"""Verify pack-delivery.py output (writes to temp dir via PACK_OUT)."""
from __future__ import annotations

import importlib.util
import os
import subprocess
import sys
import tempfile
import re
import zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parent


def _load_packer():
    spec = importlib.util.spec_from_file_location('pack_delivery', ROOT / 'pack-delivery.py')
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


GLB_REQUIRED = (
    '模型转换/转换模型.bat',
    '模型转换/安装转换依赖.bat',
    '模型转换/打开转换器.bat',
    '模型转换/convert_cli.py',
    '模型转换/input_scan.py',
    '模型转换/glb_paths.py',
    '模型转换/glb_utils.py',
    '模型转换/batch_glb.py',
    '模型转换/obj2glb_gui.py',
    '模型转换/python_env.py',
)

# 页面入口：必须在 ZIP 里，缺一个功能就没了。
# 它们的 ES module 依赖不写死在这里——见 iter_page_imports()，从页面源码现推，
# 以后加删模块无需同步维护清单（清单会悄悄过期，这正是要防的事）。
WEB_PAGES = ('studio.html', 'player.html', 'player.view.html')
WEB_REQUIRED = (*WEB_PAGES, 'manifest.json', '_server/studio-server.mjs')

# import 'x' / import a from "x" / importmap 里的 "three": "./vendor/three.module.js"
# script type=module src="./player.bundle.js"
_IMPORT_RE = re.compile(r"""import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]""")
_IMPORTMAP_RE = re.compile(r"""["'](\.{1,2}/[^"']+\.(?:m?js))["']""")
_MODULE_SRC_RE = re.compile(r"""<script\s+type=["']module["']\s+src=["'](\.{1,2}/[^"']+\.js)["']""", re.I)


def iter_page_imports(page: str, text: str):
    """页面里所有相对路径的 module 依赖（含 importmap、bundle script src），换算成 ZIP 内的路径。"""
    base = PurePosixPath(page).parent
    specs = set(_IMPORT_RE.findall(text))
    for block in re.findall(r'<script type="importmap">(.*?)</script>', text, re.S):
        specs |= set(_IMPORTMAP_RE.findall(block))
    for spec in _MODULE_SRC_RE.findall(text):
        specs.add(spec)
    for spec in specs:
        if not spec.startswith(('./', '../')):
            continue
        yield str((base / spec).as_posix()).replace('/./', '/')


def resolve_in_zip(target: str, names: set[str]) -> str | None:
    for cand in (target, target + '.mjs', target + '.js'):
        if cand in names:
            return cand
    return None

FORBIDDEN_PREFIXES = (
    'node_modules/',
    'e2e/',
    '模型转换/.venv-build/',
    '模型转换/build/',
    '模型转换/dist/',
    '__pycache__/',
)

NESTED_BUILD_PATHS = (
    '模型转换/.venv-build/Lib/site-packages/numpy/__init__.py',
    '模型转换/build/OBJ2GLB-Converter/warn.txt',
    '模型转换/dist/OBJ2GLB-Converter.exe',
    '模型转换/tool.spec',
    '模型转换/__pycache__/batch_glb.cpython-311.pyc',
)

KEEP_CRAFT_ASSET_PATHS = (
    'craft-001/assets/build/model.glb',
    'craft-001/assets/dist/model.glb',
    'craft-002/build/panorama.jpg',
)


def test_should_include_excludes_nested_build_artifacts() -> None:
    mod = _load_packer()
    for rel in NESTED_BUILD_PATHS:
        path = mod.ROOT / Path(rel)
        if mod.should_include(path):
            raise RuntimeError(f'should exclude nested build path: {rel}')
    ok_path = mod.ROOT / '模型转换' / 'convert_cli.py'
    if not mod.should_include(ok_path):
        raise RuntimeError('should include 模型转换/convert_cli.py')
    for rel in KEEP_CRAFT_ASSET_PATHS:
        path = mod.ROOT / Path(rel)
        if not mod.should_include(path):
            raise RuntimeError(f'should keep exhibit asset path: {rel}')


def test_pack_delivery_zip() -> None:
    mod = _load_packer()
    with tempfile.TemporaryDirectory(prefix='exhibits-pack-') as td:
        out = Path(td) / 'test.zip'
        env = os.environ.copy()
        env['PACK_OUT'] = str(out)
        r = subprocess.run(
            [sys.executable, str(ROOT / 'pack-delivery.py')],
            cwd=ROOT,
            env=env,
            capture_output=True,
            text=True,
        )
        if r.returncode != 0:
            print(r.stdout, r.stderr)
            raise RuntimeError('pack-delivery failed')
        if not out.is_file():
            raise RuntimeError('zip not created')

        with zipfile.ZipFile(out) as zf:
            names = set(zf.namelist())
            for required in (
                'serve.py', 'exhibit_create.py', 'pano-check.mjs', 'pano_check.py',
                '拷贝说明.txt', '_launch/start-server.bat',
                *WEB_REQUIRED,
                *GLB_REQUIRED,
            ):
                if required not in names:
                    raise RuntimeError(f'missing {required} in zip')
            # 页面的 module 依赖从源码现推，避免清单过期
            for page in WEB_PAGES:
                text = zf.read(page).decode('utf-8')
                deps = list(iter_page_imports(page, text))
                if not deps:
                    raise RuntimeError(f'{page}: 没解析到任何 module 依赖，正则可能失效了')
                for dep in deps:
                    if resolve_in_zip(dep, names) is None:
                        raise RuntimeError(f'{page} imports {dep}, 但 ZIP 里没有')

            # vendor/ 整目录逐一比对，而不是抽查某一个文件。
            # 期望集合直接来自文件系统，**不能**过 should_include——否则一旦有人
            # 把 vendor 写进排除规则，期望集合会跟着缩水，用例就变成自证自洽。
            on_disk = {
                p.relative_to(ROOT).as_posix()
                for p in (ROOT / 'vendor').rglob('*') if p.is_file()
            }
            if not on_disk:
                raise RuntimeError('vendor/ 目录为空，检查用例本身失效了')
            missing_vendor = sorted(on_disk - names)
            if missing_vendor:
                raise RuntimeError(f'vendor 缺失 {len(missing_vendor)} 个：{missing_vendor[:5]}')
            for forbidden in FORBIDDEN_PREFIXES:
                if any(n.startswith(forbidden) for n in names):
                    raise RuntimeError(f'forbidden prefix {forbidden}')
            if any(n.endswith('.spec') for n in names):
                raise RuntimeError('spec file leaked into zip')
            bats = [n for n in names if n.endswith('.bat')]
            for n in bats:
                data = zf.read(n)
                lf = data.count(b'\n') - data.count(b'\r\n')
                if lf:
                    raise RuntimeError(f'{n} has LF-only lines in zip')


def main() -> int:
    test_should_include_excludes_nested_build_artifacts()
    print('ok should_include excludes nested build artifacts')
    test_pack_delivery_zip()
    print('ok pack-delivery zip contents')
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as e:
        print('FAIL', e)
        raise SystemExit(1)
