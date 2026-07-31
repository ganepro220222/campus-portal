#!/usr/bin/env python3
"""Pack exhibits/ for partner delivery (Windows 本地编辑包)."""
from __future__ import annotations

import zipfile
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'exhibits-交付包.zip'

EXCLUDE_TOP_DIRS = frozenset({
    'node_modules', 'e2e', 'test-results', 'playwright-report', 'blob-report',
    '__pycache__', '_dev',
})

EXCLUDE_FILES = frozenset({
    '.gitignore', '.gitattributes', '.studio-instance-id',
    'package.json', 'package-lock.json', 'playwright.config.mjs',
    'exhibits-交付包.zip', 'exhibits.zip', 'pack-delivery.py',
    'check-static-deps.mjs', 'build-viewer.mjs',
    '_verify_zip.py', '_normalize_bats.py',
})

EXCLUDE_SUFFIXES = ('.test.mjs',)

DELIVERY_README = f"""立体鉴赏系统 · 交付包
打包日期：{date.today().isoformat()}

【解压】
  解压到任意路径（路径尽量不含特殊字符）。文件夹名保持 exhibits 或自定均可。

【首次使用（每台 Windows 电脑一次）】
  1. 双击「INSTALL.bat」或「安装便携环境.bat」（约 12MB 便携 Python，需联网）
  2. 双击「START.bat」或「打开工作台.bat」→ 浏览器打开编辑列表
  3. 结束编辑后双击「STOP.bat」或「停止服务.bat」

【若中文文件名 bat 闪退】
  请只用英文文件名：INSTALL.bat → START.bat → NEW.bat → STOP.bat

【新建展品】
  方式 A（推荐）：打开工作台 → 点「＋ 新建展品」
  方式 B：双击「NEW.bat」或「新建展品.bat」，按提示输入编号和名称
  然后把 model.glb 放入 craft-XXX/assets/，回到工作台刷新 → 编辑 → 保存

【目录说明】
  craft-001 … craft-004   示例展品（含模型与配置，可参考修改）
  _template/              空白展品模板（新建时自动复制）
  player.html             编辑器（勿删）
  player.view.html        对外观看页（由 player.html 生成，已包含）
  studio.html             工作台列表页
  vendor/                 Three.js 与解码器（离线，勿删）
  _launch/、_server/      启动与服务脚本（勿删）
  serve.py                Python 服务端（便携环境使用）
  使用说明.txt            简明说明

【多台电脑】
  在一台电脑安装便携环境后，可复制整个文件夹到其他 Windows 电脑；
  若目标电脑未装过，仍需在该电脑运行一次「安装便携环境.bat」。

【勿包含在本包内的内容】
  node_modules、e2e、测试文件、playwright 报告等为开发用途，已排除。

【安全提示】
  默认仅本机 127.0.0.1 使用。若部署到服务器，请阅读 README.md 中鉴权说明，
  务必设置 STUDIO_PASS，勿将编辑接口暴露到公网。

【问题排查】
  · 双击 bat 闪退：先运行「安装便携环境.bat」
  · 保存不生效：确认用「打开工作台.bat」启动，而非直接双击 HTML
  · 端口占用：先「停止服务.bat」，或改 打开工作台.bat 端口参数
"""


def should_include(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    parts = rel.parts
    if not parts:
        return False
    if parts[0] in EXCLUDE_TOP_DIRS:
        return False
    if any(p.startswith('._creating') or p.startswith('.') and p not in ('.',) for p in parts):
        # keep normal files; skip hidden temp dirs
        if any(p.startswith('._creating') for p in parts):
            return False
    if path.name in EXCLUDE_FILES:
        return False
    if path.name.endswith(EXCLUDE_SUFFIXES):
        return False
    if '.bak' in parts:
        return False
    rel_posix = rel.as_posix()
    if rel_posix.startswith('_runtime/python') or rel_posix.startswith('_runtime/node'):
        return False
    return True


def read_bytes_for_zip(path: Path) -> bytes:
    raw = path.read_bytes()
    if path.suffix.lower() != '.bat':
        return raw
    text = raw.decode('utf-8-sig').replace('\r\n', '\n').replace('\r', '\n')
    return text.replace('\n', '\r\n').encode('utf-8')


def main() -> None:
    if OUT.exists():
        OUT.unlink()
    files: list[Path] = []
    for path in sorted(ROOT.rglob('*')):
        if path.is_file() and should_include(path):
            files.append(path)

    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for path in files:
            arcname = path.relative_to(ROOT).as_posix()
            zf.writestr(arcname, read_bytes_for_zip(path))
        zf.writestr('交付说明.txt', DELIVERY_README.encode('utf-8'))

    size_mb = OUT.stat().st_size / (1024 * 1024)
    print(f'OK  {OUT.name}')
    print(f'    {len(files) + 1} entries, {size_mb:.2f} MiB')
    print('    top-level included:')
    tops = sorted({p.relative_to(ROOT).parts[0] for p in files})
    for name in tops:
        print(f'      - {name}')


if __name__ == '__main__':
    main()
