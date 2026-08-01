"""输入目录扫描（无 trimesh 依赖，供 convert_cli 与 batch_glb 共用）。"""
from __future__ import annotations

import os

_CONVERTIBLE = (".zip", ".glb", ".obj")


def output_exclusion_for_input(input_dir: str, output_dir: str) -> set[str]:
    """若输出目录是输入目录的真子目录，返回应排除的绝对路径。"""
    input_abs = os.path.abspath(input_dir)
    output_abs = os.path.abspath(output_dir)
    if output_abs.startswith(input_abs + os.sep):
        return {output_abs}
    return set()


def collect_input_files(
    input_dir: str,
    recursive: bool = True,
    exclude_dirs: set[str] | None = None,
) -> list[str]:
    """收集 .zip / .glb / .obj；exclude_dirs 为需跳过的绝对路径集合。"""
    exclude_abs = {os.path.abspath(p) for p in (exclude_dirs or set())}
    input_abs = os.path.abspath(input_dir)
    files: list[str] = []

    if recursive:
        for dirpath, dirnames, filenames in os.walk(input_abs):
            current = os.path.abspath(dirpath)
            dirnames[:] = [
                d for d in dirnames
                if os.path.abspath(os.path.join(current, d)) not in exclude_abs
            ]
            if current in exclude_abs:
                continue
            for fn in sorted(filenames):
                if fn.lower().endswith(_CONVERTIBLE):
                    files.append(os.path.join(current, fn))
    else:
        for fn in sorted(os.listdir(input_abs)):
            if fn.lower().endswith(_CONVERTIBLE):
                files.append(os.path.join(input_abs, fn))

    return files
