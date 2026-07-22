@echo off
chcp 65001 >nul
REM 打开 OBJ→GLB 转换器（图形界面）。需先运行过 install.bat。
cd /d "%~dp0"
python obj2glb_gui.py
if %errorlevel% neq 0 (
  echo.
  echo 启动失败。若提示缺少依赖，请先双击 install.bat。
  pause
)
