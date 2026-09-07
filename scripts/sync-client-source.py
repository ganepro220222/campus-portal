#!/usr/bin/env python3
"""把校方源码同步到仓库根目录「交付源码/」（不进远端，不含三维展陈）。

扫描会拦住 Git 痕迹和不应外发的内部信息。

  微信小程序/   ← miniapp（去掉测试与开发者工具私有配置）
  管理后台/     ← admin
  服务端/       ← backend（去掉单测）
  数据库脚本/   ← sql（去掉压测补丁）

改完上述四棵目录后重新执行：

  python scripts/sync-client-source.py
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import stat
import sys
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / '交付源码'

TREES = (
    ('微信小程序', REPO / 'miniapp'),
    ('管理后台', REPO / 'admin'),
    ('服务端', REPO / 'backend'),
    ('数据库脚本', REPO / 'sql'),
)

EXCLUDE_DIR_NAMES = frozenset({
    '.git', '.idea', '.vscode', '.cursor',
    'node_modules', 'dist', 'build', 'target',
    '__pycache__', '.pytest_cache', 'coverage',
})

EXCLUDE_FILE_NAMES = frozenset({
    '.gitignore', '.gitattributes', '.dockerignore', '.env', '.env.local',
    'project.private.config.json',
    'application-local.yml', 'application-prod.yml',
    'HELP.md',
    'maven-wrapper.jar',
})

EXCLUDE_SUFFIXES = (
    '.test.js', '.test.ts', '.test.mjs', '.test.py',
    '.spec.js', '.spec.ts',
    '.tsbuildinfo',
)

# 相对各源根的路径（posix）
EXCLUDE_REL = {
    '微信小程序': frozenset({
        # 进包的 env.js 已是这份内容；模板留在仓库，避免接收方改错文件
        'config/env.prod.template.js',
    }),
    '管理后台': frozenset(),
    '服务端': frozenset({
        'src/test',
    }),
    '数据库脚本': frozenset({
        'README.md',
        'sql-init-manifest.json',
        'patch-loadtest.sql',
        'patch-loadtest-cleanup.sql',
        'patch-remove-craft-3d-columns.sql',
        'patch-craft-image-fit-mode.sql',
    }),
}

REQUIRED_PACK_RELS = (
    '说明.txt',
    '微信小程序/app.js',
    '管理后台/package.json',
    '服务端/pom.xml',
    '数据库脚本/init.sql',
)

SCAN_SKIP_NAMES = frozenset({
    'package-lock.json',
})

SCAN_SKIP_SUFFIXES = frozenset({
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
    '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4',
    '.jar', '.class', '.bin',
})

# 业务里用来清掉对外不当文案的句子，不是署名
SCAN_ALLOW_AI_PHRASE = frozenset({
    '微信小程序/config/features.js',
    '数据库脚本/patch-scrub-demo-ai-copy.sql',
})

FORBIDDEN = (
    (re.compile(r'github\.com', re.I), '仓库托管地址'),
    (re.compile(r'gitlab\.com', re.I), '仓库托管地址'),
    (re.compile(r'gitee\.com', re.I), '仓库托管地址'),
    (re.compile(r'git@'), '仓库地址'),
    (re.compile(r'\.gitignore'), '忽略名单文件名'),
    (re.compile(r'\bgit\s+push\b', re.I), '版本库操作'),
    (re.compile(r'\bgit\s+commit\b', re.I), '版本库操作'),
    (re.compile(r'\bgit\s+fetch\b', re.I), '版本库操作'),
    (re.compile(r'当前提交值'), '版本库用语'),
    (re.compile(r'release 门禁'), '版本库用语'),
    (re.compile(r'由 AI 生成'), '生成痕迹'),
    (re.compile(r'Cursor 生成'), '生成痕迹'),
    (re.compile(r'\bClaude\b'), '生成痕迹'),
    (re.compile(r'\bChatGPT\b'), '生成痕迹'),
    (re.compile(r'合伙人'), '内部协作信息'),
    (re.compile(r'甲方'), '内部协作信息'),
    (re.compile(r'乙方'), '内部协作信息'),
    (re.compile(r'开发方'), '内部协作信息'),
    (re.compile(r'yunmanvr', re.I), '内部域名'),
    (re.compile(r'TinyManager'), '内部工具'),
    (re.compile(r'FileBrowser'), '内部工具'),
    (re.compile(r'campus-portal'), '内部仓库名'),
    (re.compile(r'/opt/shuyuan'), '内部路径'),
    (re.compile(r'docker-compose\.staging'), '内部编排'),
    (re.compile(r'无从代劳'), '内部协作信息'),
    (re.compile(r'docs Phase'), '内部文档编号'),
    (re.compile(r'交付物\s*§'), '内部文档编号'),
    (re.compile(r'E\d-\d'), '内部文档编号'),
)

PACK_README = """云端书院源码

同步日期：{today}

【微信小程序】
  用微信开发者工具导入「微信小程序」文件夹。
  正式发布前，把 config/env.js 的运行环境和接口地址改成正式域名。

【管理后台】
  需要 Node.js 18 或更高版本。在「管理后台」目录安装依赖后启动，接口指向服务端。

【服务端】
  Java 17，Spring Boot 工程。生产配置对照 src/main/resources/application-prod.example.yml，
  用环境变量注入，不要把真实密钥写进文件。

【数据库脚本】
  新库依次执行：init.sql → patch-builtin-knowledge.sql。
  seed-dev.sql 是演示数据，正式库不要导入。
  其余 patch-*.sql 仅供旧库升级。
"""


def rel_posix(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def excluded_by_rel(rel: str, extra: frozenset[str]) -> bool:
    for item in extra:
        if rel == item or rel.startswith(item.rstrip('/') + '/'):
            return True
    return False


def should_include(src_root: Path, path: Path, pack_name: str) -> bool:
    if not path.is_file():
        return False
    rel = rel_posix(path, src_root)
    parts = Path(rel).parts
    if any(part in EXCLUDE_DIR_NAMES for part in parts):
        return False
    if path.name in EXCLUDE_FILE_NAMES:
        return False
    if path.name.endswith(EXCLUDE_SUFFIXES):
        return False
    if path.name.endswith('Test.java') or path.name.endswith('Tests.java'):
        return False
    if excluded_by_rel(rel, EXCLUDE_REL[pack_name]):
        return False
    return True


def _rmtree_onerror(_func, p, _exc) -> None:
    try:
        os.chmod(p, stat.S_IWRITE)
        Path(p).unlink(missing_ok=True)
    except OSError:
        pass


def try_rimraf(path: Path) -> str | None:
    if not path.exists():
        return None
    try:
        shutil.rmtree(path, onerror=_rmtree_onerror)
    except OSError:
        pass
    if path.exists():
        return f'目录清理失败：{path}'
    return None


def rimraf(path: Path) -> None:
    warning = try_rimraf(path)
    if warning:
        raise SystemExit(f'无法清空目录：{path}')


def sweep_stale_work_dirs(out: Path) -> None:
    for path in sibling_work_dirs(out):
        try_rimraf(path)


def prune_excluded(out: Path) -> None:
    for pack_name, extras in EXCLUDE_REL.items():
        for rel in extras:
            target = out / pack_name / Path(*rel.split('/'))
            if target.is_file():
                target.unlink()
            elif target.is_dir():
                shutil.rmtree(target, onerror=_rmtree_onerror)


def resolve_copy_source(src_root: Path, path: Path, pack_name: str) -> Path:
    rel = path.relative_to(src_root).as_posix()
    if pack_name == '微信小程序' and rel == 'config/env.js':
        template = src_root / 'config/env.prod.template.js'
        if template.is_file():
            return template
    return path


def copy_tree(src_root: Path, dst_root: Path, pack_name: str) -> int:
    n = 0
    for path in sorted(src_root.rglob('*')):
        if not should_include(src_root, path, pack_name):
            continue
        src = resolve_copy_source(src_root, path, pack_name)
        out = dst_root / path.relative_to(src_root)
        out.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, out)
        n += 1
    return n


def write_readme(out: Path) -> None:
    text = PACK_README.format(today=date.today().isoformat()).replace('\n', '\r\n')
    (out / '说明.txt').write_text(text, encoding='utf-8')


def iter_text_files(root: Path):
    for path in root.rglob('*'):
        if not path.is_file():
            continue
        if path.name in SCAN_SKIP_NAMES:
            continue
        if path.suffix.lower() in SCAN_SKIP_SUFFIXES:
            continue
        yield path


def work_dir(out: Path, kind: str) -> Path:
    return out.with_name(f'{out.name}.{kind}-{os.getpid()}')


def sibling_work_dirs(out: Path) -> list[Path]:
    parent = out.parent
    if not parent.is_dir():
        return []
    prefixes = (f'{out.name}.tmp-', f'{out.name}.bak-')
    return [p for p in parent.iterdir() if p.name.startswith(prefixes)]


def populate_pack(out: Path, trees: tuple[tuple[str, Path], ...]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for name, src in trees:
        counts[name] = copy_tree(src, out / name, name)
    prune_excluded(out)
    write_readme(out)
    return counts


def promote_staging(staging: Path, out: Path) -> str | None:
    bak = work_dir(out, 'bak')
    if bak.exists():
        leftover = try_rimraf(bak)
        if bak.exists():
            raise SystemExit(leftover or f'无法清空目录：{bak}')
    moved_out = False
    if out.exists():
        out.rename(bak)
        moved_out = True
    try:
        staging.rename(out)
    except OSError:
        if moved_out and bak.exists() and not out.exists():
            bak.rename(out)
        raise
    if not bak.exists():
        return None
    warning = try_rimraf(bak)
    if warning:
        return f'新交付包已生成，但旧备份清理失败：{bak}'
    return None


def scan_pack(out: Path) -> list[str]:
    errors: list[str] = []
    if (out / '.git').exists():
        errors.append('交付源码内出现 .git')
    for rel in REQUIRED_PACK_RELS:
        if not (out / Path(*rel.split('/'))).is_file():
            errors.append(f'缺少必备文件：{rel}')
    for pack_name, extras in EXCLUDE_REL.items():
        for rel in extras:
            leftover = out / pack_name / Path(*rel.split('/'))
            if leftover.exists():
                errors.append(f'排除项残留：{pack_name}/{rel}')
    for path in out.rglob('*'):
        if not path.is_file():
            continue
        rel = rel_posix(path, out)
        if path.name.endswith(EXCLUDE_SUFFIXES) or path.name.endswith('Test.java'):
            errors.append(f'测试文件不应进包：{rel}')
        if path.name in EXCLUDE_FILE_NAMES:
            errors.append(f'敏感或版本库文件不应进包：{rel}')
    for path in iter_text_files(out):
        rel = rel_posix(path, out)
        try:
            text = path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            continue
        for pattern, reason in FORBIDDEN:
            if not pattern.search(text):
                continue
            if reason == '生成痕迹' and rel in SCAN_ALLOW_AI_PHRASE:
                continue
            errors.append(f'{rel}：{reason}（{pattern.pattern}）')
    return errors


def pack_trees(repo: Path) -> tuple[tuple[str, Path], ...]:
    return tuple((name, repo / src.name) for name, src in TREES)


def sync(repo: Path | None = None, out: Path | None = None) -> dict[str, int]:
    root = REPO if repo is None else repo
    dest = OUT if out is None and repo is None else (out or (root / OUT.name))
    trees = pack_trees(root)
    for _, src in trees:
        if not src.is_dir():
            raise SystemExit(f'缺少源目录：{src}')
    sweep_stale_work_dirs(dest)
    staging = work_dir(dest, 'tmp')
    if staging.exists():
        rimraf(staging)
    staging.mkdir(parents=True)
    try:
        counts = populate_pack(staging, trees)
        errors = scan_pack(staging)
        if errors:
            raise SystemExit('交付源码未通过检查：\n  ' + '\n  '.join(errors))
        warning = promote_staging(staging, dest)
        if warning:
            print(f'警告：{warning}', file=sys.stderr)
        return counts
    except BaseException:
        if staging.exists():
            try:
                rimraf(staging)
            except SystemExit:
                pass
        raise


def main() -> None:
    argparse.ArgumentParser(description='同步校方源码到 交付源码/').parse_args()
    counts = sync()
    for name, n in counts.items():
        print(f'{name}/  {n} 个文件')
    print('说明.txt')
    print('OK')


if __name__ == '__main__':
    main()
