#!/usr/bin/env python3
"""GUI 数据流测试（无真实窗口）：python obj2glb_gui.test.py"""
from __future__ import annotations

import csv
import os
import shutil
import sys
import tempfile
from unittest.mock import MagicMock, patch

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

# mock tkinter 后再 import GUI
for _name in ("tkinter", "tkinter.ttk", "tkinter.filedialog", "tkinter.messagebox"):
    sys.modules[_name] = MagicMock()

import batch_glb  # noqa: E402
import glb_paths  # noqa: E402
import glb_utils  # noqa: E402
import obj2glb_gui  # noqa: E402

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


def _make_gui() -> obj2glb_gui.ConverterGUI:
    root = MagicMock()
    gui = obj2glb_gui.ConverterGUI(root)
    gui.messagebox = MagicMock()
    return gui


@test("scan_folder_inputs 排除默认 output_glb 内旧 GLB")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        out = os.path.join(src, "output_glb")
        os.makedirs(out)
        open(os.path.join(src, "a.obj"), "w").write("x")
        open(os.path.join(out, "old.glb"), "wb").write(b"x")
        found = obj2glb_gui.scan_folder_inputs(src, None)
        eq(len(found), 1)
        ok(found[0].endswith("a.obj"))


@test("添加文件夹时沿用已选输出目录做排除")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        custom_out = os.path.join(src, "自定义输出")
        os.makedirs(custom_out)
        open(os.path.join(src, "a.obj"), "w").write("x")
        open(os.path.join(custom_out, "old.glb"), "wb").write(b"x")
        found = obj2glb_gui.scan_folder_inputs(src, custom_out)
        eq(len(found), 1)
        ok(found[0].endswith("a.obj"))


@test("_add_folder 不把 output_glb 旧产物加入列表")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        out = os.path.join(src, "output_glb")
        os.makedirs(out)
        open(os.path.join(src, "a.obj"), "w").write("x")
        open(os.path.join(out, "old.glb"), "wb").write(b"x")
        gui = _make_gui()
        with patch.object(obj2glb_gui.filedialog, "askdirectory", return_value=src):
            gui._add_folder()
        eq(len(gui.inputs), 1)
        ok(gui.inputs[0]["path"].endswith("a.obj"))
        eq(gui.inputs[0]["root"], os.path.abspath(src))


@test("重复添加同一文件夹仍只保留源素材")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        out = os.path.join(src, "output_glb")
        os.makedirs(out)
        open(os.path.join(src, "a.obj"), "w").write("x")
        open(os.path.join(out, "old.glb"), "wb").write(b"x")
        gui = _make_gui()
        with patch.object(obj2glb_gui.filedialog, "askdirectory", return_value=src):
            gui._add_folder()
            gui._clear_inputs()
            gui.out_dir = out
            gui._add_folder()
        eq(len(gui.inputs), 1)
        ok(gui.inputs[0]["path"].endswith("a.obj"))


@test("inputs_for_run 在输出改到输入树内时过滤旧产物")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        out = os.path.join(src, "output_glb")
        os.makedirs(out)
        a = os.path.join(src, "a.obj")
        old = os.path.join(out, "old.glb")
        open(a, "w").write("x")
        open(old, "wb").write(b"x")
        items = [
            {"path": os.path.abspath(a), "root": os.path.abspath(src)},
            {"path": os.path.abspath(old), "root": os.path.abspath(src)},
        ]
        kept = obj2glb_gui.inputs_for_run(items, out)
        eq(len(kept), 1)
        ok(kept[0]["path"].endswith("a.obj"))


@test("naming_root_for_items：分两次添加的不同目录共享上层命名根")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        a = os.path.join(tmp, "A", "model.glb")
        b = os.path.join(tmp, "B", "model.glb")
        os.makedirs(os.path.dirname(a))
        os.makedirs(os.path.dirname(b))
        items = [
            {"path": os.path.abspath(a), "root": os.path.dirname(a)},
            {"path": os.path.abspath(b), "root": os.path.dirname(b)},
        ]
        naming = obj2glb_gui.naming_root_for_items(items)
        eq(naming, os.path.abspath(tmp))
        eq(glb_utils.safe_output_stem(a, naming), "A__model")
        eq(glb_utils.safe_output_stem(b, naming), "B__model")


@test("两次添加文件后 worker 使用统一 naming root")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        a = os.path.join(tmp, "A", "model.glb")
        b = os.path.join(tmp, "B", "model.glb")
        os.makedirs(os.path.dirname(a))
        os.makedirs(os.path.dirname(b))
        open(a, "wb").write(b"x")
        open(b, "wb").write(b"x")
        gui = _make_gui()
        with patch.object(obj2glb_gui.filedialog, "askopenfilenames", side_effect=[[a], [b]]):
            gui._add_files()
            gui._add_files()
        eq(len(gui.inputs), 2)
        naming = obj2glb_gui.naming_root_for_items(gui.inputs)
        out = os.path.join(tmp, "out")
        fake = batch_glb.empty_result(a, naming)
        fake.update({"状态": "成功", "GLB文件": "x.glb", "体积MB": 1.0, "scale": ""})
        with patch.object(batch_glb, "process_one", return_value=fake) as po:
            gui._run_worker(list(gui.inputs), out, dict(
                max_texture=2048, quality=85, texture_format="auto",
                reencode=True, overwrite=False, transform=False,
            ))
        eq(po.call_count, 2)
        for call in po.call_args_list:
            eq(call.args[1], naming)


@test("单文件子目录批次保留添加文件夹时的 root")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        a = os.path.join(src, "A", "model.glb")
        os.makedirs(os.path.dirname(a))
        open(a, "wb").write(b"x")
        item = {"path": os.path.abspath(a), "root": os.path.abspath(src)}
        naming = obj2glb_gui.naming_root_for_items([item])
        eq(naming, os.path.abspath(src))
        eq(glb_utils.safe_output_stem(a, naming), "A__model")


@test("单文件子目录 worker 使用保存的 root，加入兄弟文件后 stem 不变")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        a = os.path.join(src, "A", "model.glb")
        b = os.path.join(src, "B", "other.glb")
        os.makedirs(os.path.dirname(a))
        os.makedirs(os.path.dirname(b))
        open(a, "wb").write(b"x")
        open(b, "wb").write(b"y")
        src_abs = os.path.abspath(src)
        item_a = {"path": os.path.abspath(a), "root": src_abs}
        out = os.path.join(tmp, "out")
        gui = _make_gui()
        captured: list[tuple[str, str]] = []

        def _fake(src, root, *_a, **_k):
            captured.append((src, root))
            r = batch_glb.empty_result(src, root)
            r.update({"状态": "成功", "GLB文件": "x.glb", "体积MB": 1.0, "scale": ""})
            return r

        with patch.object(batch_glb, "process_one", side_effect=_fake):
            gui._run_worker([item_a], out, dict(
                max_texture=2048, quality=85, texture_format="auto",
                reencode=True, overwrite=False, transform=False,
            ))
        eq(captured[0][1], src_abs)
        eq(batch_glb.empty_result(a, src_abs)["来源相对路径"], glb_utils.safe_relpath(a, src_abs))
        stem_single = glb_utils.safe_output_stem(a, src_abs)

        item_b = {"path": os.path.abspath(b), "root": src_abs}
        captured.clear()
        with patch.object(batch_glb, "process_one", side_effect=_fake):
            gui._run_worker([item_a, item_b], out, dict(
                max_texture=2048, quality=85, texture_format="auto",
                reencode=True, overwrite=False, transform=False,
            ))
        eq(captured[0][1], src_abs)
        eq(glb_utils.safe_output_stem(a, src_abs), stem_single)
        eq(glb_utils.safe_output_stem(a, src_abs), "A__model")


@test("添加文件夹多文件时 naming root 与 CLI 一致")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        a = os.path.join(src, "A", "model.glb")
        b = os.path.join(src, "B", "model.glb")
        os.makedirs(os.path.dirname(a))
        os.makedirs(os.path.dirname(b))
        root = os.path.abspath(src)
        items = [
            {"path": os.path.abspath(a), "root": root},
            {"path": os.path.abspath(b), "root": root},
        ]
        naming = obj2glb_gui.naming_root_for_items(items)
        eq(naming, root)
        eq(glb_utils.safe_output_stem(a, naming), "A__model")
        eq(glb_utils.safe_output_stem(b, naming), "B__model")


@test("_run_worker 按统一 naming root 调用 process_one")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        os.makedirs(src)
        a = os.path.join(src, "a.obj")
        open(a, "w").write("x")
        out = os.path.join(tmp, "out")
        item = {"path": os.path.abspath(a), "root": os.path.abspath(src)}
        naming = obj2glb_gui.naming_root_for_items([item])
        gui = _make_gui()
        fake = batch_glb.empty_result(a, naming)
        fake["状态"] = "成功"
        fake["GLB文件"] = "a-deadbeef.glb"
        fake["体积MB"] = 1.0
        fake["scale"] = ""
        with patch.object(batch_glb, "process_one", return_value=fake) as po:
            gui._run_worker([item], out, dict(
                max_texture=2048, quality=85, texture_format="auto",
                reencode=True, overwrite=False, transform=False,
            ))
        po.assert_called_once()
        args = po.call_args[0]
        eq(args[0], item["path"])
        eq(args[1], naming)
        eq(args[2], out)


@test("_run_worker 写入 manifest 使用 RESULT_FIELDS")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        os.makedirs(src)
        a = os.path.join(src, "a.obj")
        open(a, "w").write("x")
        out = os.path.join(tmp, "out")
        item = {"path": os.path.abspath(a), "root": os.path.abspath(src)}
        gui = _make_gui()
        fake = {k: "" for k in batch_glb.RESULT_FIELDS}
        fake.update({
            "名称": "a", "来源相对路径": "a.obj", "状态": "成功",
            "GLB文件": "a-deadbeef.glb", "体积MB": 1.0, "scale": "",
        })
        with patch.object(batch_glb, "process_one", return_value=fake):
            gui._run_worker([item], out, dict(
                max_texture=2048, quality=85, texture_format="auto",
                reencode=True, overwrite=False, transform=False,
            ))
        man = os.path.join(out, "manifest.csv")
        ok(os.path.isfile(man))
        with open(man, encoding="utf-8-sig") as f:
            row = next(csv.DictReader(f))
        eq(list(row.keys()), batch_glb.RESULT_FIELDS)


@test("mkstemp 失败不中断批次且第二项仍处理")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        a = os.path.join(tmp, "A", "a.obj")
        b = os.path.join(tmp, "B", "b.obj")
        os.makedirs(os.path.dirname(a))
        os.makedirs(os.path.dirname(b))
        items = [
            {"path": os.path.abspath(a), "root": os.path.dirname(a)},
            {"path": os.path.abspath(b), "root": os.path.dirname(b)},
        ]
        out = os.path.join(tmp, "out")
        gui = _make_gui()

        def _fake(src, root, *_a, **_k):
            r = batch_glb.empty_result(src, root)
            r.update({
                "状态": "成功",
                "GLB文件": os.path.basename(src).replace(".obj", "-abc.glb"),
                "体积MB": 1.0,
                "scale": 1.0,
            })
            return r

        with patch.object(batch_glb, "process_one", side_effect=_fake) as po:
            with patch("obj2glb_gui.tempfile.mkstemp", side_effect=OSError("disk full")):
                gui._run_worker(items, out, dict(
                    max_texture=2048, quality=85, texture_format="auto",
                    reencode=True, overwrite=False, transform=True,
                ))
        eq(po.call_count, 2)
        man = os.path.join(out, "manifest.csv")
        with open(man, encoding="utf-8-sig") as f:
            rows = list(csv.DictReader(f))
        eq(len(rows), 2)
        ok("transform 写入失败" in rows[0]["备注"])


@test("transform 写入失败不中断批次，manifest 仍含两行")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        a = os.path.join(tmp, "A", "a.obj")
        b = os.path.join(tmp, "B", "b.obj")
        os.makedirs(os.path.dirname(a))
        os.makedirs(os.path.dirname(b))
        items = [
            {"path": os.path.abspath(a), "root": os.path.dirname(a)},
            {"path": os.path.abspath(b), "root": os.path.dirname(b)},
        ]
        out = os.path.join(tmp, "out")
        gui = _make_gui()

        def _fake(src, root, *_a, **_k):
            r = batch_glb.empty_result(src, root)
            r.update({
                "状态": "成功",
                "GLB文件": os.path.basename(src).replace(".obj", "-abc.glb"),
                "体积MB": 1.0,
                "scale": 1.0,
            })
            return r

        with patch.object(batch_glb, "process_one", side_effect=_fake):
            with patch.object(gui, "_write_transform", side_effect=["disk full", None]):
                gui._run_worker(items, out, dict(
                    max_texture=2048, quality=85, texture_format="auto",
                    reencode=True, overwrite=False, transform=True,
                ))
        man = os.path.join(out, "manifest.csv")
        ok(os.path.isfile(man))
        with open(man, encoding="utf-8-sig") as f:
            rows = list(csv.DictReader(f))
        eq(len(rows), 2)
        ok("transform 写入失败" in rows[0]["备注"] or "disk full" in rows[0]["备注"])


@test("_start 拒绝输出目录与输入根相同")
def _():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "素材")
        os.makedirs(src)
        a = os.path.join(src, "a.obj")
        open(a, "w").write("x")
        gui = _make_gui()
        gui.inputs = [{"path": os.path.abspath(a), "root": os.path.abspath(src)}]
        gui.out_dir = os.path.abspath(src)
        with patch.object(obj2glb_gui.messagebox, "showerror") as err:
            with patch.object(gui, "_run_worker") as worker:
                gui._start()
                worker.assert_not_called()
                ok(err.called)


@test("naming_root_for_item 始终返回 batch root")
def _():
    item = {"path": "/data/d/file.glb", "root": "/data/d"}
    eq(obj2glb_gui.naming_root_for_item(item, "/other/root"), "/other/root")


@test("跨盘同名 GLB 经 batch root 得到不同输出 stem")
def _():
    from unittest.mock import patch
    batch = r"C:\A"
    with patch("glb_paths.os.path.relpath", side_effect=ValueError("cross")):
        stem_d = glb_utils.safe_output_stem(r"D:\B\model.glb", batch)
        stem_e = glb_utils.safe_output_stem(r"E:\B\model.glb", batch)
    eq(stem_d, "D__B__model")
    eq(stem_e, "E__B__model")
    ok(stem_d != stem_e)


@test("跨盘批次 worker 仍处理全部项")
def _():
    items = [
        {"path": r"D:\proj\a.glb", "root": r"D:\proj"},
        {"path": r"E:\proj\b.glb", "root": r"E:\proj"},
    ]
    eq(obj2glb_gui.naming_root_for_items(items), glb_paths.CROSS_ROOT_BATCH)
    with tempfile.TemporaryDirectory() as out:
        gui = _make_gui()
        captured: list[tuple[str, str, dict]] = []

        def _fake(src, root, *_a, **_k):
            r = batch_glb.empty_result(src, root)
            r.update({"状态": "成功", "GLB文件": os.path.basename(src), "体积MB": 1.0, "scale": ""})
            captured.append((src, root, r))
            return r

        with patch.object(batch_glb, "process_one", side_effect=_fake):
            gui._run_worker(items, out, dict(
                max_texture=2048, quality=85, texture_format="auto",
                reencode=True, overwrite=False, transform=False,
            ))
        eq(len(captured), 2)
        eq(captured[0][1], glb_paths.CROSS_ROOT_BATCH)
        eq(captured[1][1], glb_paths.CROSS_ROOT_BATCH)
        rels = [c[2]["来源相对路径"] for c in captured]
        eq(rels, ["D__proj__a.glb", "E__proj__b.glb"])
        with open(os.path.join(out, "manifest.csv"), encoding="utf-8-sig") as f:
            eq(len(list(csv.DictReader(f))), 2)


@test("跨盘批次命名与添加顺序无关")
def _():
    items_de = [
        {"path": r"D:\proj\a.glb", "root": r"D:\proj"},
        {"path": r"E:\proj\b.glb", "root": r"E:\proj"},
    ]
    items_ed = list(reversed(items_de))

    def stems_by_path(items):
        root = obj2glb_gui.naming_root_for_items(items)
        return {i["path"]: glb_utils.safe_output_stem(i["path"], root) for i in items}

    eq(stems_by_path(items_de), stems_by_path(items_ed))
    eq(stems_by_path(items_de)[r"D:\proj\a.glb"], "D__proj__a")
    eq(stems_by_path(items_de)[r"E:\proj\b.glb"], "E__proj__b")


print("obj2glb_gui tests")
print(f"\nobj2glb_gui: {_pass} passed" + (f", {_fail} FAILED" if _fail else ""))
sys.exit(1 if _fail else 0)
