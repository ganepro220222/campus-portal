@echo off
chcp 65001 >nul
REM 一键安装转换器所需的 Python 依赖（首次使用运行一次即可）
REM 前提：已安装 Python 3.9+（安装时请勾选 Add Python to PATH）

echo 正在安装依赖：trimesh / pillow / numpy ...
python -m pip install --upgrade pip
python -m pip install trimesh pillow numpy
if %errorlevel% neq 0 (
  echo.
  echo 安装失败。请确认已安装 Python 并加入 PATH（命令行输入 python --version 能显示版本）。
  pause
  exit /b 1
)
echo.
echo 依赖安装完成。双击 run.bat 即可打开转换器。
pause
