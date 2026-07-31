@echo off
cd /d "%~dp0"
if errorlevel 1 (
  echo [ERROR] cannot cd to script folder
  pause
  exit /b 1
)
call "%~dp0_launch\new-exhibit.bat" %*
echo.
pause
exit /b %ERRORLEVEL%
