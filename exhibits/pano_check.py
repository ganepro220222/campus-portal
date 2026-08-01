"""Panorama availability for studio list API (mirrors pano-check.mjs)."""
from __future__ import annotations

import re
from pathlib import Path

_REMOTE = re.compile(r'^(https?:|data:|blob:|//)')


def is_remote_panorama_url(path: str | None) -> bool:
    return bool(_REMOTE.match(str(path or '').strip()))


def has_asset_file(
    exhibit_dir: Path,
    asset_path: str | None,
    exhibits_root: Path | None = None,
) -> bool:
    """通用资源存在性判断（模型 / 全景共用同一套路径解析规则）。"""
    p = str(asset_path or '').strip()
    if not p:
        return False
    if is_remote_panorama_url(p):
        return True
    if p.startswith('/'):
        if not exhibits_root:
            return False
        local = exhibits_root / p.lstrip('/')
    else:
        local = Path(p)
        if not local.is_absolute():
            local = exhibit_dir / p
    return local.is_file()
