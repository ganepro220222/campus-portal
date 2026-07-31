@echo off
cd /d "%~dp0.."
if errorlevel 1 exit /b 1
if "%PORT%"=="" set "PORT=8199"
call "%~dp0start-bg.bat"
