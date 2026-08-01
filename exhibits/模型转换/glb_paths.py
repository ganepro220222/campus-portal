"""输出路径命名（无 trimesh 依赖，供 glb_utils / 轻量测试共用）。"""
from __future__ import annotations

import hashlib
import os

# 保守上限：为 -<glbhash>.glb 与 .transform.json 预留空间（Windows 单组件约 255 UTF-16）
MAX_OUTPUT_STEM_BYTES = 200
_STEM_ELLIPSIS = "__…__"


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


def safe_relpath(src_path: str, input_root: str) -> str:
    """相对路径；跨盘符（Windows）时退化为带盘符标签的稳定路径。"""
    try:
        return os.path.relpath(src_path, input_root)
    except ValueError:
        import ntpath

        pathmod = ntpath if _looks_like_windows_path(src_path) else os.path
        return cross_drive_relpath(src_path, pathmod)


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
