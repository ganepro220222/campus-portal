#!/usr/bin/env python3
"""路径命名单元测试（无 trimesh 依赖）：python glb_paths.test.py"""
from __future__ import annotations

import os
import sys
import tempfile
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from glb_paths import (  # noqa: E402
    CROSS_ROOT_BATCH,
    MAX_OUTPUT_STEM_BYTES,
    cap_output_stem,
    cross_drive_relpath,
    final_output_name_bytes,
    naming_root_from_saved_roots,
    safe_output_stem,
    safe_relpath,
)

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


def eq(a, b, msg=""):
    assert a == b, f"{msg} 期望 {b!r}，实际 {a!r}"


def ok(cond, msg=""):
    assert cond, msg


print("glb_paths tests")


@test("cross_drive_relpath 用 ntpath 解析 Windows 盘符（Linux CI 可验证）")
def _():
    import ntpath
    eq(cross_drive_relpath(r"D:\B\model.glb", ntpath), "D__B__model.glb")
    eq(cross_drive_relpath(r"E:\B\model.glb", ntpath), "E__B__model.glb")
    ok(cross_drive_relpath(r"D:\B\model.glb", ntpath) != cross_drive_relpath(r"E:\B\model.glb", ntpath))


@test("cross_drive_relpath 规范化 UNC share 前缀")
def _():
    import ntpath
    a = cross_drive_relpath(r"\\serverA\share\B\model.glb", ntpath)
    b = cross_drive_relpath(r"\\serverB\archive\B\model.glb", ntpath)
    eq(a, "serverA__share__B__model.glb")
    eq(b, "serverB__archive__B__model.glb")
    ok(a != b)
    ok(not a.startswith("\\\\"), a)


@test("safe_relpath 在 relpath 失败时生成盘符标签且不含 ..")
def _():
    with patch("glb_paths.os.path.relpath", side_effect=ValueError("cross")):
        rel = safe_relpath(r"D:\B\model.glb", r"C:\A")
        ok(rel.startswith("D__"), rel)
        ok(".." not in rel)
        ok("B__model" in rel, rel)


@test("safe_relpath 跨盘同名文件得到不同标识")
def _():
    with patch("glb_paths.os.path.relpath", side_effect=ValueError("cross")):
        a = safe_relpath(r"D:\B\model.glb", r"C:\A")
        b = safe_relpath(r"E:\B\model.glb", r"C:\A")
        ok(a != b)
        eq(safe_output_stem(r"D:\B\model.glb", r"C:\A"), "D__B__model")
        eq(safe_output_stem(r"E:\B\model.glb", r"C:\A"), "E__B__model")


@test("cap_output_stem 限制深层 ASCII 路径长度")
def _():
    parts = ["seg"] * 40
    rel = "/".join(parts) + "/model.glb"
    stem = "__".join(parts) + "__model"
    capped = cap_output_stem(stem, rel)
    ok(len(capped.encode("utf-8")) <= MAX_OUTPUT_STEM_BYTES, len(capped.encode("utf-8")))
    ok(capped.endswith("__src_" + __import__("hashlib").sha1(rel.encode()).hexdigest()[:8]))
    ok("model" in capped)


@test("cap_output_stem 多层中文路径按 UTF-8 字节截断")
def _():
    rel = "华东/" + "区域/" * 30 + "model.glb"
    stem = rel.replace("/", "__").rsplit(".", 1)[0]
    capped = cap_output_stem(stem, rel.replace("/", os.sep))
    ok(len(capped.encode("utf-8")) <= MAX_OUTPUT_STEM_BYTES)
    ok(capped != stem)


@test("截断后两个长路径仍不碰撞")
def _():
    rel_a = "a/" + "x/" * 35 + "model.glb"
    rel_b = "b/" + "x/" * 35 + "model.glb"
    stem_a = rel_a.replace("/", "__").rsplit(".", 1)[0]
    stem_b = rel_b.replace("/", "__").rsplit(".", 1)[0]
    cap_a = cap_output_stem(stem_a, rel_a)
    cap_b = cap_output_stem(stem_b, rel_b)
    ok(cap_a != cap_b)


@test("naming_root_from_saved_roots 跨 Windows 盘符返回 CROSS_ROOT_BATCH")
def _():
    roots = [r"D:\proj", r"E:\proj"]
    eq(naming_root_from_saved_roots(roots), CROSS_ROOT_BATCH)


@test("跨根批次来源路径与添加顺序无关")
def _():
    order_de = [r"D:\proj\a.glb", r"E:\proj\b.glb"]
    order_ed = list(reversed(order_de))

    def by_path(paths):
        return {p: safe_output_stem(p, CROSS_ROOT_BATCH) for p in paths}

    eq(by_path(order_de), by_path(order_ed))
    eq(by_path(order_de)[r"D:\proj\a.glb"], "D__proj__a")
    eq(by_path(order_de)[r"E:\proj\b.glb"], "E__proj__b")

    def rels_by_path(paths):
        return {p: safe_relpath(p, CROSS_ROOT_BATCH) for p in paths}

    eq(rels_by_path(order_de), rels_by_path(order_ed))


@test("跨 UNC share 批次来源路径与顺序无关")
def _():
    order_ab = [r"\\serverA\share\a.glb", r"\\serverB\archive\b.glb"]
    order_ba = list(reversed(order_ab))
    eq(naming_root_from_saved_roots([r"\\serverA\share", r"\\serverB\archive"]), CROSS_ROOT_BATCH)
    stems_a = {p: safe_output_stem(p, CROSS_ROOT_BATCH) for p in order_ab}
    stems_b = {p: safe_output_stem(p, CROSS_ROOT_BATCH) for p in order_ba}
    eq(stems_a, stems_b)
    ok(stems_a[r"\\serverA\share\a.glb"].startswith("serverA__"))
    ok(stems_a[r"\\serverB\archive\b.glb"].startswith("serverB__"))


@test("同盘不同子目录仍使用公共上层 root")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        root_a = os.path.join(tmp, "A")
        root_b = os.path.join(tmp, "B")
        naming = naming_root_from_saved_roots([root_a, root_b])
        eq(naming, os.path.abspath(tmp))


@test("最终 GLB 文件名在 Windows 单组件限制内")
def _():
    rel = "deep/" + "n/" * 50 + "model.glb"
    stem = safe_output_stem("/root/" + rel, "/root")
    total = final_output_name_bytes(stem, "deadbeef")
    ok(total <= 255, total)


print(f"\nglb_paths: {_pass} passed" + (f", {_fail} FAILED" if _fail else ""))
sys.exit(1 if _fail else 0)
