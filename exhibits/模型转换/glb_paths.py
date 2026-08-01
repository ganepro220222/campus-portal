"""输出路径命名（无 trimesh 依赖，供 glb_utils / 轻量测试共用）。"""
from __future__ import annotations

import hashlib
import os

CROSS_ROOT_BATCH = "\x00cross-root-batch"
_STEM_ELLIPSIS = "__…__"

# 保守上限：为 -<glbhash>.glb 与 .transform.json 预留空间（Windows 单组件约 255 UTF-16）
MAX_OUTPUT_STEM_BYTES = 200


def _utf8_truncate(text: str, max_bytes: int) -> str:
    raw = text.encode("utf-8")
    if len(raw) <= max_bytes:
        return text
    n = max_bytes
    while n > 0 and (raw[n] & 0xC0) == 0x80:
        n -= 1
    return raw[:n].decode("utf-8", errors="ignore")


def _drive_tag(drive: str) -> str:
    """将 splitdrive 的 drive 段规范为不含分隔符的标签（含 UNC share）。"""
    return (
        drive.rstrip(":")
        .lstrip("\\/")
        .replace("\\", "__")
        .replace("/", "__")
    )


def cross_drive_relpath(src_path: str, pathmod) -> str:
    """跨盘符相对路径降级：用 pathmod 解析盘符并生成稳定标签（测试可传入 ntpath）。"""
    abs_src = pathmod.abspath(src_path)
    drive, tail = pathmod.splitdrive(abs_src)
    drive_tag = _drive_tag(drive)
    prefix = f"{drive_tag}__" if drive_tag else ""
    return prefix + tail.lstrip("\\/").replace("\\", "__").replace("/", "__")


def _looks_like_windows_path(path: str) -> bool:
    if len(path) >= 2 and path[1] == ":" and path[0].isalpha():
        return True
    return path.startswith("\\\\") or path.startswith("//")


def is_cross_root_batch(naming_root: str) -> bool:
    return naming_root == CROSS_ROOT_BATCH


def _common_root(abs_paths: list[str], pathmod) -> str:
    try:
        common = pathmod.commonpath(abs_paths)
    except ValueError:
        return CROSS_ROOT_BATCH
    if pathmod.isfile(common):
        return pathmod.dirname(common)
    return common


def naming_root_from_saved_roots(
    roots: list[str],
    *,
    canonical_key=None,
) -> str:
    """根据添加时保存的 root 计算批次命名根；跨盘/跨 UNC 时返回 CROSS_ROOT_BATCH。"""
    if not roots:
        raise ValueError("empty roots")
    key_fn = canonical_key or (lambda p: os.path.normcase(os.path.abspath(p)))
    abs_roots = [os.path.abspath(r) for r in roots]
    if len({key_fn(r) for r in abs_roots}) == 1:
        return abs_roots[0]
    if all(_looks_like_windows_path(r) for r in roots):
        import ntpath

        abs_win = [ntpath.abspath(r) for r in roots]
        return _common_root(abs_win, ntpath)
    return _common_root(abs_roots, os.path)


def _cross_root_source_relpath(src_path: str) -> str:
    import ntpath

    pathmod = ntpath if _looks_like_windows_path(src_path) else os.path
    return cross_drive_relpath(src_path, pathmod)


def safe_relpath(src_path: str, input_root: str) -> str:
    """相对路径；跨盘符（Windows）时退化为带盘符标签的稳定路径。"""
    if is_cross_root_batch(input_root):
        return _cross_root_source_relpath(src_path)
    try:
        return os.path.relpath(src_path, input_root)
    except ValueError:
        return _cross_root_source_relpath(src_path)


def cap_output_stem(stem: str, source_rel: str, max_bytes: int = MAX_OUTPUT_STEM_BYTES) -> str:
    """限制输出 stem 的 UTF-8 字节长度；manifest 仍保留完整 source_rel。"""
    if len(stem.encode("utf-8")) <= max_bytes:
        return stem

    src_hash = hashlib.sha1(source_rel.encode("utf-8")).hexdigest()[:8]
    suffix = f"__src_{src_hash}"
    suffix_len = len(suffix.encode("utf-8"))
    body_budget = max_bytes - suffix_len

    basename = stem.rsplit("__", 1)[-1]
    head = stem.split("__", 1)[0] if "__" in stem else ""

    if head and head != basename:
        fixed = _STEM_ELLIPSIS + basename
        fixed_len = len(fixed.encode("utf-8"))
        head_budget = body_budget - fixed_len
        if head_budget >= 1:
            body = _utf8_truncate(head, head_budget) + fixed
        else:
            body = _utf8_truncate(basename, body_budget)
    else:
        body = _utf8_truncate(basename, body_budget)

    result = body + suffix
    if len(result.encode("utf-8")) > max_bytes:
        body = _utf8_truncate(body, body_budget)
        result = body + suffix
    return result


def safe_output_stem(src_path: str, input_root: str) -> str:
    """根据来源相对路径生成安全文件名主干（不含内容哈希后缀）。"""
    rel = safe_relpath(src_path, input_root)
    stem = os.path.splitext(rel)[0]
    stem = stem.replace(os.sep, "__").replace(" ", "_")
    return cap_output_stem(stem, rel)


def final_output_name_bytes(stem: str, content_hash8: str) -> int:
    """估算最终 GLB 文件名的 UTF-8 字节长度（stem-<hash>.glb）。"""
    return len(f"{stem}-{content_hash8}.glb".encode("utf-8"))
