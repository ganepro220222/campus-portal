"""Asset availability + content fingerprint for the studio list API (mirrors pano-check.mjs)."""
from __future__ import annotations

import hashlib
import re
from pathlib import Path

_REMOTE = re.compile(r'^(https?:|data:|blob:|//)')

# 与 pano-check.mjs 保持一致；改算法请同步改版本号（见该文件里的说明）
FINGERPRINT_VERSION = 'v1'
FINGERPRINT_CHUNK = 65536
FINGERPRINT_LENGTH = 16


def is_remote_panorama_url(path: str | None) -> bool:
    return bool(_REMOTE.match(str(path or '').strip()))


def resolve_asset_local_path(
    exhibit_dir: Path,
    asset_path: str | None,
    exhibits_root: Path | None = None,
) -> Path | None:
    p = str(asset_path or '').strip()
    if not p or is_remote_panorama_url(p):
        return None
    if p.startswith('/'):
        if not exhibits_root:
            return None
        return exhibits_root / p.lstrip('/')
    local = Path(p)
    return local if local.is_absolute() else exhibit_dir / p


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
    local = resolve_asset_local_path(exhibit_dir, p, exhibits_root)
    if local is None:
        return False
    return local.is_file()


def asset_fingerprint(
    exhibit_dir: Path,
    asset_path: str | None,
    exhibits_root: Path | None = None,
) -> str:
    """本地资源内容指纹（长度 + 头尾各 64KiB）；远程 / 缺失 / 读不出一律返回 ''。"""
    local = resolve_asset_local_path(exhibit_dir, asset_path, exhibits_root)
    if local is None:
        return ''
    try:
        if not local.is_file():
            return ''
        size = local.stat().st_size
        h = hashlib.sha1()
        h.update(f'{FINGERPRINT_VERSION}|{size}|'.encode('utf-8'))
        with open(local, 'rb') as f:
            head_len = min(size, FINGERPRINT_CHUNK)
            if head_len > 0:
                h.update(f.read(head_len))
            tail_start = max(FINGERPRINT_CHUNK, size - FINGERPRINT_CHUNK)
            if size > tail_start:
                f.seek(tail_start)
                h.update(f.read(size - tail_start))
        return h.hexdigest()[:FINGERPRINT_LENGTH]
    except OSError:
        return ''
