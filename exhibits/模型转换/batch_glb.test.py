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


@test("首文件读盘失败时 manifest 列齐全且第二文件仍可成功")
def _():
    import contextlib, io as _io
    import batch_glb
    from unittest.mock import patch

    calls = {"n": 0}
    orig_sha1 = batch_glb.file_sha1

    def fake_sha1(p):
        if os.path.basename(p) == "unreadable.glb":
            raise OSError("模拟读盘失败")
        return orig_sha1(p)

    with tempfile.TemporaryDirectory() as inp, tempfile.TemporaryDirectory() as out:
        open(os.path.join(inp, "unreadable.glb"), "wb").write(b"x")
        good = os.path.join(inp, "z-good.glb")
        _make_box_glb(good)
        saved = sys.argv
        sys.argv = ["batch_glb.py", inp, "-o", out]
        try:
            with patch.object(batch_glb, "file_sha1", side_effect=fake_sha1):
                with contextlib.redirect_stdout(_io.StringIO()):
                    fail = batch_glb.main()
        finally:
            sys.argv = saved
        eq(fail, 1)
        manifest = os.path.join(out, "manifest.csv")
        ok(os.path.isfile(manifest))
        import csv
        with open(manifest, encoding="utf-8-sig") as f:
            rows = list(csv.DictReader(f))
        eq(len(rows), 2)
        eq(list(rows[0].keys()), batch_glb.RESULT_FIELDS)
        eq(rows[0]["状态"], "失败")
        ok(rows[1]["状态"].startswith("成功"))


@test("GLB + --double-sided 写入输出 GLB 的 doubleSided")
def _():
    with tempfile.TemporaryDirectory() as inp, tempfile.TemporaryDirectory() as out:
        src = os.path.join(inp, "m.glb")
        _make_box_glb(src, metallic=0.0)
        r = process_one(
            src, inp, out, None, 85, "auto", True, False, True,
            normals="auto", metallic=0.0, keep_normal_map=True, fix_glb=True, double_sided=True,
        )
        ok(r["状态"].startswith("成功"), r.get("备注"))
        final = os.path.join(out, r["GLB文件"])
        gltf, _ = read_glb(final)
        ok(all(m.get("doubleSided") is True for m in gltf.get("materials", [])))


@test("GLB 未传 double_sided 时保留已有 doubleSided")
def _():
    with tempfile.TemporaryDirectory() as inp, tempfile.TemporaryDirectory() as out:
        src = os.path.join(inp, "m.glb")
        _make_box_glb(src, metallic=0.0)
        parsed = read_glb(src)
        gltf, binary = parsed
        for m in gltf.get("materials", []):
            m["doubleSided"] = False
        write_glb(src, gltf, binary)
        r = process_one(
            src, inp, out, None, 85, "auto", True, False, True,
            normals="auto", metallic=0.0, keep_normal_map=True, fix_glb=True, double_sided=None,
        )
        ok(r["状态"].startswith("成功"))
        final = os.path.join(out, r["GLB文件"])
        gltf2, _ = read_glb(final)
        ok(all(m.get("doubleSided") is False for m in gltf2.get("materials", [])))


@test("GLB + --no-fix + double_sided 仍写入 doubleSided")
def _():
    with tempfile.TemporaryDirectory() as inp, tempfile.TemporaryDirectory() as out:
        src = os.path.join(inp, "m.glb")
        _make_box_glb(src, metallic=1.0)
        r = process_one(
            src, inp, out, None, 85, "auto", True, False, True,
            normals="auto", metallic=0.0, keep_normal_map=True, fix_glb=False, double_sided=True,
        )
        ok(r["状态"].startswith("成功"), r.get("备注"))
        final = os.path.join(out, r["GLB文件"])
        gltf, _ = read_glb(final)
        ok(all(m.get("doubleSided") is True for m in gltf.get("materials", [])))
        mf = gltf["materials"][0]["pbrMetallicRoughness"].get("metallicFactor")
        eq(mf, 1.0, "no-fix 时不应改 metallicFactor")


@test("ZIP 内 GLB + double_sided 写入输出")
def _():
    import zipfile
    with tempfile.TemporaryDirectory() as inp, tempfile.TemporaryDirectory() as out:
        inner = os.path.join(inp, "inner.glb")
        _make_box_glb(inner, metallic=0.0)
        zpath = os.path.join(inp, "pkg.zip")
        with zipfile.ZipFile(zpath, "w") as zf:
            zf.write(inner, "inner.glb")
        r = process_one(
            zpath, inp, out, None, 85, "auto", True, False, True,
            normals="auto", metallic=0.0, keep_normal_map=True, fix_glb=True, double_sided=True,
        )
        ok(r["状态"].startswith("成功"), r.get("备注"))
        final = os.path.join(out, r["GLB文件"])
        gltf, _ = read_glb(final)
        ok(all(m.get("doubleSided") is True for m in gltf.get("materials", [])))


@test("malformed GLB + double_sided 安全失败")
def _():
    with tempfile.TemporaryDirectory() as inp, tempfile.TemporaryDirectory() as out:
        bad = os.path.join(inp, "bad.glb")
        _make_malformed_json_glb(bad)
        r = process_one(
            bad, inp, out, None, 85, "auto", True, False, True,
            normals="auto", metallic=0.0, keep_normal_map=True, fix_glb=True, double_sided=True,
        )
        eq(r["状态"], "失败")


@test("main() --double-sided 传给 process_one")
def _():
    import contextlib, io as _io
    import batch_glb
    from unittest.mock import patch

    captured = []

    def _fake(src, input_root, out_dir, *a, **kw):
        captured.append(kw.get("double_sided"))
        r = batch_glb.empty_result(src, input_root)
        r.update({"状态": "成功", "GLB文件": "x.glb", "体积MB": 1.0, "scale": ""})
        return r

    with tempfile.TemporaryDirectory() as inp, tempfile.TemporaryDirectory() as out:
        open(os.path.join(inp, "a.glb"), "wb").write(b"x")
        saved = sys.argv
        sys.argv = ["batch_glb.py", inp, "-o", out, "--double-sided"]
        try:
            with patch.object(batch_glb, "process_one", side_effect=_fake):
                with contextlib.redirect_stdout(_io.StringIO()):
                    batch_glb.main()
        finally:
            sys.argv = saved
        eq(captured, [True])


@test("empty_result 与 RESULT_FIELDS 一致")
def _():
    import batch_glb
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, "x.glb")
        open(p, "wb").write(b"x")
        r = batch_glb.empty_result(p, d)
        eq(list(r.keys()), batch_glb.RESULT_FIELDS)


print(f"\n{_pass} passed, {_fail} failed")
sys.exit(1 if _fail else 0)
