"""Create exhibit from _template (Python shared by CLI + serve.py)."""
from __future__ import annotations

import json
import re
import secrets
import shutil
from html import escape as html_escape
from pathlib import Path

SAFE = re.compile(r'^[A-Za-z0-9_-]+$')


def escape_html(text: str) -> str:
    return html_escape(str(text), quote=True)


def normalize_exhibit_dir(raw: str) -> str:
    s = raw.strip().strip('/\\')
    if not s:
        raise ValueError('展品目录不能为空')
    if s.isdigit():
        n = int(s, 10)
        if n < 0:
            raise ValueError('非法展品编号')
        s = f'craft-{n:03d}'
    elif not s.lower().startswith('craft-'):
        s = f'craft-{s}'
    if s == 'craft-' or not SAFE.match(s):
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


def _validate_template(template: Path) -> None:
    cfg_path = template / 'config.json'
    idx_path = template / 'index.html'
    if not cfg_path.is_file():
        raise ValueError('模板缺少 config.json')
    if not idx_path.is_file():
        raise ValueError('模板缺少 index.html')
    json.loads(cfg_path.read_text(encoding='utf-8'))


def _build_index_html(template_idx: str, ex: str, title: str) -> str:
    return template_idx.replace('__EX__', ex).replace('__TITLE__', escape_html(title))


def create_exhibit(root: Path, dir_name: str, title: str, subtitle: str = '') -> dict:
    ex = normalize_exhibit_dir(dir_name)
    name = title.strip()
    if not name:
        raise ValueError('展品名称不能为空')
    sub = subtitle.strip()
    template = root / '_template'
    dest = root / ex
    _validate_template(template)
    if dest.exists():
        raise ValueError(f'展品目录已存在：{ex}')

    template_cfg = json.loads((template / 'config.json').read_text(encoding='utf-8'))
    template_idx = (template / 'index.html').read_text(encoding='utf-8')
    template_cfg['id'] = ex
    template_cfg.setdefault('i18n', {}).setdefault('zh', {})
    template_cfg['i18n']['zh']['title'] = name
    template_cfg['i18n']['zh']['subtitle'] = sub

    tmp = root / f'._creating-{ex}-{secrets.token_hex(4)}'
    try:
        shutil.copytree(template, tmp)
        (tmp / 'config.json').write_text(
            json.dumps(template_cfg, ensure_ascii=False, indent=2) + '\n',
            encoding='utf-8',
        )
        (tmp / 'index.html').write_text(_build_index_html(template_idx, ex, name), encoding='utf-8')
        tmp.rename(dest)
    except Exception:
        shutil.rmtree(tmp, ignore_errors=True)
        raise

    return {'dir': ex, 'title': name, 'subtitle': sub, 'assetsDir': f'{ex}/assets'}
