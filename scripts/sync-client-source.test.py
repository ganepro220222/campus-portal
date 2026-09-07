#!/usr/bin/env python3
"""校方源码同步：必带四棵目录，去掉测试、密钥痕迹文件和三维展陈。"""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location('sync_client_source', ROOT / 'sync-client-source.py')
mod = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(mod)


def pack_of(src_name: str) -> str:
    for name, src in mod.TREES:
        if src.name == src_name:
            return name
    raise SystemExit(f'unknown source tree: {src_name}')


def must_include(src_name: str, rel: str) -> None:
    root = ROOT.parent / src_name
    src = root / rel
    if not src.is_file():
        raise SystemExit(f'缺少源文件：{src_name}/{rel}')
    if not mod.should_include(root, src, pack_of(src_name)):
        raise SystemExit(f'校方包必须包含 {src_name}/{rel}')


def must_exclude(src_name: str, rel: str) -> None:
    src = ROOT.parent / src_name / rel
    if not src.is_file():
        raise SystemExit(f'缺少源文件（排除校验）：{src_name}/{rel}')
    root = ROOT.parent / src_name
    if mod.should_include(root, src, pack_of(src_name)):
        raise SystemExit(f'校方包不得包含 {src_name}/{rel}')


assert [name for name, _ in mod.TREES] == ['微信小程序', '管理后台', '服务端', '数据库脚本']
assert all(name != '三维展陈' for name, _ in mod.TREES)
assert (ROOT.parent / 'exhibits').is_dir()

must_include('miniapp', 'app.js')
must_include('miniapp', 'app.json')
must_include('miniapp', 'config/env.prod.template.js')
must_include('admin', 'package.json')
must_include('admin', 'src/main.ts')
must_include('backend', 'pom.xml')
must_include('backend', 'src/main/java/com/shuyuan/backend/BackendApplication.java')
must_include('backend', 'src/main/resources/application-prod.example.yml')
must_include('sql', 'init.sql')
must_include('sql', 'patch-builtin-knowledge.sql')

must_exclude('miniapp', 'utils/request.test.js')
must_exclude('miniapp', 'utils/coursePlayerAuth.test.js')
must_exclude('backend', 'src/test/java/com/shuyuan/backend/service/ViewCountServiceTest.java')
must_exclude('backend', '.gitignore')
must_exclude('backend', '.dockerignore')
must_exclude('admin', '.gitignore')
must_exclude('sql', 'README.md')
must_exclude('sql', 'patch-loadtest.sql')

readme = mod.PACK_README.lower()
for banned in ('git', 'github', 'push', 'commit', 'claude', '甲方', 'exhibits'):
    if banned in readme:
        raise SystemExit(f'说明模板不应出现 {banned!r}')

print('sync-client-source.test.py OK')
