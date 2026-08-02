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


# ---------- 全景图候选清单（批量编辑的下拉选择用；与 pano-check.mjs 保持一致） ----------
PANO_EXT = {'.jpg', '.jpeg', '.png', '.webp'}
PANO_SKIP_DIRS = {'node_modules', 'vendor', '_runtime', '_dev', 'e2e', 'test-results', 'playwright-report'}
# 等距柱状投影固有 2:1；放宽到 1.7 会把 16:9（1.778）的截图也收进来
PANO_RATIO_MIN = 1.9
PANO_RATIO_MAX = 2.1
PANO_MAX_SCAN = 400


def image_size(buf: bytes):
    """从图头读宽高（JPEG / PNG / WebP）；读不出返回 None。不解码像素。"""
    if not buf or len(buf) < 16:
        return None
    if buf[:8] == b'\x89PNG\r\n\x1a\n':
        return (int.from_bytes(buf[16:20], 'big'), int.from_bytes(buf[20:24], 'big'))
    if len(buf) >= 30 and buf[:4] == b'RIFF' and buf[8:12] == b'WEBP':
        fmt = buf[12:16]
        if fmt == b'VP8X':
            return ((int.from_bytes(buf[24:27], 'little') & 0xFFFFFF) + 1,
                    (int.from_bytes(buf[27:30], 'little') & 0xFFFFFF) + 1)
        if fmt == b'VP8 ':
            return (int.from_bytes(buf[26:28], 'little') & 0x3FFF,
                    int.from_bytes(buf[28:30], 'little') & 0x3FFF)
        if fmt == b'VP8L' and buf[20] == 0x2F:
            b = int.from_bytes(buf[21:25], 'little')
            return ((b & 0x3FFF) + 1, ((b >> 14) & 0x3FFF) + 1)
        return None
    if buf[0] == 0xFF and buf[1] == 0xD8:
        i = 2
        while i + 9 < len(buf):
            if buf[i] != 0xFF:
                i += 1
                continue
            marker = buf[i + 1]
            if marker == 0xD8 or marker == 0x01 or 0xD0 <= marker <= 0xD7:
                i += 2
                continue
            ln = int.from_bytes(buf[i + 2:i + 4], 'big')
            if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
                return (int.from_bytes(buf[i + 7:i + 9], 'big'), int.from_bytes(buf[i + 5:i + 7], 'big'))
            if ln < 2:
                return None
            i += 2 + ln
    return None


def is_panorama_ratio(size) -> bool:
    if not size or not size[0] or not size[1]:
        return False
    r = size[0] / size[1]
    return PANO_RATIO_MIN <= r <= PANO_RATIO_MAX


def list_panorama_candidates(exhibits_root: Path) -> list[dict]:
    """扫 exhibits/ 下所有接近 2:1 的图片，path 相对 exhibits/、正斜杠。"""
    out: list[dict] = []

    def walk(d: Path, rel: str):
        if len(out) >= PANO_MAX_SCAN:
            return
        try:
            items = sorted(d.iterdir(), key=lambda x: x.name)
        except OSError:
            return
        for it in items:
            if len(out) >= PANO_MAX_SCAN:
                return
            if it.name.startswith('.'):
                continue
            r = f'{rel}/{it.name}' if rel else it.name
            if it.is_dir():
                if it.name not in PANO_SKIP_DIRS:
                    walk(it, r)
                continue
            if not it.is_file() or it.suffix.lower() not in PANO_EXT:
                continue
            try:
                with open(it, 'rb') as f:
                    size = image_size(f.read(65536))
            except OSError:
                continue
            if is_panorama_ratio(size):
                out.append({'path': r, 'width': size[0], 'height': size[1]})

    walk(Path(exhibits_root), '')
    return sorted(out, key=lambda x: x['path'])
