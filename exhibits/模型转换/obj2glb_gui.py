"""
立体鉴赏 · OBJ → GLB 转换器（图形界面）

选文件或整个文件夹 → 设置贴图选项 → 一键转换为自包含 GLB
（贴图内嵌、无外部依赖），并生成归一化参数 transform.json 与 manifest.csv。

内部复用 batch_glb / glb_utils（与命令行版同一套引擎，行为一致）。

依赖：trimesh / pillow / numpy（界面用 Python 自带的 tkinter）
启动：双击「打开转换器.bat」；首次请先运行「安装转换依赖.bat」
"""
from __future__ import annotations

import os
import sys
import csv
import json
import queue
import threading
import tempfile
from typing import TypedDict

# 让打包/直接运行都能找到同目录的引擎模块
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from tkinter import font as tkfont

from input_scan import (
    _canonical_path,
    input_under_excluded_output,
    output_exclusion_for_input,
    validate_output_dir,
)
from glb_paths import naming_root_from_saved_roots

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
# 硬表面模型（建筑/器械）必须选「硬边」，否则棱角会被抹圆且事后无法补救
NORMAL_MODES = [("自动（推荐）", "auto"), ("强制平滑", "smooth"), ("硬边", "flat")]

# ---------- 外观：与工作台同一套「墨底 + 描金」，正文区仍用浅色（Windows 工具的习惯） ----------
INK = "#1b1f2a"
INK_SUB = "#8f97ab"
GOLD = "#c8a86a"
GOLD_DK = "#9c7c33"
CANVAS = "#f2f3f6"
CARD = "#ffffff"
LINE = "#dee2ea"
TEXT = "#1f2430"
MUTED = "#7b8194"
LOG_BG = "#fbfbfd"
LOG_OK = "#1f7a45"
LOG_ER = "#c0392b"
LOG_WARN = "#9a6b1e"

UI_FONT_CANDIDATES = ("Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC",
                      "Noto Sans CJK SC", "Source Han Sans SC", "Segoe UI")
MONO_FONT_CANDIDATES = ("Consolas", "Cascadia Mono", "Menlo", "DejaVu Sans Mono", "Courier New")

# 窗口最小尺寸：再小日志就没意义了
MIN_W, MIN_H = 720, 620


def pick_font(available, candidates: tuple[str, ...], fallback: str) -> str:
    """从系统已装字体里挑第一个可用的；都没有就退回 Tk 自带族。"""
    have = {str(f) for f in available or ()}
    for name in candidates:
        if name in have:
            return name
    return fallback


def golden_geometry(req_w, req_h, screen_w, screen_h,
                    min_w: int = MIN_W, min_h: int = MIN_H) -> tuple[int, int, int, int]:
    """
    默认窗口＝「内容的自然尺寸」，而不是写死的像素。

    写死 760x620 在 125%/150% 缩放的 Windows 上会出事：系统字体变大、各控件要的高度
    跟着变大，窗口高度却没变，于是唯一可伸缩的日志区被挤成一条缝（合伙人截图里的样子）。
    改成按 winfo_req* 反推，任何 DPI / 字号下日志都能拿到它该有的行数。
    """
    w = max(int(req_w), min_w)
    h = max(int(req_h), min_h)
    sw, sh = int(screen_w), int(screen_h)
    w = min(w, max(min_w, sw - 80))          # 不超出屏幕，但也不小于最小尺寸
    h = min(h, max(min_h, sh - 90))
    x = max(0, (sw - w) // 2)
    y = max(0, (sh - h) // 3)                # 略偏上，视觉重心更稳
    return w, h, x, y


class InputItem(TypedDict):
    path: str
    root: str


def common_input_root(paths: list[str]) -> str:
    """多选文件时推断与 CLI 一致的输入根目录。"""
    abs_paths = [os.path.abspath(p) for p in paths]
    if not abs_paths:
        raise ValueError("empty paths")
    if len(abs_paths) == 1:
        p = abs_paths[0]
        return os.path.dirname(p) if os.path.isfile(p) else p
    try:
        common = os.path.commonpath(abs_paths)
    except ValueError:
        return os.path.dirname(abs_paths[0])
    if os.path.isfile(common):
        return os.path.dirname(common)
    return common


def default_output_dir(input_root: str) -> str:
    return os.path.join(os.path.abspath(input_root), "output_glb")


def scan_folder_inputs(folder: str, output_dir: str | None) -> list[str]:
    """添加文件夹时扫描可转换文件，排除嵌套输出目录。"""
    root = os.path.abspath(folder)
    out = os.path.abspath(output_dir) if output_dir else default_output_dir(root)
    exclude = output_exclusion_for_input(root, out)
    return glb_utils.collect_input_files(root, recursive=True, exclude_dirs=exclude)


def inputs_for_run(items: list[InputItem], out_dir: str) -> list[InputItem]:
    """启动前再次过滤落在排除输出目录内的项。"""
    return [
        item for item in items
        if not input_under_excluded_output(item["path"], item["root"], out_dir)
    ]


def naming_root_for_items(items: list[InputItem]) -> str:
    """整批输入的统一命名根；优先尊重添加时保存的 InputItem.root。"""
    if not items:
        raise ValueError("empty items")
    return naming_root_from_saved_roots(
        [item["root"] for item in items],
        canonical_key=_canonical_path,
    )


def naming_root_for_item(item: InputItem, batch_root: str) -> str:
    """转换命名统一使用批次根；跨盘相对路径由 safe_relpath 加盘符标签。"""
    return batch_root


class ConverterGUI:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.q: queue.Queue = queue.Queue()
        self.inputs: list[InputItem] = []
        self.out_dir: str | None = None
        self.worker: threading.Thread | None = None
        self._build_ui()
        if _IMPORT_ERROR:
            self._log(f"⚠ 缺少依赖：{_IMPORT_ERROR}\n请先双击「安装转换依赖.bat」\n", "er")
            self.btn_run.config(state="disabled")
            self._status("缺少依赖")
        else:
            self._log("准备就绪。转换进度、体检提醒与失败原因都会显示在这里。\n"
                      "输出目录还会生成 manifest.csv（全部结果一览）与 transform.json（可直接填入展品 config）。\n",
                      "dim")
        self.root.after(120, self._drain_queue)

    # ---------- 界面 ----------
    def _init_style(self):
        """clam 主题 + 自定义配色。clam 在三个平台上表现一致，也是唯一能改色的内置主题。"""
        try:
            families = tkfont.families(self.root)
        except Exception:  # noqa: BLE001  # mock / 无显示环境
            families = ()
        ui = pick_font(families, UI_FONT_CANDIDATES, "TkDefaultFont")
        mono = pick_font(families, MONO_FONT_CANDIDATES, "TkFixedFont")
        self.f_ui = (ui, 10)
        self.f_bold = (ui, 10, "bold")
        self.f_small = (ui, 9)
        self.f_title = (ui, 14, "bold")
        self.f_mono = (mono, 9)

        st = ttk.Style(self.root)
        try:
            st.theme_use("clam")
        except Exception:  # noqa: BLE001
            pass
        st.configure(".", background=CARD, foreground=TEXT, font=self.f_ui,
                     bordercolor=LINE, focuscolor=CARD)
        st.configure("TFrame", background=CARD)
        st.configure("TLabel", background=CARD, foreground=TEXT)
        st.configure("Muted.TLabel", background=CARD, foreground=MUTED, font=self.f_small)
        st.configure("Field.TLabel", background=CARD, foreground=MUTED, font=self.f_small)

        st.configure("TButton", background="#eceef3", foreground=TEXT, relief="flat",
                     borderwidth=1, padding=(13, 6), font=self.f_ui)
        st.map("TButton",
               background=[("pressed", "#dfe3ec"), ("active", "#e3e7f0"), ("disabled", "#f4f5f8")],
               foreground=[("disabled", "#b3b8c6")],
               bordercolor=[("!disabled", LINE)])
        st.configure("Accent.TButton", background=GOLD, foreground="#2c2208",
                     padding=(20, 7), font=self.f_bold)
        st.map("Accent.TButton",
               background=[("pressed", "#b1904f"), ("active", "#d6b87e"), ("disabled", "#e9eaef")],
               foreground=[("disabled", "#b3b8c6")])

        st.configure("TCheckbutton", background=CARD, foreground=TEXT, font=self.f_ui,
                     indicatorbackground=CARD, indicatorforeground=GOLD_DK, padding=(0, 3))
        st.map("TCheckbutton",
               background=[("active", CARD)],
               indicatorbackground=[("selected", CARD), ("active", "#fbf6ea")])
        st.configure("TCombobox", fieldbackground=CARD, background=CARD, foreground=TEXT,
                     arrowcolor=MUTED, bordercolor=LINE, lightcolor=CARD, darkcolor=CARD, padding=4)
        st.map("TCombobox", fieldbackground=[("readonly", CARD)],
               bordercolor=[("focus", GOLD)], arrowcolor=[("active", GOLD_DK)])
        st.configure("TEntry", fieldbackground="#f7f8fb", bordercolor=LINE,
                     lightcolor="#f7f8fb", darkcolor="#f7f8fb", padding=5)
        st.configure("Horizontal.TScale", background=CARD, troughcolor="#e6e9f0")
        st.configure("TProgressbar", background=GOLD, troughcolor="#e6e9f0",
                     bordercolor=LINE, lightcolor=GOLD, darkcolor=GOLD, thickness=9)
        st.configure("Vertical.TScrollbar", background="#e6e9f0", troughcolor=CARD,
                     bordercolor=CARD, arrowcolor=MUTED)
        st.map("Vertical.TScrollbar", background=[("active", "#d4d9e4")])

        # 下拉弹窗是独立的 tk Listbox，配色得单独交代
        for opt, val in (("background", CARD), ("foreground", TEXT),
                         ("selectBackground", GOLD), ("selectForeground", "#2c2208"),
                         ("font", self.f_ui)):
            try:
                self.root.option_add(f"*TCombobox*Listbox.{opt}", val)
            except Exception:  # noqa: BLE001
                pass

    def _card(self, parent, step: str, title: str, expand: bool = False):
        """一张带标题的白卡片；返回内容容器。"""
        how = {"fill": "both", "expand": True} if expand else {"fill": "x"}
        wrap = tk.Frame(parent, bg=CANVAS)
        wrap.pack(pady=(0, 12), **how)
        head = tk.Frame(wrap, bg=CANVAS)
        head.pack(fill="x", pady=(0, 5))
        if step:
            tk.Label(head, text=step, bg=CANVAS, fg=GOLD_DK, font=self.f_bold).pack(side="left")
        tk.Label(head, text=title, bg=CANVAS, fg=TEXT, font=self.f_bold).pack(side="left")
        box = tk.Frame(wrap, bg=CARD, highlightbackground=LINE, highlightcolor=LINE,
                       highlightthickness=1, bd=0)
        box.pack(**how)
        return box

    def _build_ui(self):
        self.root.title("立体鉴赏 · OBJ → GLB 转换器")
        self._init_style()
        try:
            self.root.configure(bg=CANVAS)
        except Exception:  # noqa: BLE001
            pass

        # 顶栏：给工具一个身份，也把「这是干什么的」一句话说清
        head = tk.Frame(self.root, bg=INK)
        head.pack(fill="x")
        tk.Label(head, text="OBJ → GLB 转换器", bg=INK, fg="#f0e3c6",
                 font=self.f_title).pack(anchor="w", padx=18, pady=(13, 0))
        tk.Label(head, text="选文件 → 设选项 → 转出自包含 GLB（贴图内嵌，可直接放进展品 assets/）",
                 bg=INK, fg=INK_SUB, font=self.f_small).pack(anchor="w", padx=18, pady=(3, 13))
        tk.Frame(self.root, bg=GOLD, height=2).pack(fill="x")

        body = tk.Frame(self.root, bg=CANVAS)
        body.pack(fill="both", expand=True, padx=16, pady=14)

        # 上半部分分左右两栏：竖着堆四张卡会把窗口拉成又高又窄的一条，
        # 在 1366x768 的笔记本上根本放不下（日志又会被挤没）。
        # body 用 grid 而不是 pack：多出来的高度全部给日志，不足时也只压日志，
        # 上半区保持自然高度——压它会把「不重编码贴图」这类选项直接藏进窗口外面。
        body.columnconfigure(0, weight=1)
        body.rowconfigure(0, weight=0)   # 上半区：设置项一个都不能被裁
        body.rowconfigure(1, weight=0)   # 执行条
        body.rowconfigure(2, weight=1, minsize=140)   # 日志：独占伸缩，且留底
        top = tk.Frame(body, bg=CANVAS); top.grid(row=0, column=0, sticky="nsew")
        col_l = tk.Frame(top, bg=CANVAS); col_l.pack(side="left", fill="both", expand=True)
        col_r = tk.Frame(top, bg=CANVAS); col_r.pack(side="left", fill="both", expand=True, padx=(14, 0))

        # 1) 输入
        f_in = self._card(col_l, "第一步　", "选择模型与输出目录", expand=True)
        row = ttk.Frame(f_in); row.pack(fill="x", padx=12, pady=(12, 8))
        ttk.Button(row, text="添加文件…", command=self._add_files).pack(side="left")
        ttk.Button(row, text="添加文件夹…", command=self._add_folder).pack(side="left", padx=8)
        ttk.Button(row, text="清空列表", command=self._clear_inputs).pack(side="left")
        self.lbl_count = ttk.Label(row, text="已选 0 个", style="Field.TLabel")
        self.lbl_count.pack(side="right")

        lst_wrap = tk.Frame(f_in, bg=LINE)          # 1px 边框靠外层底色画，省得跟 Listbox 抢焦点框
        lst_wrap.pack(fill="both", expand=True, padx=12)
        self.lst = tk.Listbox(lst_wrap, height=5, bd=0, highlightthickness=0, activestyle="none",
                              bg=CARD, fg=TEXT, selectbackground="#f2e7cd", selectforeground=TEXT,
                              font=self.f_mono, width=20)
        self.lst.pack(side="left", fill="both", expand=True, padx=1, pady=1)
        sb_lst = ttk.Scrollbar(lst_wrap, command=self.lst.yview)
        sb_lst.pack(side="right", fill="y", padx=(0, 1), pady=1)
        self.lst.config(xscrollcommand=None, yscrollcommand=sb_lst.set)
        # 空列表是一大块白，给个说明比空着强
        self.lbl_empty = tk.Label(self.lst, bg=CARD, fg="#a7adbc", font=self.f_small, justify="center",
                                  text="还没有选择模型\n点上方「添加文件…」或「添加文件夹…」")
        self._sync_empty()

        ttk.Label(f_in, style="Muted.TLabel", wraplength=360, justify="left",
                  text="支持 .obj（自动带上同名 .mtl 与贴图）、现成 .glb、含 GLB 的 .zip；"
                       "不支持 FBX（请先在 Blender 导出）。").pack(anchor="w", padx=12, pady=(8, 4))
        # 输出目录：和「选哪些文件」同属文件位置，并进同一张卡，省掉一整张卡的高度
        tk.Frame(f_in, bg=LINE, height=1).pack(fill="x", padx=12, pady=(4, 0))
        row2 = ttk.Frame(f_in); row2.pack(fill="x", padx=12, pady=(10, 12))
        ttk.Label(row2, text="输出目录", style="Field.TLabel").pack(anchor="w", pady=(0, 6))
        ttk.Button(row2, text="选择输出目录…", command=self._choose_out).pack(side="left")
        self.var_out = tk.StringVar(value="（未选择，默认在输入目录下的 output_glb）")
        # 用只读输入框而不是 Label：深目录不会把整个窗口撑宽，还能直接选中复制
        self.ent_out = ttk.Entry(row2, textvariable=self.var_out, state="readonly",
                                 font=self.f_small, foreground=MUTED, width=46)
        self.ent_out.pack(side="left", fill="x", expand=True, padx=(10, 0))


        # 3) 选项
        f_opt = self._card(col_r, "第二步　", "贴图与几何选项", expand=True)
        g = ttk.Frame(f_opt); g.pack(fill="x", padx=12, pady=12)

        ttk.Label(g, text="贴图最大边长").grid(row=0, column=0, sticky="w")
        self.var_size = tk.StringVar(value=TEX_SIZES[0][0])
        ttk.Combobox(g, textvariable=self.var_size, values=[s[0] for s in TEX_SIZES],
                     state="readonly", width=13).grid(row=0, column=1, sticky="w", padx=(10, 24))

        ttk.Label(g, text="贴图格式").grid(row=0, column=2, sticky="w")
        self.var_fmt = tk.StringVar(value=TEX_FORMATS[0][0])
        ttk.Combobox(g, textvariable=self.var_fmt, values=[s[0] for s in TEX_FORMATS],
                     state="readonly", width=9).grid(row=0, column=3, sticky="w", padx=(10, 0))

        ttk.Label(g, text="JPEG 质量").grid(row=1, column=0, sticky="w", pady=(10, 0))
        self.var_q = tk.IntVar(value=85)
        self.scale_q = ttk.Scale(g, from_=40, to=100, variable=self.var_q,
                                 command=lambda _=None: self.lbl_q.config(text=str(self.var_q.get())))
        self.scale_q.grid(row=1, column=1, columnspan=2, sticky="we", padx=(10, 8), pady=(10, 0))
        self.lbl_q = ttk.Label(g, text="85", width=3)
        self.lbl_q.grid(row=1, column=3, sticky="w", pady=(10, 0))

        ttk.Label(g, text="法线处理").grid(row=2, column=0, sticky="w", pady=(10, 0))
        self.var_normals = tk.StringVar(value=NORMAL_MODES[0][0])
        ttk.Combobox(g, textvariable=self.var_normals, values=[s[0] for s in NORMAL_MODES],
                     state="readonly", width=13).grid(row=2, column=1, sticky="w", padx=(10, 24), pady=(10, 0))
        self.var_double = tk.BooleanVar(value=False)
        ttk.Checkbutton(g, text="双面渲染（有破洞时勾）", variable=self.var_double
                        ).grid(row=2, column=2, columnspan=2, sticky="w", pady=(10, 0))
        g.columnconfigure(1, weight=1)

        sep = tk.Frame(f_opt, bg=LINE, height=1); sep.pack(fill="x", padx=12)
        g2 = ttk.Frame(f_opt); g2.pack(fill="x", padx=12, pady=(10, 12))
        self.var_noreenc = tk.BooleanVar(value=False)
        ttk.Checkbutton(g2, text="不重编码贴图（最高画质，忽略质量 / 格式，仅按上限缩放）",
                        variable=self.var_noreenc).pack(anchor="w")
        self.var_transform = tk.BooleanVar(value=True)
        ttk.Checkbutton(g2, text="导出归一化参数 transform.json（可直接填入展品 config）",
                        variable=self.var_transform).pack(anchor="w")
        self.var_overwrite = tk.BooleanVar(value=False)
        ttk.Checkbutton(g2, text="覆盖已存在的同名 GLB",
                        variable=self.var_overwrite).pack(anchor="w")

        # 4) 执行条（浮在卡片之外，动作和内容分开）
        f_run = tk.Frame(body, bg=CANVAS); f_run.grid(row=1, column=0, sticky="ew", pady=(0, 12))
        self.btn_run = ttk.Button(f_run, text="开始转换", style="Accent.TButton", command=self._start)
        self.btn_run.pack(side="left")
        self.btn_open = ttk.Button(f_run, text="打开输出目录", command=self._open_out, state="disabled")
        self.btn_open.pack(side="left", padx=8)
        self.lbl_status = tk.Label(f_run, text="就绪", bg=CANVAS, fg=MUTED, font=self.f_small)
        self.lbl_status.pack(side="right")
        self.prog = ttk.Progressbar(f_run, mode="determinate")
        self.prog.pack(side="left", fill="x", expand=True, padx=(4, 12))

        # 5) 日志：唯一会跟着窗口一起长大的区域
        log_host = tk.Frame(body, bg=CANVAS); log_host.grid(row=2, column=0, sticky="nsew")
        f_log = self._card(log_host, "", "日志", expand=True)
        self.txt = tk.Text(f_log, height=10, wrap="word", state="disabled", font=self.f_mono,
                           bd=0, highlightthickness=0, bg=LOG_BG, fg=TEXT,
                           padx=10, pady=8, spacing1=1, insertbackground=TEXT)
        self.txt.pack(side="left", fill="both", expand=True, padx=(1, 0), pady=1)
        sb = ttk.Scrollbar(f_log, command=self.txt.yview)
        sb.pack(side="right", fill="y", padx=(0, 1), pady=1)
        self.txt.config(yscrollcommand=sb.set)
        self.txt.tag_config("ok", foreground=LOG_OK)
        self.txt.tag_config("er", foreground=LOG_ER)
        self.txt.tag_config("hd", foreground=LOG_WARN)
        self.txt.tag_config("dim", foreground=MUTED)

        self._fit_window()

    def _fit_window(self):
        """把窗口调成刚好装下内容的大小并居中——不同 DPI / 字号下都成立。"""
        try:
            self.root.update_idletasks()
            w, h, x, y = golden_geometry(
                self.root.winfo_reqwidth(), self.root.winfo_reqheight(),
                self.root.winfo_screenwidth(), self.root.winfo_screenheight())
        except Exception:  # noqa: BLE001
            return
        self.root.geometry(f"{w}x{h}+{x}+{y}")
        self.root.minsize(min(w, MIN_W), min(h, MIN_H))

    def _sync_empty(self):
        """列表为空时在框内居中显示说明，有内容就撤掉。"""
        try:
            if self.inputs:
                self.lbl_empty.place_forget()
            else:
                self.lbl_empty.place(relx=0.5, rely=0.5, anchor="center")
        except Exception:  # noqa: BLE001
            pass

    def _status(self, text: str):
        try:
            self.lbl_status.config(text=text)
        except Exception:  # noqa: BLE001
            pass

    # ---------- 输入管理 ----------
    def _add_files(self):
        paths = filedialog.askopenfilenames(
            title="选择模型文件",
            filetypes=[("可转换模型", "*.obj *.glb *.zip"), ("所有文件", "*.*")])
        picked = [p for p in paths if p.lower().endswith(SUPPORTED)]
        if not picked:
            return
        self._append(picked, common_input_root(picked))

    def _add_folder(self):
        d = filedialog.askdirectory(title="选择包含模型的文件夹（含子目录）")
        if not d:
            return
        try:
            found = scan_folder_inputs(d, self.out_dir)
        except Exception as e:  # noqa: BLE001
            messagebox.showerror("扫描失败", str(e)); return
        if not found:
            messagebox.showinfo("提示", "该文件夹内没有 .obj / .glb / .zip 文件。"); return
        root = os.path.abspath(d)
        self._append(found, root)
        if self.out_dir is None:
            self._set_out(default_output_dir(root))

    def _append(self, paths: list[str], root: str):
        added = 0
        abs_root = os.path.abspath(root)
        known = {item["path"] for item in self.inputs}
        for p in paths:
            ap = os.path.abspath(p)
            if ap not in known:
                self.inputs.append({"path": ap, "root": abs_root})
                self.lst.insert("end", ap)
                known.add(ap)
                added += 1
        self.lbl_count.config(text=f"已选 {len(self.inputs)} 个")
        self._sync_empty()
        if added and self.out_dir is None and self.inputs:
            self._set_out(default_output_dir(self.inputs[0]["root"]))

    def _clear_inputs(self):
        self.inputs.clear(); self.lst.delete(0, "end"); self.lbl_count.config(text="已选 0 个")
        self._sync_empty()

    def _choose_out(self):
        d = filedialog.askdirectory(title="选择输出目录")
        if d:
            self._set_out(d)

    def _set_out(self, d):
        self.out_dir = os.path.abspath(d)
        self.var_out.set(self.out_dir)
        try:
            self.ent_out.config(foreground=TEXT)
            self.ent_out.xview_moveto(1.0)      # 长路径优先露出尾部（真正在意的那一段）
        except Exception:  # noqa: BLE001
            pass

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

    def _normals(self):
        label = self.var_normals.get()
        for text, value in NORMAL_MODES:
            if text == label:
                return value
        return "auto"

    def _tex_fmt(self):
        return dict(TEX_FORMATS)[self.var_fmt.get()]

    def _start(self):
        if self.worker and self.worker.is_alive():
            return
        if not self.inputs:
            messagebox.showinfo("提示", "请先添加要转换的文件或文件夹。"); return
        if self.out_dir is None:
            self._set_out(default_output_dir(self.inputs[0]["root"]))
        run_items = inputs_for_run(self.inputs, self.out_dir)
        if not run_items:
            messagebox.showinfo("提示", "排除输出目录后没有可转换的文件。"); return
        out_err = validate_output_dir([item["root"] for item in run_items], self.out_dir)
        if out_err:
            messagebox.showerror(
                "输出目录无效",
                out_err + "\n请选择 output_glb 等独立子目录。",
            )
            return
        self.btn_run.config(state="disabled"); self.btn_open.config(state="disabled")
        self._clear_log()
        self._status(f"转换中 0/{len(run_items)}")
        self._run_total = len(run_items)
        opts = dict(
            max_texture=self._tex_size(),
            quality=int(self.var_q.get()),
            texture_format=self._tex_fmt(),
            reencode=not self.var_noreenc.get(),
            overwrite=self.var_overwrite.get(),
            transform=self.var_transform.get(),
            normals=self._normals(),
            double_sided=True if self.var_double.get() else None,
        )
        self.prog.config(value=0, maximum=len(run_items))
        self.worker = threading.Thread(
            target=self._run_worker, args=(list(run_items), self.out_dir, opts), daemon=True,
        )
        self.worker.start()

    def _run_worker(self, items: list[InputItem], out_dir: str, opts: dict):
        results: list[dict] = []
        ok = fail = 0
        naming_root = naming_root_for_items(items)
        try:
            os.makedirs(out_dir, exist_ok=True)
            self.q.put(("log", (f"共 {len(items)} 个文件，输出到：{out_dir}\n", "hd")))
            for i, item in enumerate(items, 1):
                src = item["path"]
                item_root = naming_root_for_item(item, naming_root)
                name = os.path.basename(src)
                self.q.put(("log", (f"[{i}/{len(items)}] {name} …\n", None)))
                try:
                    r = batch_glb.process_one(
                        src, item_root, out_dir,
                        opts["max_texture"], opts["quality"], opts["texture_format"],
                        opts["reencode"], False, opts["overwrite"],
                        normals=opts.get("normals", "auto"),
                        double_sided=opts.get("double_sided"),
                    )
                except Exception as e:  # noqa: BLE001
                    r = batch_glb.empty_result(src, item_root)
                    r["状态"] = "失败"
                    r["备注"] = f"处理异常：{type(e).__name__}: {e}"
                results.append(r)
                if r["状态"].startswith("成功"):
                    ok += 1
                    self.q.put(("log", (f"    ✓ {r['处理方式']} → {r['GLB文件']} · {r['体积MB']}MB\n", "ok")))
                    check = str(r.get("体检") or "")
                    if check and check != "通过":
                        self.q.put(("log", (f"    ⚠ 体检：{check}\n", "hd")))
                    if opts["transform"] and r.get("scale") != "":
                        try:
                            terr = self._write_transform(out_dir, r)
                        except Exception as e:  # noqa: BLE001
                            terr = f"transform 写入失败：{type(e).__name__}: {e}"
                        if terr:
                            r["备注"] = (r["备注"] + " | " if r["备注"] else "") + terr
                            self.q.put(("log", (f"    ⚠ {terr}\n", "er")))
                else:
                    fail += 1
                    self.q.put(("log", (f"    ✗ {r['状态']}：{r['备注']}\n", "er")))
                self.q.put(("prog", i))
        except Exception as e:  # noqa: BLE001
            self.q.put(("log", (f"\n发生错误：{type(e).__name__}: {e}\n", "er")))
        finally:
            if results:
                try:
                    man = os.path.join(out_dir, "manifest.csv")
                    with open(man, "w", newline="", encoding="utf-8-sig") as f:
                        w = csv.DictWriter(f, fieldnames=batch_glb.RESULT_FIELDS)
                        w.writeheader()
                        w.writerows(results)
                    self.q.put(("log", (f"\n清单：{man}\n", "hd")))
                except Exception as e:  # noqa: BLE001
                    self.q.put(("log", (f"\nmanifest 写入失败：{type(e).__name__}: {e}\n", "er")))
            self.q.put(("log", (f"完成：成功 {ok} 个，失败 {fail} 个。\n", "ok" if not fail else "hd")))
            self.q.put(("done", f"完成：成功 {ok} · 失败 {fail}"))

    def _write_transform(self, out_dir: str, r: dict) -> str | None:
        """写入 transform sidecar；失败返回错误说明，不抛出。"""
        stem = os.path.splitext(r["GLB文件"])[0]
        final = os.path.join(out_dir, stem + ".transform.json")
        payload = {
            "source": r["来源相对路径"], "glb": r["GLB文件"],
            "glbSha1": r["glbSha1"], "objBundleSha1": r["objBundleSha1"],
            "meshes": r.get("网格数"), "materials": r.get("材质数"), "sizeMb": r["体积MB"],
            "transform": {k: r[k] for k in ("scale", "offsetX", "offsetY", "offsetZ", "floorOffsetY")},
        }
        tmp = ""
        fd: int | None = None
        try:
            fd, tmp = tempfile.mkstemp(suffix=".transform.json", prefix=".tmp_", dir=out_dir)
            os.close(fd)
            fd = None
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
            os.replace(tmp, final)
            tmp = ""
            return None
        except Exception as e:  # noqa: BLE001
            return f"transform 写入失败：{type(e).__name__}: {e}"
        finally:
            if fd is not None:
                try:
                    os.close(fd)
                except OSError:
                    pass
            if tmp:
                try:
                    os.remove(tmp)
                except OSError:
                    pass

    # ---------- 队列刷新（主线程）----------
    def _drain_queue(self):
        try:
            while True:
                kind, data = self.q.get_nowait()
                if kind == "log":
                    self._log(*data if isinstance(data, tuple) else (data, None))
                elif kind == "prog":
                    self.prog.config(value=data)
                    self._status(f"转换中 {data}/{getattr(self, '_run_total', data)}")
                elif kind == "done":
                    self.btn_run.config(state="normal")
                    self._status(data or "完成")
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
    ConverterGUI(root)          # 主题与配色在 _init_style 里统一设置
    root.mainloop()


if __name__ == "__main__":
    main()
