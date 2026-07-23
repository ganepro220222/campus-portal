@echo off
set "URL=%~1"
if "%URL%"=="" exit /b 1
wscript //nologo "%~dp0open-browser.vbs" "%URL%" 2>nul
if not errorlevel 1 exit /b 0
rundll32 url.dll,FileProtocolHandler "%URL%"
exit /b 0
