@echo off
chcp 65001 >nul 2>&1
echo.
echo ========================================
echo   立体鉴赏 · 环境诊断
echo ========================================
echo.
echo 脚本位置: %~dp0
cd /d "%~dp0"
if errorlevel 1 goto cd_fail
echo 当前目录: %CD%
echo.

echo %CD%| findstr /C:"(" >nul
if not errorlevel 1 goto warn_paren
goto check_files

:warn_paren
echo [警告] 文件夹名含括号 ( ) ，Windows 容易闪退
echo         请把整个文件夹改名为不含括号的名称，例如 exhibits2
echo.

:check_files
if exist "%~dp0_launch\install.bat" echo [OK] _launch\install.bat
if not exist "%~dp0_launch\install.bat" echo [缺失] _launch\install.bat
if exist "%~dp0_launch\install-python.ps1" echo [OK] _launch\install-python.ps1
if not exist "%~dp0_launch\install-python.ps1" echo [缺失] _launch\install-python.ps1
if exist "%~dp0serve.py" echo [OK] serve.py
if not exist "%~dp0serve.py" echo [缺失] serve.py — 是否在正确目录？
echo.
if exist "%~dp0_runtime\python\python.exe" goto py_ok
echo [未安装] 便携 Python — 请运行「安装便携环境.bat」
goto end

:py_ok
echo [OK] 便携 Python 已安装
"%~dp0_runtime\python\python.exe" --version
goto end

:cd_fail
echo [错误] 无法进入目录

:end
echo.
echo 若仍闪退，请 Win+R 输入 cmd，执行：
echo   cd /d "你的解压路径"
echo   诊断.bat
echo.
pause
exit /b 0
