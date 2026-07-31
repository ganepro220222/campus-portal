@echo off
REM ASCII entry: create new exhibit (same as 新建展品.bat)
cd /d "%~dp0"
if errorlevel 1 (
  echo [ERROR] cannot cd to script folder
  pause
  exit /b 1
)
call "_launch\new-exhibit.bat" %*
echo.
pause
exit /b %ERRORLEVEL%
