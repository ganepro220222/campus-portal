@echo off

cd /d "%~dp0"

if errorlevel 1 goto cd_fail



set "PORT=8199"

if not "%~1"=="" set "PORT=%~1"

set "URL=http://127.0.0.1:%PORT%/studio.html"



call "_launch\ensure-server.bat" %PORT%

set "RC=%ERRORLEVEL%"



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

echo [ERROR] 端口 %PORT% 已被占用，请先「停止服务.bat」

goto end



:err_unknown

echo [ERROR] 启动检查失败，返回码 %RC%



:end

echo.

pause

exit /b %RC%

