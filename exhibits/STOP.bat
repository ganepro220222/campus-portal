@echo off
REM ASCII entry: stop local server (same as 停止服务.bat)
cd /d "%~dp0"
if errorlevel 1 (
  echo [ERROR] cannot cd to script folder
  pause
  exit /b 1
)
call "_launch\stop.bat" %*
echo.
pause
exit /b %ERRORLEVEL%
