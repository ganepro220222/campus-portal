#!/usr/bin/env python3
"""Partner offline editor pack must drop sample craft-001 and 共享背景."""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location('sync_partner_modules', ROOT / 'sync-partner-modules.py')
mod = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(mod)


def must_include(rel: str) -> None:
    path = mod.EXHIBITS / rel
    if not path.is_file():
        raise SystemExit(f'missing source file for include check: {rel}')
    if not mod.editor_should_include(path):
        raise SystemExit(f'editor pack must include {rel}')


def must_exclude(rel: str) -> None:
    path = mod.EXHIBITS / rel
    if not path.is_file():
        raise SystemExit(f'missing source file for exclude check: {rel}')
    if mod.editor_should_include(path):
        raise SystemExit(f'editor pack must omit {rel}')


must_include('player.html')
must_include('studio.html')
must_include('_server/studio-server.mjs')
must_exclude('craft-001/config.json')
must_exclude('共享背景/8.jpg')
must_exclude('模型转换/obj2glb.py')

print('sync-partner-modules.test.py OK')
