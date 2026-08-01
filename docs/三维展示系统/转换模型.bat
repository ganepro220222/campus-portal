@echo off
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
%PY% "convert_cli.py" %*
set "RC=%ERRORLEVEL%"
if "%RC%"=="0" goto done
if "%RC%"=="2" goto need_deps
if "%RC%"=="3" goto bad_path
if "%RC%"=="4" goto some_failed
if "%RC%"=="1" goto cancelled
if "%RC%"=="5" goto no_files
if "%RC%"=="9" goto unknown
goto unknown

:done
echo.
echo [OK] 转换完成。
goto end

:cancelled
echo.
echo [已取消] 没有填输入文件夹。
goto end

:need_deps
echo.
echo [需要安装依赖] 按上面那行命令装一次即可，之后就不用再装。
goto end

:bad_path
echo.
echo [路径有误] 请把文件夹直接拖进窗口，或粘贴完整路径。
goto end

:some_failed
echo.
echo [部分失败] 详见上面的日志与输出目录里的 manifest.csv。
goto end

:no_files
echo.
echo [没有可转换的文件] 请拖入装着 obj / mtl / 贴图 的那个文件夹。
goto end

:no_python
echo.
echo [错误] 没找到 Python。
echo 可先运行 exhibits 目录下的「安装便携环境.bat」，
echo 或到 https://www.python.org/downloads/ 安装并勾选 "Add Python to PATH"。
set "RC=9"
goto end

:cd_fail
echo [错误] 无法进入脚本所在文件夹。
set "RC=9"
goto end

:unknown
echo.
echo [错误] 转换脚本返回码 %RC%

:end
echo.
pause
exit /b %RC%
