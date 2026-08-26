@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
if errorlevel 1 goto cd_fail

rem 无参时不传 PORT，ensure-server 会读 studio-port.txt，避免第二次双击又起新服务
if not "%~1"=="" goto ensure_with_port
call "_launch\ensure-server.bat"
goto ensure_done
:ensure_with_port
call "_launch\ensure-server.bat" "%~1"
:ensure_done
set "RC=%ERRORLEVEL%"

set "PORT=8888"
rem 服务实际绑到的端口以它写下的为准：首选端口被 Windows 划进系统保留段时会自动换一个
if exist "_runtime\studio-port.txt" set /p PORT=<"_runtime\studio-port.txt"
if not "%~1"=="" set "PORT=%~1"
set "URL=http://127.0.0.1:%PORT%/studio.html"

if not "%RC%"=="0" goto err_dispatch
goto open_ok

:open_ok
echo Opening browser...
call "_launch\open-browser.bat" "%URL%"
echo.
echo [OK] %URL%
echo If browser did not open, copy the URL above.
set "RC=0"
goto end

:err_dispatch
if "%RC%"=="2" goto err_runtime
if "%RC%"=="3" goto err_start
if "%RC%"=="4" goto err_port
goto err_unknown

:cd_fail
echo [ERROR] cannot cd to script folder
set "RC=1"
goto end

:err_runtime
echo [ERROR] 请先双击「安装便携环境.bat」
goto end

:err_start
echo [ERROR] 服务未启动，请先「停止服务.bat」后重试
goto end

:err_port
echo [ERROR] 端口 %PORT% 已被占用或无法绑定，请先「停止服务.bat」
echo         若仍失败，请右键管理员运行 _dev\释放系统保留端口.bat
goto end

:err_unknown
echo [ERROR] 启动检查失败，返回码 %RC%

:end
echo.
pause
exit /b %RC%
