@echo off
cd /d "%~dp0"
if errorlevel 1 goto cd_fail

set "PORT=8888"
if not "%~1"=="" set "PORT=%~1"
set "URL=http://127.0.0.1:%PORT%/studio.html"

call "_launch\ensure-server.bat" %PORT%
set "RC=%ERRORLEVEL%"

if not "%RC%"=="0" goto err_dispatch
goto open_ok

:open_ok
call "_launch\open-browser.bat" "%URL%"
echo.
echo [OK] %URL%
exit /b 0

:err_dispatch
if "%RC%"=="2" goto err_runtime
if "%RC%"=="3" goto err_start
if "%RC%"=="4" goto err_port
goto err_unknown

:cd_fail
echo [ERROR] cannot cd to script folder
exit /b 1

:err_runtime
echo [ERROR] no runtime - run install bat first
exit /b 2

:err_start
echo [ERROR] server did not start in 45s - run stop bat first
exit /b 3

:err_port
echo [ERROR] port %PORT% in use - run stop bat first
exit /b 4

:err_unknown
echo [ERROR] server check failed (code %RC%)
exit /b %RC%
