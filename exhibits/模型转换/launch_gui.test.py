#!/usr/bin/env python3
"""GUI 交付与 launch_gui 启动链测试：python launch_gui.test.py"""
from __future__ import annotations

import io
import os
import subprocess
import sys
import contextlib
from unittest.mock import MagicMock, patch

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

_pass = _fail = 0


def test(name):
    def deco(fn):
        global _pass, _fail
        try:
            fn()
            _pass += 1
            print("  ok", name)
        except Exception as e:  # noqa: BLE001
            _fail += 1
            print(" FAIL", name, "->", f"{type(e).__name__}: {e}")
        return fn
    return deco


def ok(cond, msg=""):
    if not cond:
        raise AssertionError(msg or "assertion failed")


def eq(a, b, msg=""):
    if a != b:
        raise AssertionError(msg or f"{a!r} != {b!r}")


@test("GUI 启动器指向的主程序已随交付存在")
def _():
    import launch_gui
    ok(os.path.isfile(launch_gui.GUI), launch_gui.GUI)


@test("launch_gui.main 在 GUI 文件缺失时返回 9")
def _():
    import launch_gui
    with patch.object(launch_gui, "GUI", os.path.join(HERE, "__no_such_gui__.py")):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = launch_gui.main()
        eq(rc, 9)
        ok("找不到" in buf.getvalue())


@test("launch_gui.main 缺 tkinter 时返回 3")
def _():
    import launch_gui
    ok(os.path.isfile(launch_gui.GUI), "交付文件必须先存在")
    with patch("launch_gui.pick_gui_python", return_value=(None, "no_tk")):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = launch_gui.main()
        eq(rc, 3)
        ok("tkinter" in buf.getvalue())


@test("launch_gui.main 缺依赖时返回 2")
def _():
    import launch_gui
    fake_py = [sys.executable]
    with patch("launch_gui.pick_gui_python", return_value=(fake_py, "need_deps")):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = launch_gui.main()
        eq(rc, 2)
        ok("pip install" in buf.getvalue())


@test("obj2glb_gui 在 mock tkinter 下可加载并构造 ConverterGUI")
def _():
    script = f"""
import os, sys
from unittest.mock import MagicMock
HERE = {HERE!r}
sys.path.insert(0, HERE)
for name in ("tkinter", "tkinter.ttk", "tkinter.filedialog", "tkinter.messagebox"):
    sys.modules[name] = MagicMock()
import obj2glb_gui
root = MagicMock()
obj2glb_gui.ConverterGUI(root)
print("ok")
"""
    r = subprocess.run(
        [sys.executable, "-c", script],
        cwd=HERE,
        capture_output=True,
        text=True,
        timeout=60,
    )
    ok(r.returncode == 0, f"stdout={r.stdout}\nstderr={r.stderr}")


print("launch_gui tests")
print(f"\nlaunch_gui: {_pass} passed" + (f", {_fail} FAILED" if _fail else ""))
sys.exit(1 if _fail else 0)
