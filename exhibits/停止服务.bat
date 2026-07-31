@echo off
cd /d "%~dp0"
if errorlevel 1 goto cd_fail
call "_launch\stop.bat" %*
set "RC=%ERRORLEVEL%"
echo.
pause
exit /b %RC%

:cd_fail
echo [ERROR] cannot cd to script folder
echo Tip: if folder name has parentheses e.g. exhibits^(2^), rename to exhibits2
pause
exit /b 1
