@echo off
cd /d "%~dp0"
if errorlevel 1 goto cd_fail

if not "%~1"=="" goto ensure_with_port
call "_launch\ensure-server.bat"
goto ensure_done
:ensure_with_port
call "_launch\ensure-server.bat" "%~1"
:ensure_done
set "RC=%ERRORLEVEL%"

set "PORT=8888"
if exist "_runtime\studio-port.txt" set /p PORT=<"_runtime\studio-port.txt"
if not "%~1"=="" set "PORT=%~1"
set "URL=http://127.0.0.1:%PORT%/studio.html"

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
