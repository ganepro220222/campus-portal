#!/usr/bin/env python3
"""为 obj2glb_gui 选择带 tkinter 的 Python 并启动（便携嵌入式 Python 不含 GUI 组件）。"""
from __future__ import annotations

import os
import subprocess
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

from python_env import pick_gui_python, py_label  # noqa: E402

GUI = os.path.join(_HERE, "obj2glb_gui.py")


def main() -> int:
    if not os.path.isfile(GUI):
        print(f"[错误] 找不到 {GUI}")
        return 9

    py, reason = pick_gui_python()
    if reason == "no_tk":
        print("[错误] 没找到带 tkinter（图形界面）的 Python。")
        print()
        print("exhibits 里的便携 Python 是嵌入式版本，只够跑命令行转换，不含 tkinter。")
        print("图形界面可选方案：")
        print("  1. 安装完整 Python 3.12+（勾选 tcl/tk 与 Add Python to PATH），")
        print("     再执行「安装转换依赖.bat」或 pip install trimesh pillow numpy")
        print("  2. 使用 build-exe-venv.bat 打包 exe，双击 exe 运行（无需安装 Python）")
        return 3

    assert py is not None
    print(f"使用：{py_label(py)}")

    if reason == "need_deps":
        print()
        print("[缺少依赖] 当前 Python 已具备 tkinter，尚未安装 trimesh / pillow / numpy。")
        print("执行以下命令安装（只需一次）：")
        print(f'    {" ".join(py)} -m pip install trimesh pillow numpy')
        print("装完后再双击「打开转换器.bat」。")
        return 2

    return subprocess.call([*py, GUI])


if __name__ == "__main__":
    try:
        code = main()
    except Exception as e:  # noqa: BLE001
        print(f"[程序异常] {type(e).__name__}: {e}")
        code = 9
    sys.exit(code)
