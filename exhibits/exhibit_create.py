"""Create exhibit from _template (Python shared by CLI + serve.py)."""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

SAFE = re.compile(r'^[A-Za-z0-9_-]+$')


def normalize_exhibit_dir(raw: str) -> str:
    s = raw.strip().strip('/\\')
    if not s:
        raise ValueError('展品目录不能为空')
    if s.isdigit():
        s = f'craft-{int(s):03d}'
    elif not s.lower().startswith('craft-'):
        s = f'craft-{s}'
    if not SAFE.match(s):
        raise ValueError(f'非法展品目录名：{s}')
    return s


def suggest_next_exhibit_dir(root: Path) -> str:
    max_n = 0
    for p in root.iterdir():
        if not p.is_dir() or p.name.startswith('_') or p.name.startswith('.'):
            continue
        m = re.match(r'^craft-(\d+)$', p.name, re.I)
        if m:
            max_n = max(max_n, int(m.group(1)))
    return f'craft-{max_n + 1:03d}'


def create_exhibit(root: Path, dir_name: str, title: str, subtitle: str = '') -> dict:
    ex = normalize_exhibit_dir(dir_name)
    name = title.strip()
    if not name:
        raise ValueError('展品名称不能为空')
    sub = subtitle.strip()
    template = root / '_template'
    dest = root / ex
    if not template.is_dir():
        raise ValueError('缺少模板目录 _template/')
    if dest.exists():
        raise ValueError(f'展品目录已存在：{ex}')
    shutil.copytree(template, dest)
    cfg_path = dest / 'config.json'
    cfg = json.loads(cfg_path.read_text(encoding='utf-8'))
    cfg['id'] = ex
    cfg.setdefault('i18n', {}).setdefault('zh', {})
    cfg['i18n']['zh']['title'] = name
    cfg['i18n']['zh']['subtitle'] = sub
    cfg_path.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    idx_path = dest / 'index.html'
    idx_path.write_text(
        idx_path.read_text(encoding='utf-8').replace('__EX__', ex).replace('__TITLE__', name),
        encoding='utf-8',
    )
    return {'dir': ex, 'title': name, 'subtitle': sub, 'assetsDir': str(dest / 'assets')}
