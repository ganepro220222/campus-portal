#!/usr/bin/env python3
"""input_scan 单元测试：python input_scan.test.py"""
from __future__ import annotations

import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from input_scan import (  # noqa: E402
    _canonical_path,
    collect_input_files,
    input_under_excluded_output,
    output_exclusion_for_input,
)

_pass = _fail = _skip = 0


class SkipTest(Exception):
    pass


def skip(reason: str = "") -> None:
    raise SkipTest(reason)


def test(name):
    def deco(fn):
        global _pass, _fail, _skip
        try:
            fn()
            _pass += 1
            print("  ok", name)
        except SkipTest as e:
            _skip += 1
            tail = f" ({e})" if str(e) else ""
            print("  skip", name + tail)
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


@test("输出为输入真子目录 → 排除该目录")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        out = os.path.join(src, "输出GLB")
        os.makedirs(out)
        ex = output_exclusion_for_input(src, out)
        eq(ex, {os.path.abspath(out)})


@test("输出与输入相同 → 不排除")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        os.makedirs(src)
        eq(output_exclusion_for_input(src, src), set())


@test("输出为输入兄弟目录 → 不排除")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        out = os.path.join(tmp, "输出GLB")
        os.makedirs(src)
        os.makedirs(out)
        eq(output_exclusion_for_input(src, out), set())


@test("collect_input_files 跳过 exclude_dirs 内旧 GLB")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        out = os.path.join(src, "输出GLB")
        os.makedirs(out)
        open(os.path.join(src, "新.obj"), "w").write("x")
        open(os.path.join(out, "旧.glb"), "wb").write(b"x")
        ex = output_exclusion_for_input(src, out)
        got = collect_input_files(src, recursive=True, exclude_dirs=ex)
        eq(len(got), 1)
        ok(got[0].endswith("新.obj"))


@test("Windows 输入/输出路径仅大小写不同仍排除嵌套输出")
def _():
    if os.name != "nt":
        skip("非 Windows")
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "Models")
        out = os.path.join(src, "输出GLB")
        os.makedirs(out)
        open(os.path.join(out, "旧.glb"), "wb").write(b"x")
        # 仅改变盘符或路径首段大小写
        abs_src = os.path.abspath(src)
        if abs_src[1:3] == ":\\":
            alt_src = (abs_src[0].swapcase() if abs_src[0].isalpha() else abs_src[0]) + abs_src[1:]
        else:
            alt_src = abs_src
        ok(_canonical_path(alt_src) == _canonical_path(abs_src), "测试前提：大小写变体应视为同一路径")
        ex = output_exclusion_for_input(alt_src, out)
        eq(ex, {os.path.abspath(out)})
        got = collect_input_files(abs_src, recursive=True, exclude_dirs=ex)
        eq(got, [])


@test("不同盘符（模拟）→ 不排除")
def _():
    if os.name != "nt":
        skip("非 Windows")
    ex = output_exclusion_for_input("C:\\Models", "D:\\Models\\输出GLB")
    eq(ex, set())


@test("input_under_excluded_output 识别输出目录内文件")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        out = os.path.join(src, "输出GLB")
        os.makedirs(out)
        old = os.path.join(out, "old.glb")
        open(old, "wb").write(b"x")
        ok(input_under_excluded_output(old, src, out))
        ok(not input_under_excluded_output(os.path.join(src, "a.obj"), src, out))


print("input_scan tests")
print(f"\ninput_scan: {_pass} passed" + (f", {_skip} skipped" if _skip else "")
      + (f", {_fail} FAILED" if _fail else ""))
sys.exit(1 if _fail else 0)
