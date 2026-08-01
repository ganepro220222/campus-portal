#!/usr/bin/env python3
"""
「转换模型.bat」背后的交互流程。

单独抽出来是为了让逻辑可测：.bat 只负责找 Python 并把控制权交过来，
所有会出错的判断（依赖缺失、路径不存在、输出目录非法）都在这里，
并且每一条都有明确的中文提示和退出码，不会一闪就关。

退出码：0 成功 / 1 用户取消 / 2 缺依赖 / 3 路径有误 / 4 转换有失败项 / 5 没有可转换的文件
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REQUIRED = (("trimesh", "trimesh"), ("PIL", "pillow"), ("numpy", "numpy"))
CONVERTIBLE = (".obj", ".glb", ".zip")


def find_convertible(root: str) -> list[str]:
    """递归找出可转换的文件。空文件夹要单独报，不能混进「部分失败」里。"""
    found = []
    for dirpath, _dirnames, filenames in os.walk(root):
        for fn in sorted(filenames):
            if fn.lower().endswith(CONVERTIBLE):
                found.append(os.path.join(dirpath, fn))
    return found


def missing_packages() -> list[str]:
    """返回缺失依赖的 pip 名称（顺序稳定，便于测试与提示）。"""
    missing = []
    for module, pip_name in REQUIRED:
        try:
            __import__(module)
        except Exception:          # noqa: BLE001  导入期任何异常都按缺失处理
            missing.append(pip_name)
    return missing


def clean_path(raw: str) -> str:
    """
    规整用户输入的路径。
    Windows 拖拽进来的路径会自带引号，末尾可能有空格；也允许 ~ 展开。
    """
    s = (raw or "").strip()
    if len(s) >= 2 and s[0] == s[-1] and s[0] in "\"'":
        s = s[1:-1]
    s = s.strip()
    if not s:
        return ""
    return os.path.abspath(os.path.expanduser(s))


def resolve_io(in_raw: str, out_raw: str, default_out_name: str = "输出GLB") -> tuple[str, str, str | None]:
    """
    校验输入/输出目录。返回 (输入目录, 输出目录, 错误说明)。
    输出留空时放在输入目录旁边，避免新手把产物混进素材堆里。
    """
    src = clean_path(in_raw)
    if not src:
        return "", "", "没有填输入文件夹"
    if not os.path.isdir(src):
        return src, "", f"输入文件夹不存在：{src}"

    dst = clean_path(out_raw)
    if not dst:
        dst = os.path.join(os.path.dirname(src.rstrip(os.sep)) or src, default_out_name)
    if os.path.abspath(dst) == os.path.abspath(src):
        return src, dst, "输出文件夹不能和输入文件夹相同（否则产物会混进素材里）"
    if os.path.exists(dst) and not os.path.isdir(dst):
        return src, dst, f"输出路径已被一个文件占用：{dst}"
    return src, dst, None


def _ask(prompt: str) -> str:
    try:
        return input(prompt)
    except EOFError:
        return ""


def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)

    print("=" * 56)
    print("  OBJ → GLB 批量转换")
    print("=" * 56)
    print("把装着 obj / mtl / 贴图 的文件夹拖到窗口里，回车即可。")
    print("转换会自动修正金属度与法线，并输出一份资产体检报告。")
    print()

    lost = missing_packages()
    if lost:
        print("[缺少依赖] 还差：" + "、".join(lost))
        print("请在此窗口执行下面这行安装（只需一次）：")
        print(f'    "{sys.executable}" -m pip install ' + " ".join(lost))
        print()
        return 2

    src_raw = argv[0] if argv else _ask("输入文件夹（可直接拖进来）：")
    out_raw = argv[1] if len(argv) > 1 else _ask("输出文件夹（留空＝自动放在输入文件夹旁边）：")

    src, dst, err = resolve_io(src_raw, out_raw)
    if err:
        print()
        print(f"[路径有误] {err}")
        return 3 if src_raw.strip() else 1

    found = find_convertible(src)
    if not found:
        print()
        print(f"[没有可转换的文件] {src}")
        print("这个文件夹里没有找到 .obj / .glb / .zip。")
        print("请确认拖对了文件夹（要的是装着 obj+mtl+贴图 的那个）。")
        return 5

    print()
    print(f"输入：{src}（{len(found)} 个文件）")
    print(f"输出：{dst}")
    print("-" * 56)

    os.makedirs(dst, exist_ok=True)
    return run_batch(src, dst)


def run_batch(src: str, dst: str) -> int:
    """batch_glb 的入口是 argparse + sys.argv，这里临时改写 argv 后调用它。"""
    sys.path.insert(0, HERE)
    import batch_glb                                    # 延后导入：依赖检查通过后才加载
    saved = sys.argv
    sys.argv = ["batch_glb.py", src, "-o", dst]
    try:
        fail = batch_glb.main()
        return 4 if fail else 0
    except SystemExit as e:
        code = e.code
        if code is None:
            return 0
        return code if isinstance(code, int) else 9
    finally:
        sys.argv = saved


if __name__ == "__main__":
    try:
        code = main()
    except Exception as e:  # noqa: BLE001
        print()
        print(f"[程序异常] {type(e).__name__}: {e}")
        code = 9
    print()
    if code == 0:
        print("[完成] 输出目录里的 manifest.csv 记录了每个模型的体检结果。")
    sys.exit(code)
