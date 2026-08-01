#!/usr/bin/env python3
"""
转换入口测试：python convert_cli.test.py

覆盖两块：
  1. convert_cli 的路径规整与校验（合伙人最容易踩的：拖拽带引号、路径写错、输入=输出）
  2. 转换模型.bat 的结构（CRLF、无 delayed expansion、无括号 if 块、退出码分支齐全）
     —— 这些正是本仓库 bat 曾经闪退的真实原因，不能只靠肉眼。
"""
from __future__ import annotations

import os
import re
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.dirname(os.path.abspath(__file__))
BAT = os.path.join(HERE, "转换模型.bat")

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


from convert_cli import clean_path, missing_packages, resolve_io  # noqa: E402

print("convert_cli tests")


# ── 路径规整 ─────────────────────────────────────────────────

@test("Windows 拖拽带的引号会被剥掉")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        eq(clean_path(f'"{tmp}"'), os.path.abspath(tmp))
        eq(clean_path(f"'{tmp}'"), os.path.abspath(tmp))
        eq(clean_path(f'  "{tmp}"  '), os.path.abspath(tmp))


@test("空输入不炸，返回空串")
def _():
    eq(clean_path(""), "")
    eq(clean_path("   "), "")
    eq(clean_path(None), "")


@test("单侧引号不会误删字符")
def _():
    got = clean_path('C:\\a"b')
    ok(got.endswith('a"b'), got)


# ── 输入 / 输出校验 ──────────────────────────────────────────

@test("输入为空 → 明确报「没有填输入文件夹」")
def _():
    _, _, err = resolve_io("", "")
    ok(err and "没有填" in err, err)


@test("输入目录不存在 → 报错且带上路径")
def _():
    src, _, err = resolve_io(os.path.join(tempfile.gettempdir(), "绝不存在的目录_zzz"), "")
    ok(err and "不存在" in err, err)
    ok(src, "应回显用户填的路径便于排查")


@test("输出留空 → 自动放在输入文件夹旁边，不混进素材里")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        os.makedirs(src)
        s, d, err = resolve_io(src, "")
        eq(err, None)
        eq(os.path.dirname(d), os.path.abspath(tmp))
        ok(os.path.abspath(d) != os.path.abspath(s))


@test("输出与输入相同 → 拦下来")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        _, _, err = resolve_io(tmp, tmp)
        ok(err and "不能和输入文件夹相同" in err, err)
        _, _, err2 = resolve_io(tmp, f'"{tmp}"')   # 带引号也要认出来
        ok(err2, "带引号的同一路径同样要拦")


@test("输出路径被文件占用 → 拦下来")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "src")
        os.makedirs(src)
        taken = os.path.join(tmp, "占位.txt")
        open(taken, "w").write("x")
        _, _, err = resolve_io(src, taken)
        ok(err and "占用" in err, err)


@test("正常输入输出 → 无错误，且都是绝对路径")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "src")
        os.makedirs(src)
        s, d, err = resolve_io(src, os.path.join(tmp, "out"))
        eq(err, None)
        ok(os.path.isabs(s) and os.path.isabs(d))


@test("空文件夹单独报「没有可转换的文件」，不冒充「部分失败」")
def _():
    import contextlib, io as _io
    import convert_cli
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "空的")
        os.makedirs(src)
        buf = _io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = convert_cli.main([src, os.path.join(tmp, "out")])
        eq(rc, 5)
        ok("没有可转换的文件" in buf.getvalue())


@test("能递归找出 obj/glb/zip，忽略其它文件")
def _():
    from convert_cli import find_convertible
    with tempfile.TemporaryDirectory() as tmp:
        os.makedirs(os.path.join(tmp, "子目录"))
        for n in ("a.obj", "b.GLB", "c.zip", "d.txt", "e.mtl", "f.jpg"):
            open(os.path.join(tmp, n), "w").write("x")
        open(os.path.join(tmp, "子目录", "g.obj"), "w").write("x")
        got = sorted(os.path.basename(p) for p in find_convertible(tmp))
        eq(got, ["a.obj", "b.GLB", "c.zip", "g.obj"])


@test("依赖检查返回 pip 名而不是模块名（提示能直接复制去装）")
def _():
    lost = missing_packages()
    ok(isinstance(lost, list))
    for name in lost:
        ok(name in ("trimesh", "pillow", "numpy"), name)
    ok("PIL" not in lost, "应报 pillow 而不是 PIL")


# ── 端到端：真的跑一遍转换 ───────────────────────────────────

@test("端到端：给一个 OBJ 目录，产出 GLB 与 manifest.csv")
def _():
    try:
        import trimesh
        from PIL import Image
    except Exception:  # noqa: BLE001
        print("     （跳过：未装 trimesh/pillow）")
        return
    import convert_cli
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        os.makedirs(src)
        m = trimesh.creation.icosphere(subdivisions=1)
        Image.new("RGB", (16, 16), (200, 160, 120)).save(os.path.join(src, "d.jpg"))
        open(os.path.join(src, "m.mtl"), "w").write("newmtl mat0\nKd 0.8 0.7 0.6\nmap_Kd d.jpg\n")
        lines = ["mtllib m.mtl", "usemtl mat0"]
        for v in m.vertices:
            lines.append("v %f %f %f" % tuple(v))
        lines.append("vt 0 0")
        for f in m.faces:
            lines.append("f %d/1 %d/1 %d/1" % (f[0] + 1, f[1] + 1, f[2] + 1))
        open(os.path.join(src, "t.obj"), "w").write("\n".join(lines) + "\n")

        out = os.path.join(tmp, "out")
        import contextlib, io as _io
        with contextlib.redirect_stdout(_io.StringIO()):
            rc = convert_cli.main([src, out])
        eq(rc, 0)
        names = os.listdir(out)
        ok(any(n.endswith(".glb") for n in names), names)
        ok("manifest.csv" in names, names)


# ── .bat 结构（本仓库 bat 闪退的真实成因） ─────────────────────

@test("转换模型.bat 存在且是 CRLF")
def _():
    raw = open(BAT, "rb").read()
    ok(b"\r\n" in raw, "Windows cmd 需要 CRLF，否则会逐行解析错乱")
    ok(b"\n" not in raw.replace(b"\r\n", b""), "不能混用 LF")


@test("不使用 delayed expansion（会吞掉路径里的 !）")
def _():
    text = open(BAT, encoding="utf-8").read()
    ok(not re.search(r"EnableDelayedExpansion", text, re.I), "禁止 setlocal EnableDelayedExpansion")


@test("不使用括号 if 块（路径含括号时会炸）")
def _():
    text = open(BAT, encoding="utf-8").read()
    for line in text.splitlines():
        s = line.strip()
        if s.lower().startswith("if ") or s.lower().startswith("if("):
            ok("(" not in s.split(" ", 1)[1] or "goto" in s.lower(),
               f"if 应走 goto 风格，不要括号块：{s}")


@test("每个退出码都有对应分支与提示，不会静默闪退")
def _():
    text = open(BAT, encoding="utf-8").read()
    for label in ("done", "cancelled", "need_deps", "bad_path", "some_failed",
                  "no_files", "no_python", "cd_fail", "unknown", "end"):
        ok(f":{label}" in text, f"缺少标签 :{label}")
    for rc in ("0", "1", "2", "3", "4", "5"):
        ok(f'"%RC%"=="{rc}"' in text, f"未分派退出码 {rc}")
    ok("pause" in text, "顶层入口必须 pause，否则出错时窗口一闪就关")
    ok(text.rstrip().endswith("exit /b %RC%"), "应以 exit /b %RC% 收尾")


@test("找不到 Python 时给出可执行的指引")
def _():
    text = open(BAT, encoding="utf-8").read()
    ok("Add Python to PATH" in text, "必须提醒勾选 PATH，这是最常见的装了却用不了")
    ok("python.org" in text)


@test("优先用便携 Python，其次 py -3，再次 python")
def _():
    text = open(BAT, encoding="utf-8").read()
    i_portable = text.index("_runtime\\python\\python.exe")
    i_py = text.index("where py ")
    i_python = text.index("where python ")
    ok(i_portable < i_py < i_python, "解释器探测顺序不对")


@test("在 Windows 上真的能跑起来（非 Windows 自动跳过）")
def _():
    if os.name != "nt":
        print("     （跳过：非 Windows）")
        return
    with tempfile.TemporaryDirectory() as tmp:
        r = subprocess.run(["cmd.exe", "/c", "call", BAT, os.path.join(tmp, "不存在")],
                           capture_output=True, text=True, timeout=120)
        ok(r.returncode in (2, 3), f"返回码 {r.returncode}\n{r.stdout}")


print(f"\nconvert_cli: {_pass} passed" + (f", {_fail} FAILED" if _fail else ""))
sys.exit(1 if _fail else 0)
