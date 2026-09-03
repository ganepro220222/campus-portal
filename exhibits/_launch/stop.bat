@echo off
cd /d "%~dp0.."
set "PORT=8888"
if not "%~1"=="" set "PORT=%~1"
if "%~1"=="" if exist "_runtime\studio-port.txt" set /p PORT=<"_runtime\studio-port.txt"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do taskkill /PID %%a /F >nul 2>&1

netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
if errorlevel 1 goto port_cleared
echo [FAIL] port %PORT% still listening
exit /b 1
:port_cleared
echo [OK] port %PORT% cleared
exit /b 0
