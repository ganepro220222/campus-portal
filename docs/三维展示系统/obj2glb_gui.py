"""
立体鉴赏 · OBJ → GLB 转换器（图形界面）

面向非技术使用者：选文件或整个文件夹 → 设置贴图选项 → 一键转换为自包含 GLB
（贴图内嵌、无外部依赖），并生成归一化参数 transform.json 与 manifest.csv。

内部复用 batch_glb / glb_utils（与命令行版同一套引擎，行为一致）。

依赖：pip install trimesh pillow numpy      （界面用 Python 自带的 tkinter，无需额外安装）
直接运行：python obj2glb_gui.py
"""
from __future__ import annotations

import os
import sys
import csv
import json
import queue
import threading

# 让打包/直接运行都能找到同目录的引擎模块
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import tkinter as tk
from tkinter import ttk, filedialog, messagebox

# 依赖缺失时给出友好提示（而不是崩溃）
_IMPORT_ERROR = None
try:
    import batch_glb
    import glb_utils
except (Exception, SystemExit) as e:  # glb_utils 缺依赖时会 raise SystemExit
    _IMPORT_ERROR = str(e) or "缺少依赖（trimesh / pillow / numpy）"

SUPPORTED = (".obj", ".glb", ".zip")
TEX_SIZES = [("2048（推荐）", 2048), ("1024", 1024), ("4096", 4096), ("原始不限", None)]
TEX_FORMATS = [("自动", "auto"), ("JPEG", "jpeg"), ("PNG", "png")]


class ConverterGUI:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.q: queue.Queue = queue.Queue()
        self.inputs: list[str] = []      # 待处理文件绝对路径
        self.out_dir: str | None = None
        self.worker: threading.Thread | None = None
        self._build_ui()
        if _IMPORT_ERROR:
            self._log(f"⚠ 缺少依赖：{_IMPORT_ERROR}\n请先运行 install.bat 或：pip install trimesh pillow numpy\n", "er")
            self.btn_run.config(state="disabled")
        self.root.after(120, self._drain_queue)

    # ---------- 界面 ----------
    def _build_ui(self):
        self.root.title("立体鉴赏 · OBJ → GLB 转换器")
        self.root.geometry("760x620")
        self.root.minsize(680, 560)
        pad = {"padx": 10, "pady": 6}

        # 1) 输入
        f_in = ttk.LabelFrame(self.root, text="第一步：选择要转换的模型（可多选 / 也可整个文件夹）")
        f_in.pack(fill="x", **pad)
        row = ttk.Frame(f_in); row.pack(fill="x", padx=8, pady=6)
        ttk.Button(row, text="添加文件…", command=self._add_files).pack(side="left")
        ttk.Button(row, text="添加文件夹…", command=self._add_folder).pack(side="left", padx=6)
        ttk.Button(row, text="清空列表", command=self._clear_inputs).pack(side="left")
        self.lbl_count = ttk.Label(row, text="已选 0 个"); self.lbl_count.pack(side="right")
        self.lst = tk.Listbox(f_in, height=5)
        self.lst.pack(fill="x", padx=8, pady=(0, 8))
        ttk.Label(f_in, text="支持 .obj（自动带上同名 .mtl 与贴图）、现成 .glb、含 GLB 的 .zip；不支持 FBX（请先在 Blender 导出）。",
                  foreground="#666").pack(anchor="w", padx=8, pady=(0, 6))

        # 2) 输出目录
        f_out = ttk.LabelFrame(self.root, text="第二步：输出目录")
        f_out.pack(fill="x", **pad)
        row2 = ttk.Frame(f_out); row2.pack(fill="x", padx=8, pady=8)
        ttk.Button(row2, text="选择输出目录…", command=self._choose_out).pack(side="left")
        self.lbl_out = ttk.Label(row2, text="（未选择，默认在输入目录下的 output_glb）", foreground="#666")
        self.lbl_out.pack(side="left", padx=8)

        # 3) 选项
        f_opt = ttk.LabelFrame(self.root, text="第三步：贴图与几何选项")
        f_opt.pack(fill="x", **pad)
        g = ttk.Frame(f_opt); g.pack(fill="x", padx=8, pady=8)

        ttk.Label(g, text="贴图最大边长：").grid(row=0, column=0, sticky="w")
        self.var_size = tk.StringVar(value=TEX_SIZES[0][0])
        ttk.Combobox(g, textvariable=self.var_size, values=[s[0] for s in TEX_SIZES],
                     state="readonly", width=14).grid(row=0, column=1, sticky="w", padx=(0, 18))

        ttk.Label(g, text="贴图格式：").grid(row=0, column=2, sticky="w")
        self.var_fmt = tk.StringVar(value=TEX_FORMATS[0][0])
        ttk.Combobox(g, textvariable=self.var_fmt, values=[s[0] for s in TEX_FORMATS],
                     state="readonly", width=10).grid(row=0, column=3, sticky="w")

        ttk.Label(g, text="JPEG 质量：").grid(row=1, column=0, sticky="w", pady=(8, 0))
        self.var_q = tk.IntVar(value=85)
        self.scale_q = ttk.Scale(g, from_=40, to=100, variable=self.var_q,
                                 command=lambda _=None: self.lbl_q.config(text=str(self.var_q.get())))
        self.scale_q.grid(row=1, column=1, sticky="we", pady=(8, 0))
        self.lbl_q = ttk.Label(g, text="85"); self.lbl_q.grid(row=1, column=2, sticky="w", padx=(6, 0), pady=(8, 0))
        g.columnconfigure(1, weight=1)

        self.var_noreenc = tk.BooleanVar(value=False)
        ttk.Checkbutton(g, text="不重编码贴图（最高画质，忽略质量/格式，仅按上限缩放）",
                        variable=self.var_noreenc).grid(row=2, column=0, columnspan=4, sticky="w", pady=(8, 0))
        self.var_transform = tk.BooleanVar(value=True)
        ttk.Checkbutton(g, text="导出归一化参数 transform.json（可直接填入展品 config）",
                        variable=self.var_transform).grid(row=3, column=0, columnspan=4, sticky="w")
        self.var_overwrite = tk.BooleanVar(value=False)
        ttk.Checkbutton(g, text="覆盖已存在的同名 GLB",
                        variable=self.var_overwrite).grid(row=4, column=0, columnspan=4, sticky="w")

        # 4) 执行 + 日志
        f_run = ttk.Frame(self.root); f_run.pack(fill="x", **pad)
        self.btn_run = ttk.Button(f_run, text="开始转换", command=self._start)
        self.btn_run.pack(side="left")
        self.btn_open = ttk.Button(f_run, text="打开输出目录", command=self._open_out, state="disabled")
        self.btn_open.pack(side="left", padx=6)
        self.prog = ttk.Progressbar(f_run, mode="determinate")
        self.prog.pack(side="left", fill="x", expand=True, padx=8)

        f_log = ttk.LabelFrame(self.root, text="日志")
        f_log.pack(fill="both", expand=True, **pad)
        self.txt = tk.Text(f_log, height=10, wrap="word", state="disabled", font=("Consolas", 9))
        self.txt.pack(side="left", fill="both", expand=True, padx=(8, 0), pady=8)
        sb = ttk.Scrollbar(f_log, command=self.txt.yview); sb.pack(side="right", fill="y", pady=8)
        self.txt.config(yscrollcommand=sb.set)
        self.txt.tag_config("ok", foreground="#178a3a")
        self.txt.tag_config("er", foreground="#c0392b")
        self.txt.tag_config("hd", foreground="#8a6d1f")

    # ---------- 输入管理 ----------
    def _add_files(self):
        paths = filedialog.askopenfilenames(
            title="选择模型文件",
            filetypes=[("可转换模型", "*.obj *.glb *.zip"), ("所有文件", "*.*")])
        self._append([p for p in paths if p.lower().endswith(SUPPORTED)])

    def _add_folder(self):
        d = filedialog.askdirectory(title="选择包含模型的文件夹（含子目录）")
        if not d:
            return
        try:
            found = glb_utils.collect_input_files(d, recursive=True)
        except Exception as e:  # noqa: BLE001
            messagebox.showerror("扫描失败", str(e)); return
        if not found:
            messagebox.showinfo("提示", "该文件夹内没有 .obj / .glb / .zip 文件。"); return
        self._append(found)
        if self.out_dir is None:
            self._set_out(os.path.join(d, "output_glb"))

    def _append(self, paths):
        added = 0
        for p in paths:
            ap = os.path.abspath(p)
            if ap not in self.inputs:
                self.inputs.append(ap); self.lst.insert("end", ap); added += 1
        self.lbl_count.config(text=f"已选 {len(self.inputs)} 个")
        if added and self.out_dir is None and self.inputs:
            self._set_out(os.path.join(os.path.dirname(self.inputs[0]), "output_glb"))

    def _clear_inputs(self):
        self.inputs.clear(); self.lst.delete(0, "end"); self.lbl_count.config(text="已选 0 个")

    def _choose_out(self):
        d = filedialog.askdirectory(title="选择输出目录")
        if d:
            self._set_out(d)

    def _set_out(self, d):
        self.out_dir = os.path.abspath(d)
        self.lbl_out.config(text=self.out_dir, foreground="#111")

    def _open_out(self):
        if self.out_dir and os.path.isdir(self.out_dir):
            try:
                if sys.platform.startswith("win"):
                    os.startfile(self.out_dir)  # type: ignore[attr-defined]
                elif sys.platform == "darwin":
                    import subprocess; subprocess.Popen(["open", self.out_dir])
                else:
                    import subprocess; subprocess.Popen(["xdg-open", self.out_dir])
            except Exception as e:  # noqa: BLE001
                messagebox.showinfo("输出目录", f"{self.out_dir}\n（无法自动打开：{e}）")

    # ---------- 执行 ----------
    def _tex_size(self):
        return dict(TEX_SIZES)[self.var_size.get()]

    def _tex_fmt(self):
        return dict(TEX_FORMATS)[self.var_fmt.get()]

    def _start(self):
        if self.worker and self.worker.is_alive():
            return
        if not self.inputs:
            messagebox.showinfo("提示", "请先添加要转换的文件或文件夹。"); return
        if self.out_dir is None:
            self._set_out(os.path.join(os.path.dirname(self.inputs[0]), "output_glb"))
        if os.path.abspath(self.out_dir) in {os.path.dirname(p) for p in self.inputs} and any(
                p.lower().endswith(".glb") for p in self.inputs):
            pass  # 允许，但引擎自身也会避免自处理
        self.btn_run.config(state="disabled"); self.btn_open.config(state="disabled")
        self._clear_log()
        opts = dict(
            max_texture=self._tex_size(),
            quality=int(self.var_q.get()),
            texture_format=self._tex_fmt(),
            reencode=not self.var_noreenc.get(),
            overwrite=self.var_overwrite.get(),
            transform=self.var_transform.get(),
        )
        self.prog.config(value=0, maximum=len(self.inputs))
        self.worker = threading.Thread(target=self._run_worker, args=(list(self.inputs), self.out_dir, opts), daemon=True)
        self.worker.start()

    def _run_worker(self, files, out_dir, opts):
        try:
            os.makedirs(out_dir, exist_ok=True)
            results = []
            ok = fail = 0
            self.q.put(("log", (f"共 {len(files)} 个文件，输出到：{out_dir}\n", "hd")))
            for i, src in enumerate(files, 1):
                name = os.path.basename(src)
                self.q.put(("log", (f"[{i}/{len(files)}] {name} …\n", None)))
                r = batch_glb.process_one(
                    src, os.path.dirname(src), out_dir,
                    opts["max_texture"], opts["quality"], opts["texture_format"],
                    opts["reencode"], False, opts["overwrite"],
                )
                results.append(r)
                if r["状态"].startswith("成功"):
                    ok += 1
                    self.q.put(("log", (f"    ✓ {r['处理方式']} → {r['GLB文件']} · {r['体积MB']}MB\n", "ok")))
                    if opts["transform"] and r.get("scale") != "":
                        self._write_transform(out_dir, r)
                else:
                    fail += 1
                    self.q.put(("log", (f"    ✗ {r['状态']}：{r['备注']}\n", "er")))
                self.q.put(("prog", i))
            # 汇总清单
            if results:
                man = os.path.join(out_dir, "manifest.csv")
                with open(man, "w", newline="", encoding="utf-8-sig") as f:
                    w = csv.DictWriter(f, fieldnames=list(results[0].keys())); w.writeheader(); w.writerows(results)
                self.q.put(("log", (f"\n清单：{man}\n", "hd")))
            self.q.put(("log", (f"完成：成功 {ok} 个，失败 {fail} 个。\n", "ok" if not fail else "hd")))
            self.q.put(("done", None))
        except Exception as e:  # noqa: BLE001
            self.q.put(("log", (f"\n发生错误：{e}\n", "er")))
            self.q.put(("done", None))

    def _write_transform(self, out_dir, r):
        stem = os.path.splitext(r["GLB文件"])[0]
        payload = {
            "source": r["来源相对路径"], "glb": r["GLB文件"],
            "glbSha1": r["glbSha1"], "objBundleSha1": r["objBundleSha1"],
            "meshes": r.get("网格数"), "materials": r.get("材质数"), "sizeMb": r["体积MB"],
            "transform": {k: r[k] for k in ("scale", "offsetX", "offsetY", "offsetZ", "floorOffsetY")},
        }
        with open(os.path.join(out_dir, stem + ".transform.json"), "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

    # ---------- 队列刷新（主线程）----------
    def _drain_queue(self):
        try:
            while True:
                kind, data = self.q.get_nowait()
                if kind == "log":
                    self._log(*data if isinstance(data, tuple) else (data, None))
                elif kind == "prog":
                    self.prog.config(value=data)
                elif kind == "done":
                    self.btn_run.config(state="normal")
                    if self.out_dir and os.path.isdir(self.out_dir):
                        self.btn_open.config(state="normal")
        except queue.Empty:
            pass
        self.root.after(120, self._drain_queue)

    def _log(self, msg, tag=None):
        self.txt.config(state="normal")
        self.txt.insert("end", msg, tag or "")
        self.txt.see("end")
        self.txt.config(state="disabled")

    def _clear_log(self):
        self.txt.config(state="normal"); self.txt.delete("1.0", "end"); self.txt.config(state="disabled")


def main():
    root = tk.Tk()
    try:
        ttk.Style().theme_use("clam")
    except Exception:  # noqa: BLE001
        pass
    ConverterGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
