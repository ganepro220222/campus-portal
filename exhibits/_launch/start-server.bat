@echo off
cd /d "%~dp0.."
if errorlevel 1 exit /b 1
if "%PORT%"=="" set "PORT=8200"
call "%~dp0start-bg.bat"
