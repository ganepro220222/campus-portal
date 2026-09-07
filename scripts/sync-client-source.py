#!/usr/bin/env python3
"""把校方源码同步到仓库根目录「交付源码/」（不进远端，不含三维展陈）。

  微信小程序/   ← miniapp（去掉测试与开发者工具私有配置）
  管理后台/     ← admin
  服务端/       ← backend（去掉单测）
  数据库脚本/   ← sql（去掉压测补丁）

改完上述四棵目录后重新执行：

  python scripts/sync-client-source.py
"""
from __future__ import annotations

import argparse
import re
import shutil
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
    '微信小程序': frozenset(),
    '管理后台': frozenset(),
    '服务端': frozenset({
        'src/test',
    }),
    '数据库脚本': frozenset({
        'README.md',
        'patch-loadtest.sql',
        'patch-loadtest-cleanup.sql',
    }),
}

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
)

PACK_README = """云端书院源码

同步日期：{today}

本目录包含校方小程序与后台工程，不含三维展陈。

【微信小程序】
  用微信开发者工具导入「微信小程序」文件夹。
  正式发布前，对照 config/env.prod.template.js 把运行环境改成正式域名。

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


def rimraf(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)


def copy_tree(src_root: Path, dst_root: Path, pack_name: str) -> int:
    n = 0
    for path in sorted(src_root.rglob('*')):
        if not should_include(src_root, path, pack_name):
            continue
        out = dst_root / path.relative_to(src_root)
        out.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, out)
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


def scan_pack(out: Path) -> list[str]:
    errors: list[str] = []
    if (out / '.git').exists():
        errors.append('交付源码内出现 .git')
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


def sync() -> dict[str, int]:
    for _, src in TREES:
        if not src.is_dir():
            raise SystemExit(f'缺少源目录：{src}')
    rimraf(OUT)
    OUT.mkdir(parents=True, exist_ok=True)
    counts: dict[str, int] = {}
    for name, src in TREES:
        counts[name] = copy_tree(src, OUT / name, name)
    write_readme(OUT)
    errors = scan_pack(OUT)
    if errors:
        raise SystemExit('交付源码未通过检查：\n  ' + '\n  '.join(errors))
    return counts


def main() -> None:
    argparse.ArgumentParser(description='同步校方源码到 交付源码/').parse_args()
    counts = sync()
    for name, n in counts.items():
        print(f'{name}/  {n} 个文件')
    print('说明.txt')
    print('OK')


if __name__ == '__main__':
    main()
