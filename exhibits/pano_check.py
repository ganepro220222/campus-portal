"""Panorama availability for studio list API (mirrors pano-check.mjs)."""
from __future__ import annotations

import re
from pathlib import Path

_REMOTE = re.compile(r'^(https?:|data:|blob:|//|/)')


def is_remote_panorama_url(path: str | None) -> bool:
    return bool(_REMOTE.match(str(path or '').strip()))


def has_panorama_file(exhibit_dir: Path, panorama_path: str | None) -> bool:
    p = str(panorama_path or '').strip()
    if not p:
        return False
    if is_remote_panorama_url(p):
        return True
    local = Path(p)
    if not local.is_absolute():
        local = exhibit_dir / p
    return local.is_file()
