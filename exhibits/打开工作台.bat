@echo off
cd /d "%~dp0"
if errorlevel 1 (
  echo [ERROR] cannot cd to script folder
  pause
  exit /b 1
)

set "PORT=8199"
if not "%~1"=="" set "PORT=%~1"
set "URL=http://127.0.0.1:%PORT%/studio.html"

call "_launch\ensure-server.bat" %PORT%
set "RC=%ERRORLEVEL%"

if "%RC%"=="2" (
  echo [ERROR] no runtime - run install bat first
  goto end
)
if "%RC%"=="3" (
  echo [ERROR] server did not start in 45s - run stop bat first
  goto end
)

echo Opening browser...
call "_launch\open-browser.bat" "%URL%"

echo.
echo [OK] %URL%
echo If browser did not open, copy the URL above.

:end
echo.
pause
