#!/usr/bin/env python3
"""batch_glb 集成测试：python batch_glb.test.py"""
from __future__ import annotations

import json
import os
import struct
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

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


try:
    import trimesh
    from batch_glb import process_one
    from glb_utils import read_glb, write_glb
except Exception as e:  # noqa: BLE001
    print(f"无法导入 batch_glb：{e}")
    sys.exit(1)

print("batch_glb tests")


def _make_malformed_json_glb(path: str) -> None:
    bad_json = b"{broken"
    bad_json += b" " * ((4 - len(bad_json) % 4) % 4)
    total = 12 + 8 + len(bad_json)
    with open(path, "wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, total))
        f.write(struct.pack("<I4s", len(bad_json), b"JSON") + bad_json)


def _make_box_glb(path: str, metallic: float | None = None) -> None:
    trimesh.Scene(trimesh.creation.box()).export(path)
    parsed = read_glb(path)
    ok(parsed is not None)
    gltf, binary = parsed
    if not gltf.get("materials"):
        gltf["materials"] = [{"pbrMetallicRoughness": {}}]
    for m in gltf["materials"]:
        pbr = m.setdefault("pbrMetallicRoughness", {})
        if metallic is None:
            pbr.pop("metallicFactor", None)
        else:
            pbr["metallicFactor"] = metallic
    write_glb(path, gltf, binary)


@test("malformed JSON GLB 单文件失败且不抛异常")
def _():
    with tempfile.TemporaryDirectory() as inp, tempfile.TemporaryDirectory() as out:
        bad = os.path.join(inp, "bad.glb")
        _make_malformed_json_glb(bad)
        r = process_one(bad, inp, out, None, 85, "auto", True, False, True, "auto", 0.37, True, True)
        eq(r["状态"], "失败")
        ok("GLB" in r["备注"] or "格式校验" in r["备注"])


@test("坏文件后好文件仍可处理")
def _():
    with tempfile.TemporaryDirectory() as inp, tempfile.TemporaryDirectory() as out:
        _make_malformed_json_glb(os.path.join(inp, "1-bad.glb"))
        good = os.path.join(inp, "2-good.glb")
        _make_box_glb(good, metallic=1.0)
        r1 = process_one(os.path.join(inp, "1-bad.glb"), inp, out, None, 85, "auto", True, False, True, "auto", 0.37, True, True)
        r2 = process_one(good, inp, out, None, 85, "auto", True, False, True, "auto", 0.37, True, True)
        eq(r1["状态"], "失败")
        ok(r2["状态"].startswith("成功"))
        ok(r2["GLB文件"])


@test("GLB 修复路径转发 --metallic")
def _():
    with tempfile.TemporaryDirectory() as inp, tempfile.TemporaryDirectory() as out:
        src = os.path.join(inp, "m.glb")
        _make_box_glb(src, metallic=None)
        r = process_one(src, inp, out, None, 85, "auto", True, False, True, "auto", 0.37, True, True)
        ok(r["状态"].startswith("成功"), r.get("备注"))
        final = os.path.join(out, r["GLB文件"])
        gltf, _ = read_glb(final)
        mf = gltf["materials"][0]["pbrMetallicRoughness"]["metallicFactor"]
        eq(mf, 0.37)


@test("main() 返回失败计数供 convert_cli 判断部分失败")
def _():
    with tempfile.TemporaryDirectory() as inp, tempfile.TemporaryDirectory() as out:
        bad_json = b"{broken"
        bad_json += b" " * ((4 - len(bad_json) % 4) % 4)
        total = 12 + 8 + len(bad_json)
        with open(os.path.join(inp, "bad.glb"), "wb") as f:
            f.write(struct.pack("<4sII", b"glTF", 2, total))
            f.write(struct.pack("<I4s", len(bad_json), b"JSON") + bad_json)
        import contextlib, io as _io
        import batch_glb
        saved = sys.argv
        sys.argv = ["batch_glb.py", inp, "-o", out]
        try:
            with contextlib.redirect_stdout(_io.StringIO()):
                fail = batch_glb.main()
        finally:
            sys.argv = saved
        eq(fail, 1)


@test("无效 GLB 的具体 fix 原因写入备注")
def _():
    with tempfile.TemporaryDirectory() as inp, tempfile.TemporaryDirectory() as out:
        src = os.path.join(inp, "x.glb")
        open(src, "wb").write(b"garbage")
        r = process_one(src, inp, out, None, 85, "auto", True, False, True, "auto", 0.0, True, True)
        eq(r["状态"], "失败")
        ok("不是有效的 GLB" in r["备注"] or "GLB 格式校验" in r["备注"])


print(f"\n{_pass} passed, {_fail} failed")
sys.exit(1 if _fail else 0)
