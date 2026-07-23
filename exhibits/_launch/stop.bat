@echo off
cd /d "%~dp0.."
set "PORT=8199"
if not "%~1"=="" set "PORT=%~1"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do taskkill /PID %%a /F >nul 2>&1

echo [OK] port %PORT% cleared
pause
