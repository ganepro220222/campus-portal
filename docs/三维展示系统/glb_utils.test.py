#!/usr/bin/env python3
"""
glb_utils 单元测试：python glb_utils.test.py

纯函数部分（MTL 解析 / 体检 / GLB 读写与修复）不依赖 trimesh；
末尾的端到端用例需要 trimesh，缺失时自动跳过。
"""
from __future__ import annotations

import json
import os
import struct
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

_pass = _fail = _skip = 0


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


def skip(name, why):
    global _skip
    _skip += 1
    print(" skip", name, "-", why)


def eq(a, b, msg=""):
    assert a == b, f"{msg} 期望 {b!r}，实际 {a!r}"


def ok(cond, msg=""):
    assert cond, msg


try:
    from glb_utils import (  # noqa: E402
        OBJ_DEFAULT_METALLIC,
        OBJ_FALLBACK_ROUGHNESS,
        audit_gltf,
        find_mtl_for_obj,
        find_mtls_for_obj,
        fix_glb_file,
        format_audit,
        hash_obj_bundle,
        obj_declares_normals,
        parse_mtl_normal_maps,
        parse_obj_normal_maps,
        patch_gltf_materials,
        read_glb,
        write_glb,
    )
except SystemExit as e:  # glb_utils 在缺依赖时 SystemExit
    print(f"无法导入 glb_utils：{e}")
    sys.exit(1)

print("glb_utils tests")


# ── MTL 法线贴图解析 ──────────────────────────────────────────────

def _mtl(tmp, text, files=("n.png", "b.png", "d.jpg")):
    for fn in files:
        open(os.path.join(tmp, fn), "wb").write(b"x")
    path = os.path.join(tmp, "m.mtl")
    open(path, "w", encoding="utf-8").write(text)
    return path


@test("按材质名分别解析法线贴图")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        p = _mtl(tmp, "newmtl a\nmap_Kd d.jpg\nnorm n.png\nnewmtl b\nbump b.png\n")
        maps = parse_mtl_normal_maps(p)
        eq(sorted(maps), ["a", "b"])
        eq(os.path.basename(maps["a"]), "n.png")
        eq(os.path.basename(maps["b"]), "b.png")


@test("norm 优先于 bump（前者才是真法线图）")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        p = _mtl(tmp, "newmtl a\nbump b.png\nnorm n.png\n")
        eq(os.path.basename(parse_mtl_normal_maps(p)["a"]), "n.png")
        p2 = _mtl(tmp, "newmtl a\nnorm n.png\nbump b.png\n")
        eq(os.path.basename(parse_mtl_normal_maps(p2)["a"]), "n.png")


@test("认识 -bm 等参数与引号路径")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        p = _mtl(tmp, 'newmtl a\nmap_Bump -bm 0.5 n.png\n')
        eq(os.path.basename(parse_mtl_normal_maps(p)["a"]), "n.png")
        os.rename(os.path.join(tmp, "n.png"), os.path.join(tmp, "my map.png"))
        p2 = _mtl(tmp, 'newmtl a\nnorm "my map.png"\n', files=())
        eq(os.path.basename(parse_mtl_normal_maps(p2)["a"]), "my map.png")


@test("贴图文件不存在 / 文件缺失 / 注释行 都不炸")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        p = _mtl(tmp, "# 注释\nnewmtl a\nnorm 不存在.png\n")
        eq(parse_mtl_normal_maps(p), {})
    eq(parse_mtl_normal_maps(""), {})
    eq(parse_mtl_normal_maps("/nope/x.mtl"), {})


@test("diffuse 不会被当成法线贴图")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        p = _mtl(tmp, "newmtl a\nmap_Kd d.jpg\n")
        eq(parse_mtl_normal_maps(p), {})


# ── OBJ 法线声明检测 ─────────────────────────────────────────────

@test("识别 OBJ 是否自带 vn，且不误判 v/vt")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        a = os.path.join(tmp, "a.obj")
        open(a, "w").write("v 0 0 0\nvt 0 0\nf 1 1 1\n")
        eq(obj_declares_normals(a), False)
        b = os.path.join(tmp, "b.obj")
        open(b, "w").write("v 0 0 0\nvn 0 1 0\n")
        eq(obj_declares_normals(b), True)
        c = os.path.join(tmp, "c.obj")
        open(c, "w").write("vnsomething 1\n")   # 不是 vn 指令
        eq(obj_declares_normals(c), False)
    eq(obj_declares_normals("/nope.obj"), False)


@test("从 OBJ 找到 mtllib")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        open(os.path.join(tmp, "m.mtl"), "w").write("newmtl a\n")
        o = os.path.join(tmp, "a.obj")
        open(o, "w").write("mtllib m.mtl\nv 0 0 0\n")
        eq(os.path.basename(find_mtl_for_obj(o)), "m.mtl")
        eq([os.path.basename(p) for p in find_mtls_for_obj(o)], ["m.mtl"])
        o2 = os.path.join(tmp, "b.obj")
        open(o2, "w").write("mtllib 不存在.mtl\n")
        eq(find_mtl_for_obj(o2), None)
        eq(find_mtls_for_obj(o2), [])


@test("多条 mtllib 与同行多个 MTL 全部解析")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        open(os.path.join(tmp, "a.mtl"), "w", encoding="utf-8").write("newmtl A\nnorm na.png\n")
        open(os.path.join(tmp, "b.mtl"), "w", encoding="utf-8").write("newmtl B\nnorm nb.png\n")
        open(os.path.join(tmp, "na.png"), "wb").write(b"x")
        open(os.path.join(tmp, "nb.png"), "wb").write(b"x")
        o = os.path.join(tmp, "multi.obj")
        open(o, "w", encoding="utf-8").write("mtllib a.mtl\nmtllib b.mtl\nv 0 0 0\n")
        eq([os.path.basename(p) for p in find_mtls_for_obj(o)], ["a.mtl", "b.mtl"])
        maps = parse_obj_normal_maps(o)
        eq(set(maps.keys()), {"A", "B"})
        eq(os.path.basename(maps["A"]), "na.png")
        eq(os.path.basename(maps["B"]), "nb.png")
        o2 = os.path.join(tmp, "inline.obj")
        open(o2, "w", encoding="utf-8").write("mtllib a.mtl b.mtl\nv 0 0 0\n")
        eq([os.path.basename(p) for p in find_mtls_for_obj(o2)], ["a.mtl", "b.mtl"])


@test("hash_obj_bundle 纳入全部 MTL 贴图")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        open(os.path.join(tmp, "a.mtl"), "w").write("newmtl A\nmap_Kd da.jpg\n")
        open(os.path.join(tmp, "b.mtl"), "w").write("newmtl B\nmap_Kd db.jpg\n")
        open(os.path.join(tmp, "da.jpg"), "wb").write(b"a")
        open(os.path.join(tmp, "db.jpg"), "wb").write(b"b")
        o = os.path.join(tmp, "t.obj")
        open(o, "w").write("mtllib a.mtl\nmtllib b.mtl\nv 0 0 0\n")
        h1 = hash_obj_bundle(o)
        open(os.path.join(tmp, "db.jpg"), "wb").write(b"b2")
        h2 = hash_obj_bundle(o)
        ok(h1 != h2, "次要 MTL 贴图变更应影响 bundle 哈希")


# ── 体检 ────────────────────────────────────────────────────────

def _gltf(materials=None, prim_attrs=None, indices_count=30, images=1, **kw):
    attrs = {"POSITION": 0} if prim_attrs is None else prim_attrs
    g = {
        "materials": materials if materials is not None else [
            {"pbrMetallicRoughness": {"metallicFactor": 0.0, "roughnessFactor": 0.5}}
        ],
        "meshes": [{"primitives": [{"attributes": attrs, "indices": 1}]}],
        "accessors": [{"count": 12}, {"count": indices_count}],
        "images": [{"bufferView": 0} for _ in range(images)],
        "buffers": [{"byteLength": 100}],
    }
    g.update(kw)
    return g


def codes(report, level=None):
    return {i["code"] for i in report["issues"] if level is None or i["level"] == level}


@test("缺 metallicFactor → 报 error（这就是模型发黑的根因）")
def _():
    r = audit_gltf(_gltf(materials=[{"pbrMetallicRoughness": {"roughnessFactor": 0.5}}],
                         prim_attrs={"POSITION": 0, "NORMAL": 2}))
    ok("metallic" in codes(r, "error"))
    ok("缺省=1.0" in [i["text"] for i in r["issues"] if i["code"] == "metallic"][0])


@test("metallicFactor 过高也报，但有金属度贴图时放行")
def _():
    high = audit_gltf(_gltf(materials=[{"pbrMetallicRoughness": {"metallicFactor": 1.0, "roughnessFactor": 0.4}}],
                            prim_attrs={"POSITION": 0, "NORMAL": 2}))
    ok("metallic" in codes(high, "error"))
    textured = audit_gltf(_gltf(
        materials=[{"pbrMetallicRoughness": {"metallicFactor": 1.0, "roughnessFactor": 0.4,
                                             "metallicRoughnessTexture": {"index": 0}}}],
        prim_attrs={"POSITION": 0, "NORMAL": 2}))
    ok("metallic" not in codes(textured))


@test("正常资产不报 error")
def _():
    r = audit_gltf(_gltf(prim_attrs={"POSITION": 0, "NORMAL": 2, "TEXCOORD_0": 3}))
    eq(codes(r, "error"), set())


@test("缺 NORMAL → 报 error 并说明会变多面体")
def _():
    r = audit_gltf(_gltf(prim_attrs={"POSITION": 0, "TEXCOORD_0": 3}))
    ok("normal" in codes(r, "error"))
    ok("多面体" in [i["text"] for i in r["issues"] if i["code"] == "normal"][0])


@test("有贴图却没 UV → 警告")
def _():
    r = audit_gltf(_gltf(prim_attrs={"POSITION": 0, "NORMAL": 2}, images=1))
    ok("uv" in codes(r, "warn"))
    r2 = audit_gltf(_gltf(prim_attrs={"POSITION": 0, "NORMAL": 2}, images=0))
    ok("uv" not in codes(r2))


@test("外链 buffer / 外链贴图 → error")
def _():
    r = audit_gltf(_gltf(prim_attrs={"POSITION": 0, "NORMAL": 2},
                         buffers=[{"uri": "a.bin"}]))
    ok("buffer" in codes(r, "error"))
    r2 = audit_gltf(_gltf(prim_attrs={"POSITION": 0, "NORMAL": 2}))
    r2_g = _gltf(prim_attrs={"POSITION": 0, "NORMAL": 2})
    r2_g["images"] = [{"uri": "t.png"}]
    ok("image" in codes(audit_gltf(r2_g), "error"))
    ok("image" not in codes(r2))


@test("三角面按 indices 统计；面数过多给警告")
def _():
    r = audit_gltf(_gltf(prim_attrs={"POSITION": 0, "NORMAL": 2, "TEXCOORD_0": 3}, indices_count=300))
    eq(r["info"]["triangles"], 100)
    big = audit_gltf(_gltf(prim_attrs={"POSITION": 0, "NORMAL": 2, "TEXCOORD_0": 3},
                           indices_count=3_000_000))
    ok("tris" in codes(big, "warn"))


@test("空 glTF 不抛异常")
def _():
    r = audit_gltf({})
    eq(r["info"]["triangles"], 0)
    ok(isinstance(r["issues"], list))


@test("format_audit：错误排在提示之前，且始终有统计行")
def _():
    r = audit_gltf(_gltf(materials=[{"pbrMetallicRoughness": {}}], prim_attrs={"POSITION": 0}))
    text = format_audit(r)
    lines = text.split("\n")
    ok("三角面" in lines[0])
    first_note = next((i for i, ln in enumerate(lines) if ln.strip().startswith("·")), len(lines))
    last_err = max(i for i, ln in enumerate(lines) if ln.strip().startswith("✗"))
    ok(last_err < first_note, "error 应排在 note 之前")
    eq(format_audit(audit_gltf(_gltf(prim_attrs={"POSITION": 0, "NORMAL": 2, "TEXCOORD_0": 3},
                                     images=0))).count("✓"), 0)


# ── JSON 修复 ───────────────────────────────────────────────────

@test("补写缺失的 metallicFactor 与 roughnessFactor")
def _():
    g, notes = patch_gltf_materials({"materials": [{"pbrMetallicRoughness": {}}]})
    pbr = g["materials"][0]["pbrMetallicRoughness"]
    eq(pbr["metallicFactor"], OBJ_DEFAULT_METALLIC)
    eq(pbr["roughnessFactor"], OBJ_FALLBACK_ROUGHNESS)
    eq(len(notes), 2)


@test("已经正确的材质不改动，也不产生噪音 note")
def _():
    src = {"materials": [{"pbrMetallicRoughness": {"metallicFactor": 0.0, "roughnessFactor": 0.5}}]}
    g, notes = patch_gltf_materials(src)
    eq(notes, [])
    eq(g["materials"][0]["pbrMetallicRoughness"]["roughnessFactor"], 0.5)


@test("有 metallicRoughnessTexture 的正经 PBR 资产不碰")
def _():
    src = {"materials": [{"pbrMetallicRoughness": {
        "metallicFactor": 1.0, "metallicRoughnessTexture": {"index": 0}}}]}
    g, notes = patch_gltf_materials(src)
    eq(notes, [])
    eq(g["materials"][0]["pbrMetallicRoughness"]["metallicFactor"], 1.0)


@test("无 materials 字段不抛异常")
def _():
    g, notes = patch_gltf_materials({})
    eq(notes, [])


# ── GLB 读写 ────────────────────────────────────────────────────

def _make_glb(path, gltf, binary=b"\x01\x02\x03"):
    jb = json.dumps(gltf).encode()
    jb += b" " * ((4 - len(jb) % 4) % 4)
    bb = binary + b"\x00" * ((4 - len(binary) % 4) % 4)
    total = 12 + 8 + len(jb) + 8 + len(bb)
    with open(path, "wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, total))
        f.write(struct.pack("<I4s", len(jb), b"JSON") + jb)
        f.write(struct.pack("<I4s", len(bb), b"BIN\x00") + bb)


@test("GLB 读写往返：JSON 与 BIN 均无损，块 4 字节对齐")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        p = os.path.join(tmp, "a.glb")
        payload = {"materials": [{"name": "中文材质"}], "asset": {"version": "2.0"}}
        _make_glb(p, payload, b"\x01\x02\x03\x04\x05")
        gltf, binary = read_glb(p)
        eq(gltf["materials"][0]["name"], "中文材质")
        q = os.path.join(tmp, "b.glb")
        write_glb(q, gltf, binary)
        gltf2, binary2 = read_glb(q)
        eq(gltf2, gltf)
        eq(binary2[:5], b"\x01\x02\x03\x04\x05")
        data = open(q, "rb").read()
        eq(struct.unpack("<I", data[8:12])[0], len(data), "header 总长应与文件长一致")
        jlen = struct.unpack("<I", data[12:16])[0]
        eq(jlen % 4, 0, "JSON 块须 4 字节对齐")
        eq(struct.unpack("<I", data[20 + jlen:24 + jlen])[0] % 4, 0, "BIN 块须 4 字节对齐")


@test("非 GLB / 截断文件 安全返回 None")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        p = os.path.join(tmp, "x.glb")
        open(p, "wb").write(b"not a glb at all")
        eq(read_glb(p), None)
        q = os.path.join(tmp, "y.glb")
        open(q, "wb").write(struct.pack("<4sII", b"glTF", 2, 999) + b"\x00" * 4)
        eq(read_glb(q), None)


@test("合法头但 malformed JSON chunk 安全返回 None")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        p = os.path.join(tmp, "bad-json.glb")
        bad_json = b"{not valid json"
        bad_json += b" " * ((4 - len(bad_json) % 4) % 4)
        total = 12 + 8 + len(bad_json)
        with open(p, "wb") as f:
            f.write(struct.pack("<4sII", b"glTF", 2, total))
            f.write(struct.pack("<I4s", len(bad_json), b"JSON") + bad_json)
        eq(read_glb(p), None)
        changed, notes = fix_glb_file(p)
        eq(changed, False)
        ok(notes and "GLB" in notes[0])


@test("无 BIN 块的 GLB 也能读写")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        p = os.path.join(tmp, "a.glb")
        write_glb(p, {"asset": {"version": "2.0"}}, b"")
        gltf, binary = read_glb(p)
        eq(binary, b"")
        eq(gltf["asset"]["version"], "2.0")


@test("fix_glb_file：修复坏文件、保住 BIN、且第二次运行幂等")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        p = os.path.join(tmp, "bad.glb")
        _make_glb(p, {"materials": [{"pbrMetallicRoughness": {"baseColorFactor": [1, 1, 1, 1]}}]},
                  b"\xaa\xbb\xcc\xdd")
        changed, notes = fix_glb_file(p)
        ok(changed and notes)
        gltf, binary = read_glb(p)
        eq(gltf["materials"][0]["pbrMetallicRoughness"]["metallicFactor"], OBJ_DEFAULT_METALLIC)
        eq(binary[:4], b"\xaa\xbb\xcc\xdd", "BIN 必须原样保留")
        changed2, notes2 = fix_glb_file(p)
        eq(changed2, False, "第二次应无需修复")
        eq(notes2, ["无需修复"])


@test("fix_glb_file：坏文件安全失败，另存不动原文件")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        p = os.path.join(tmp, "x.glb")
        open(p, "wb").write(b"garbage")
        changed, notes = fix_glb_file(p)
        eq(changed, False)
        ok("GLB" in notes[0])

        src = os.path.join(tmp, "s.glb")
        dst = os.path.join(tmp, "d.glb")
        _make_glb(src, {"materials": [{"pbrMetallicRoughness": {}}]})
        before = open(src, "rb").read()
        fix_glb_file(src, dst)
        eq(open(src, "rb").read(), before, "另存模式不应改动原文件")
        ok(os.path.isfile(dst))


# ── 端到端（需要 trimesh） ────────────────────────────────────────

try:
    import trimesh  # noqa: F401
    from PIL import Image
    _HAS_TRIMESH = True
except Exception:  # noqa: BLE001
    _HAS_TRIMESH = False


def _write_obj_bundle(tmp, with_vn: bool, with_normal_map: bool):
    import trimesh as _tm
    m = _tm.creation.icosphere(subdivisions=1)
    Image.new("RGB", (32, 32), (200, 160, 120)).save(os.path.join(tmp, "d.jpg"))
    mtl = "newmtl mat0\nKd 0.8 0.7 0.6\nNs 60\nmap_Kd d.jpg\n"
    if with_normal_map:
        Image.new("RGB", (32, 32), (128, 128, 255)).save(os.path.join(tmp, "n.png"))
        mtl += "norm n.png\n"
    open(os.path.join(tmp, "m.mtl"), "w").write(mtl)

    lines = ["mtllib m.mtl", "usemtl mat0"]
    for v in m.vertices:
        lines.append("v %f %f %f" % tuple(v))
    if with_vn:
        for v in m.vertex_normals:
            lines.append("vn %f %f %f" % tuple(v))
    lines.append("vt 0 0")
    for f in m.faces:
        if with_vn:
            lines.append("f %d/1/%d %d/1/%d %d/1/%d" % (f[0]+1, f[0]+1, f[1]+1, f[1]+1, f[2]+1, f[2]+1))
        else:
            lines.append("f %d/1 %d/1 %d/1" % (f[0]+1, f[1]+1, f[2]+1))
    obj = os.path.join(tmp, "t.obj")
    open(obj, "w").write("\n".join(lines) + "\n")
    return obj


def _convert(obj, out, **kw):
    """转换并吞掉进度输出，保持测试结果可读。"""
    import contextlib
    import io as _io
    import obj2glb
    with contextlib.redirect_stdout(_io.StringIO()):
        return obj2glb.convert(obj, output_path=out, **kw)


if not _HAS_TRIMESH:
    skip("端到端：OBJ → GLB", "未安装 trimesh")
else:
    @test("端到端：转出的 GLB 一定写了 metallicFactor=0（不再是全金属）")
    def _():
        with tempfile.TemporaryDirectory() as tmp:
            obj = _write_obj_bundle(tmp, with_vn=True, with_normal_map=False)
            out = os.path.join(tmp, "o.glb")
            ok(_convert(obj, out))
            gltf, _ = read_glb(out)
            eq(gltf["materials"][0]["pbrMetallicRoughness"]["metallicFactor"], 0.0)
            ok(gltf["materials"][0]["pbrMetallicRoughness"].get("roughnessFactor") is not None)

    @test("端到端：源无 vn 也会带上 NORMAL（不会变多面体）")
    def _():
        with tempfile.TemporaryDirectory() as tmp:
            obj = _write_obj_bundle(tmp, with_vn=False, with_normal_map=False)
            eq(obj_declares_normals(obj), False)
            out = os.path.join(tmp, "o.glb")
            ok(_convert(obj, out))
            gltf, _ = read_glb(out)
            ok("NORMAL" in gltf["meshes"][0]["primitives"][0]["attributes"])

    @test("端到端：MTL 里的法线贴图会被接上，不再静默丢弃")
    def _():
        with tempfile.TemporaryDirectory() as tmp:
            obj = _write_obj_bundle(tmp, with_vn=True, with_normal_map=True)
            out = os.path.join(tmp, "o.glb")
            ok(_convert(obj, out))
            gltf, _ = read_glb(out)
            ok("normalTexture" in gltf["materials"][0], "应有 normalTexture")
            eq(len(gltf["images"]), 2, "应有 baseColor + normal 两张图")

            out2 = os.path.join(tmp, "o2.glb")
            ok(_convert(obj, out2, keep_normal_map=False))
            g2, _ = read_glb(out2)
            ok("normalTexture" not in g2["materials"][0], "--no-normal-map 时不应接")

    @test("端到端：产物通过体检，且无 error")
    def _():
        with tempfile.TemporaryDirectory() as tmp:
            obj = _write_obj_bundle(tmp, with_vn=True, with_normal_map=True)
            out = os.path.join(tmp, "o.glb")
            ok(_convert(obj, out))
            gltf, _ = read_glb(out)
            eq(codes(audit_gltf(gltf), "error"), set())


print(f"\nglb_utils: {_pass} passed"
      + (f", {_fail} FAILED" if _fail else "")
      + (f", {_skip} skipped" if _skip else ""))
sys.exit(1 if _fail else 0)
