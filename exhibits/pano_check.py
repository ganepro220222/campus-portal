"""Asset availability + content fingerprint for the studio list API (mirrors pano-check.mjs)."""
from __future__ import annotations

import hashlib
import json
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


def is_site_root_pano_path(p: str | None) -> bool:
    return str(p or '').strip().startswith('/')


def check_panorama_path_availability(panorama_path: str | None, exhibits_root: Path) -> bool | str:
    """批量面板校验：True / False / 'unknown'"""
    p = str(panorama_path or '').strip()
    if not p:
        return False
    if is_remote_panorama_url(p):
        return 'unknown'
    if is_site_root_pano_path(p):
        return 'unknown'
    if p.startswith('../'):
        ref = exhibits_root / '_template'
        return has_asset_file(ref, p, exhibits_root)
    return 'unknown'


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
PANO_PUBLIC_DIRS = ['共享背景', '_panoramas', 'shared/panoramas']
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


def panorama_to_root_rel(exhibit_dir: Path, panorama_path: str | None, exhibits_root: Path | None) -> str | None:
    p = str(panorama_path or '').strip()
    if not p or is_remote_panorama_url(p):
        return None
    if p.startswith('/'):
        if not exhibits_root:
            return None
        local = exhibits_root / p.lstrip('/')
    elif Path(p).is_absolute():
        local = Path(p)
    else:
        local = exhibit_dir / p
    if not exhibits_root:
        return None
    try:
        rel = local.resolve().relative_to(exhibits_root.resolve())
    except ValueError:
        return None
    return rel.as_posix()


def _read_local_image_meta(exhibits_root: Path, root_rel: str) -> dict | None:
    full = exhibits_root.joinpath(*root_rel.split('/'))
    if full.suffix.lower() not in PANO_EXT:
        return None
    try:
        if not full.is_file():
            return None
        with open(full, 'rb') as f:
            size = image_size(f.read(65536))
    except OSError:
        return None
    if not is_panorama_ratio(size):
        return None
    return {'width': size[0], 'height': size[1]}


def _list_exhibit_dirs(exhibits_root: Path) -> list[str]:
    out: list[str] = []
    try:
        items = sorted(exhibits_root.iterdir(), key=lambda x: x.name)
    except OSError:
        return out
    for it in items:
        if not it.is_dir() or it.name.startswith('_') or it.name.startswith('.'):
            continue
        if (it / 'config.json').is_file():
            out.append(it.name)
    return out


def list_panorama_candidates(exhibits_root: Path) -> list[dict]:
    """可信来源的全景候选：config 引用 + 公共目录；path 相对 exhibits/、正斜杠。"""
    root = exhibits_root.resolve()
    merged: dict[str, dict] = {}

    def add(entry: dict) -> None:
        if len(merged) >= PANO_MAX_SCAN:
            return
        prev = merged.get(entry['path'])
        if not prev or (prev.get('source') == 'shared' and entry.get('source') == 'configured'):
            merged[entry['path']] = entry

    for ex in _list_exhibit_dirs(root):
        if len(merged) >= PANO_MAX_SCAN:
            break
        exhibit_dir = root / ex
        try:
            cfg = json.loads((exhibit_dir / 'config.json').read_text(encoding='utf-8'))
        except (OSError, json.JSONDecodeError):
            continue
        pano = (cfg.get('assets') or {}).get('panorama')
        if not pano or is_remote_panorama_url(pano):
            continue
        root_rel = panorama_to_root_rel(exhibit_dir, pano, root)
        if not root_rel:
            continue
        meta = _read_local_image_meta(root, root_rel)
        if meta:
            add({'path': root_rel, **meta, 'source': 'configured'})

    def walk_shared(d: Path, rel: str) -> None:
        if len(merged) >= PANO_MAX_SCAN:
            return
        try:
            items = sorted(d.iterdir(), key=lambda x: x.name)
        except OSError:
            return
        for it in items:
            if len(merged) >= PANO_MAX_SCAN:
                return
            if it.name.startswith('.'):
                continue
            r = f'{rel}/{it.name}' if rel else it.name
            if it.is_dir():
                if it.name not in PANO_SKIP_DIRS:
                    walk_shared(it, r)
                continue
            if not it.is_file():
                continue
            meta = _read_local_image_meta(root, r)
            if meta:
                add({'path': r, **meta, 'source': 'shared'})

    for pub in PANO_PUBLIC_DIRS:
        if len(merged) >= PANO_MAX_SCAN:
            break
        pub_dir = root.joinpath(*pub.split('/'))
        if pub_dir.is_dir():
            walk_shared(pub_dir, pub.replace('\\', '/'))

    order = {'configured': 0, 'shared': 1}
    return sorted(merged.values(), key=lambda x: (order.get(x.get('source'), 9), x['path']))
