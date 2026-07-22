@echo off
chcp 65001 >nul
REM ============================================================
REM  在 Windows 上把转换器打包成免安装 exe（合伙人双击即用）
REM  只需在“有 Python 的电脑”上执行一次，产物在 dist\ 里。
REM  前提：已装 Python 3.9+（勾选 Add to PATH）。
REM ============================================================
cd /d "%~dp0"

echo [1/3] 安装依赖与打包工具 ...
python -m pip install --upgrade pip
python -m pip install trimesh pillow numpy pyinstaller
if %errorlevel% neq 0 ( echo 依赖安装失败。& pause & exit /b 1 )

echo [2/3] 开始打包（onefile，无控制台窗口）...
REM 说明：
REM  --windowed        不弹黑色控制台，只显示图形界面
REM  --onefile         打成单个 exe
REM  --collect-submodules/--collect-data trimesh  确保 trimesh 的插件/数据被带上
pyinstaller --noconfirm --clean --onefile --windowed ^
  --name "OBJ转GLB转换器" ^
  --collect-submodules trimesh ^
  --collect-data trimesh ^
  --hidden-import PIL._tkinter_finder ^
  obj2glb_gui.py
if %errorlevel% neq 0 ( echo 打包失败。& pause & exit /b 1 )

echo [3/3] 完成。
echo 产物：%~dp0dist\OBJ转GLB转换器.exe
echo 把这个 exe 单独发给使用者即可，双击运行，无需装 Python。
pause
