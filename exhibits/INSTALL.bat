@echo off
REM ASCII entry: install portable Python (same as 安装便携环境.bat)
cd /d "%~dp0"
if errorlevel 1 (
  echo [ERROR] cannot cd to script folder
  pause
  exit /b 1
)
call "_launch\install.bat" %*
echo.
pause
exit /b %ERRORLEVEL%
