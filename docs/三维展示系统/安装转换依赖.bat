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
%PY% "install_glb_deps.py"
set "RC=%ERRORLEVEL%"
goto end

:no_python
echo.
echo [错误] 没找到 Python。
echo 请先双击 exhibits 目录下的「安装便携环境.bat」，
echo 或到 https://www.python.org/downloads/ 安装并勾选 "Add Python to PATH"。
set "RC=9"
goto end

:cd_fail
echo [错误] 无法进入脚本所在文件夹。
set "RC=9"
goto end

:end
echo.
pause
exit /b %RC%
