#!/usr/bin/env python3
"""校方源码同步：必带四棵目录，去掉测试、密钥痕迹文件和三维展陈。"""
from __future__ import annotations

import importlib.util
import tempfile
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
must_include('miniapp', 'config/env.js')
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
must_exclude('sql', 'sql-init-manifest.json')
must_exclude('sql', 'patch-loadtest.sql')
must_exclude('sql', 'patch-remove-craft-3d-columns.sql')
must_exclude('sql', 'patch-craft-image-fit-mode.sql')

env_src = mod.resolve_copy_source(ROOT.parent / 'miniapp', ROOT.parent / 'miniapp' / 'config' / 'env.js', '微信小程序')
if 'yunmanvr' in env_src.read_text(encoding='utf-8'):
    raise SystemExit('校方包里的 env.js 不得带内部预发域名')

readme = mod.PACK_README.lower()
for banned in ('git', 'github', 'push', 'commit', 'claude', '甲方', '乙方', '合伙人', 'exhibits', '三维', '立体鉴赏'):
    if banned in readme:
        raise SystemExit(f'说明模板不应出现 {banned!r}')


def write_file(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8')


def make_source_repo(root: Path) -> None:
    write_file(root / 'miniapp' / 'app.js', 'module.exports = {}\n')
    write_file(root / 'admin' / 'package.json', '{}\n')
    write_file(root / 'backend' / 'pom.xml', '<project/>\n')
    write_file(root / 'sql' / 'init.sql', '-- ok\n')


def assert_no_work_dirs(out: Path) -> None:
    leftover = mod.sibling_work_dirs(out)
    if leftover:
        raise SystemExit('临时目录未清理：' + ', '.join(p.name for p in leftover))


with tempfile.TemporaryDirectory() as tmp:
    repo = Path(tmp)
    out = repo / '交付源码'
    make_source_repo(repo)
    write_file(out / '旧包标记.txt', 'KEEP_ME')
    write_file(out / '微信小程序' / 'app.js', 'old\n')
    write_file(repo / 'miniapp' / 'leak.js', '内部协作标记：合伙人\n')
    old_bytes = (out / '旧包标记.txt').read_bytes()
    raised = False
    try:
        mod.sync(repo=repo, out=out)
    except SystemExit as exc:
        raised = True
        if '未通过检查' not in str(exc):
            raise SystemExit(f'失败原因不对：{exc}')
    if not raised:
        raise SystemExit('含内部信息时应同步失败')
    if not (out / '旧包标记.txt').is_file():
        raise SystemExit('扫描失败后不得丢掉上一份有效包')
    if (out / '旧包标记.txt').read_bytes() != old_bytes:
        raise SystemExit('扫描失败后旧包内容被改写')
    if (out / '微信小程序' / 'leak.js').exists():
        raise SystemExit('未通过检查的文件不得进入正式目录')
    assert_no_work_dirs(out)

    (repo / 'miniapp' / 'leak.js').unlink()
    counts = mod.sync(repo=repo, out=out)
    if counts['微信小程序'] < 1:
        raise SystemExit('成功路径应写入新包')
    if (out / '旧包标记.txt').exists():
        raise SystemExit('成功替换后不应再留旧包标记')
    if not (out / '微信小程序' / 'app.js').is_file():
        raise SystemExit('成功路径缺少小程序入口')
    if '合伙人' in (out / '微信小程序' / 'app.js').read_text(encoding='utf-8'):
        raise SystemExit('成功包不应带内部信息')
    assert_no_work_dirs(out)

print('sync-client-source.test.py OK')
