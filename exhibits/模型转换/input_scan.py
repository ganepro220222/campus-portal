"""输入目录扫描（无 trimesh 依赖，供 convert_cli 与 batch_glb 共用）。"""
from __future__ import annotations

import os

_CONVERTIBLE = (".zip", ".glb", ".obj")


def _canonical_path(path: str) -> str:
    """用于包含关系判断的路径键（Windows 上大小写不敏感）。"""
    try:
        return os.path.normcase(os.path.realpath(path))
    except (OSError, ValueError):
        return os.path.normcase(os.path.abspath(path))


def output_exclusion_for_input(input_dir: str, output_dir: str) -> set[str]:
    """若输出目录是输入目录的真子目录，返回应排除的绝对路径。"""
    input_key = _canonical_path(input_dir)
    output_key = _canonical_path(output_dir)
    if output_key == input_key:
        return set()
    try:
        common = os.path.commonpath([input_key, output_key])
    except ValueError:
        # 不同盘符（Windows）等无法求公共前缀
        return set()
    if common == input_key:
        return {os.path.abspath(output_dir)}
    return set()


def collect_input_files(
    input_dir: str,
    recursive: bool = True,
    exclude_dirs: set[str] | None = None,
) -> list[str]:
    """收集 .zip / .glb / .obj；exclude_dirs 为需跳过的绝对路径集合。"""
    exclude_keys = {_canonical_path(p) for p in (exclude_dirs or set())}
    input_abs = os.path.abspath(input_dir)
    files: list[str] = []

    if recursive:
        for dirpath, dirnames, filenames in os.walk(input_abs):
            current = os.path.abspath(dirpath)
            current_key = _canonical_path(current)
            dirnames[:] = [
                d for d in dirnames
                if _canonical_path(os.path.join(current, d)) not in exclude_keys
            ]
            if current_key in exclude_keys:
                continue
            for fn in sorted(filenames):
                if fn.lower().endswith(_CONVERTIBLE):
                    files.append(os.path.join(current, fn))
    else:
        if _canonical_path(input_abs) in exclude_keys:
            return []
        for fn in sorted(os.listdir(input_abs)):
            if fn.lower().endswith(_CONVERTIBLE):
                files.append(os.path.join(input_abs, fn))

    return files
