@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0.."
if errorlevel 1 exit /b 1
if "%PORT%"=="" set "PORT=8888"
call "%~dp0start-bg.bat"
