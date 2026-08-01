"""Verify pack-delivery.py output (writes to temp dir via PACK_OUT)."""
from __future__ import annotations

import importlib.util
import os
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

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


def test_should_include_excludes_nested_build_artifacts() -> None:
    mod = _load_packer()
    for rel in NESTED_BUILD_PATHS:
        path = mod.ROOT / Path(rel)
        if mod.should_include(path):
            raise RuntimeError(f'should exclude nested build path: {rel}')
    ok_path = mod.ROOT / '模型转换' / 'convert_cli.py'
    if not mod.should_include(ok_path):
        raise RuntimeError('should include 模型转换/convert_cli.py')


def test_pack_delivery_zip() -> None:
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
                '拷贝说明.txt', '_launch/start-server.bat', 'studio.html',
                *GLB_REQUIRED,
            ):
                if required not in names:
                    raise RuntimeError(f'missing {required} in zip')
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
