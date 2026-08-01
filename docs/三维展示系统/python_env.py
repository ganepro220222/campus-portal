#!/usr/bin/env python3
"""GLB 工具共用的 Python 环境探测（便携嵌入式 / 完整安装 / py 启动器）。"""
from __future__ import annotations

import os
import shutil
import subprocess

TOOL_DIR = os.path.dirname(os.path.abspath(__file__))


def _probe(py: list[str], code: str) -> bool:
    try:
        r = subprocess.run([*py, "-c", code], capture_output=True, timeout=30)
        return r.returncode == 0
    except (OSError, subprocess.TimeoutExpired):
        return False


def has_tkinter(py: list[str]) -> bool:
    return _probe(py, "import tkinter")


def has_glb_deps(py: list[str]) -> bool:
    return _probe(py, "import trimesh, PIL, numpy")


def python_candidates(tool_dir: str | None = None) -> list[list[str]]:
    """按优先级列出待检测的解释器命令（每项为 argv 前缀）。"""
    here = tool_dir or TOOL_DIR
    out: list[list[str]] = []
    seen: set[str] = set()

    def add(argv: list[str]) -> None:
        key = " ".join(argv)
        if key not in seen:
            seen.add(key)
            out.append(argv)

    for rel in (
        os.path.join(here, "_runtime", "python", "python.exe"),
        os.path.normpath(os.path.join(here, "..", "..", "exhibits", "_runtime", "python", "python.exe")),
    ):
        if os.path.isfile(rel):
            add([rel])

    if shutil.which("py"):
        add(["py", "-3"])

    for name in ("python3", "python"):
        path = shutil.which(name)
        if path:
            add([path])

    return out


def pick_gui_python(candidates: list[list[str]] | None = None) -> tuple[list[str] | None, str]:
    """
    返回 (argv 前缀, 原因码)。
    ok / need_deps / no_tk
    """
    cands = candidates if candidates is not None else python_candidates()
    tk_ok = [c for c in cands if has_tkinter(c)]
    if not tk_ok:
        return None, "no_tk"
    ready = [c for c in tk_ok if has_glb_deps(c)]
    if ready:
        return ready[0], "ok"
    return tk_ok[0], "need_deps"


def argv_key(argv: list[str]) -> str:
    if len(argv) == 1 and os.path.isfile(argv[0]):
        return os.path.abspath(argv[0]).lower()
    return " ".join(argv).lower()


def py_label(argv: list[str]) -> str:
    return argv[0] if len(argv) == 1 else " ".join(argv)
