@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
if errorlevel 1 goto cd_fail

set "PY="
if exist "_runtime\python\python.exe" goto use_portable
if exist "..\..\exhibits\_runtime\python\python.exe" goto use_exhibits_portable
where py >nul 2>&1
if not errorlevel 1 goto use_launcher
where python >nul 2>&1
if not errorlevel 1 goto use_python
goto no_python

:use_portable
set "PY="%~dp0_runtime\python\python.exe""
goto run

:use_exhibits_portable
set "PY="%~dp0..\..\exhibits\_runtime\python\python.exe""
goto run

:use_launcher
set "PY=py -3"
goto run

:use_python
set "PY=python"
goto run

:run
rem 启动器本身不需 tkinter；由 launch_gui.py 挑选带 GUI 的解释器
%PY% "launch_gui.py"
set "RC=%ERRORLEVEL%"
if "%RC%"=="0" goto done
if "%RC%"=="2" goto need_deps
if "%RC%"=="3" goto no_tk
goto fail

:done
exit /b 0

:need_deps
echo.
echo [需要安装依赖] 见上面提示；也可对完整 Python 执行 pip install trimesh pillow numpy
goto end_pause

:no_tk
echo.
echo [无法启动图形界面] 见上面说明。
goto end_pause

:fail
echo.
echo [启动失败] 详见上方输出。
goto end_pause

:no_python
echo.
echo [错误] 没找到任何 Python。
echo 请安装完整 Python 3.12+（勾选 tcl/tk 与 PATH），
echo 或到 exhibits 目录运行「安装便携环境.bat」后再试（命令行版可用）。
set "RC=9"
goto end_pause

:cd_fail
echo [错误] 无法进入脚本所在文件夹。
set "RC=9"
goto end_pause

:end_pause
echo.
pause
exit /b %RC%
