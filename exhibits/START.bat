@echo off
REM ASCII entry: open studio (same as 打开工作台.bat)
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
echo [ERROR] cannot cd to script folder: %~dp0
set "RC=1"
goto end

:err_runtime
echo [ERROR] no Python/Node found. Run INSTALL.bat first.
set "RC=2"
goto end

:err_start
echo [ERROR] server did not start in 45s. Run STOP.bat and retry.
set "RC=3"
goto end

:err_port
echo [ERROR] port %PORT% is used by another copy. Run STOP.bat first.
set "RC=4"
goto end

:end
echo.
pause
exit /b %RC%
