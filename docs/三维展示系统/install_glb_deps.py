#!/usr/bin/env python3
"""为便携 Python 启用 pip 并安装 GLB 转换依赖（trimesh / pillow / numpy）。"""
from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import urllib.request

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

from python_env import argv_key, pick_gui_python  # noqa: E402

PACKAGES = ("trimesh", "pillow", "numpy")
GET_PIP_URL = "https://bootstrap.pypa.io/get-pip.py"


def find_pth(python_dir: str) -> str | None:
    for fn in os.listdir(python_dir):
        if fn.endswith("._pth"):
            return os.path.join(python_dir, fn)
    return None


def enable_site_packages(python_dir: str) -> tuple[bool, str, bool]:
    """嵌入式 Python 默认禁用 site；不解开就无法 import pip 包装的东西。"""
    pth = find_pth(python_dir)
    if not pth:
        return True, "（完整 Python，无需改 ._pth）", False
    text = open(pth, encoding="utf-8").read()
    if "import site" in text and "#import site" not in text:
        return True, "site-packages 已启用", False
    new = text.replace("#import site", "import site")
    if new == text and "import site" not in text:
        new = text.rstrip() + "\nimport site\n"
    with open(pth, "w", encoding="utf-8", newline="\n") as f:
        f.write(new)
    return True, "已启用 site-packages（修改了 ._pth）", True


def pip_ready(py_exe: str) -> bool:
    r = subprocess.run([py_exe, "-m", "pip", "--version"], capture_output=True)
    return r.returncode == 0


def bootstrap_pip(py_exe: str) -> None:
    fd, path = tempfile.mkstemp(suffix=".py", prefix="get-pip-")
    os.close(fd)
    try:
        print(f"下载 get-pip …")
        urllib.request.urlretrieve(GET_PIP_URL, path)
        print("安装 pip …")
        subprocess.run([py_exe, path], check=True)
    finally:
        os.remove(path)


def packages_ok(py_exe: str) -> list[str]:
    """在新 Python 进程里验证 import（改 ._pth 后当前进程看不到 site-packages）。"""
    probe = (
        "import sys\n"
        "missing=[]\n"
        "for mod,name in (('trimesh','trimesh'),('PIL','pillow'),('numpy','numpy')):\n"
        "  try: __import__(mod)\n"
        "  except Exception: missing.append(name)\n"
        "print(','.join(missing))\n"
    )
    r = subprocess.run([py_exe, "-c", probe], capture_output=True, text=True)
    if r.returncode != 0:
        return list(PACKAGES)
    out = (r.stdout or "").strip()
    return out.split(",") if out else []


def install_for_argv(argv: list[str]) -> int:
    """对指定 Python 命令安装依赖；argv 如 [python.exe] 或 ['py','-3']。"""
    label = " ".join(argv)
    print(f"Python：{label}")

    py_exe = argv[0]
    if os.path.isfile(py_exe):
        ok, msg, pth_changed = enable_site_packages(os.path.dirname(os.path.abspath(py_exe)))
        print(msg)
        if not ok:
            return 1
        if pth_changed:
            print("（已修改 ._pth，校验将在新进程中进行）")
    else:
        print("（启动器 / 完整 Python，跳过 ._pth）")

    if not pip_ready_argv(argv):
        try:
            bootstrap_pip_argv(argv)
        except Exception as e:  # noqa: BLE001
            print(f"[失败] 无法安装 pip：{e}")
            return 1

    print("安装 trimesh、pillow、numpy …")
    r = subprocess.run([*argv, "-m", "pip", "install", *PACKAGES], check=False)
    if r.returncode != 0:
        print("[失败] pip install 未成功")
        return 1

    lost = packages_ok_argv(argv)
    if lost:
        print("[失败] 安装后仍缺：" + "、".join(lost))
        return 1
    print("[OK] 此 Python 已具备转换依赖")
    return 0


def pip_ready_argv(argv: list[str]) -> bool:
    return subprocess.run([*argv, "-m", "pip", "--version"], capture_output=True).returncode == 0


def bootstrap_pip_argv(argv: list[str]) -> None:
    fd, path = tempfile.mkstemp(suffix=".py", prefix="get-pip-")
    os.close(fd)
    try:
        print("下载 get-pip …")
        urllib.request.urlretrieve(GET_PIP_URL, path)
        print("安装 pip …")
        subprocess.run([*argv, path], check=True)
    finally:
        os.remove(path)


def packages_ok_argv(argv: list[str]) -> list[str]:
    probe = (
        "missing=[]\n"
        "for mod,name in (('trimesh','trimesh'),('PIL','pillow'),('numpy','numpy')):\n"
        "  try: __import__(mod)\n"
        "  except Exception: missing.append(name)\n"
        "print(','.join(missing))\n"
    )
    r = subprocess.run([*argv, "-c", probe], capture_output=True, text=True)
    if r.returncode != 0:
        return list(PACKAGES)
    out = (r.stdout or "").strip()
    return out.split(",") if out else []


def main() -> int:
    portable_argv = [os.path.abspath(sys.executable)]
    targets: list[list[str]] = [portable_argv]

    gui_py, reason = pick_gui_python()
    if gui_py and argv_key(gui_py) != argv_key(portable_argv):
        targets.append(gui_py)

    print("=" * 56)
    print("  安装 GLB 转换依赖")
    print("=" * 56)
    print("将为以下 Python 安装（命令行 + 图形界面若不同则各装一份）：")
    print()

    rc = 0
    for i, argv in enumerate(targets):
        if i:
            print()
        if install_for_argv(argv) != 0:
            rc = 1

    print()
    if rc == 0:
        print("[完成] 依赖已就绪。")
        print("  · 命令行：双击「转换模型.bat」")
        if reason == "no_tk":
            print("  · 图形界面：当前环境无 tkinter，需安装完整 Python 或打包 exe（见 README-转换器.md）")
        else:
            print("  · 图形界面：双击「打开转换器.bat」")
    return rc


if __name__ == "__main__":
    try:
        code = main()
    except Exception as e:  # noqa: BLE001
        print(f"[程序异常] {type(e).__name__}: {e}")
        code = 1
    print()
    sys.exit(code)
