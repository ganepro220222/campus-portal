@echo off
cd /d "%~dp0"
if errorlevel 1 goto cd_fail

set "PORT=8199"
if not "%~1"=="" set "PORT=%~1"
set "URL=http://127.0.0.1:%PORT%/studio.html"

call "_launch\ensure-server.bat" %PORT%
set "RC=%ERRORLEVEL%"

if "%RC%"=="2" goto err_runtime
if "%RC%"=="3" goto err_start
if "%RC%"=="4" goto err_port

echo Opening browser...
call "_launch\open-browser.bat" "%URL%"
echo.
echo [OK] %URL%
echo If browser did not open, copy the URL above.
goto end

:cd_fail
echo [ERROR] cannot cd to script folder
set "RC=1"
goto end

:err_runtime
echo [ERROR] 请先双击「安装便携环境.bat」
set "RC=2"
goto end

:err_start
echo [ERROR] 服务未启动，请先「停止服务.bat」后重试
set "RC=3"
goto end

:err_port
echo [ERROR] 端口 %PORT% 已被占用，请先「停止服务.bat」
set "RC=4"
goto end

:end
echo.
pause
exit /b %RC%
