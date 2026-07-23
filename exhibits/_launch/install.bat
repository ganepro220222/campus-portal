@echo off
cd /d "%~dp0"
if errorlevel 1 goto err

if exist "_runtime\python\python.exe" goto ok

where powershell >nul 2>&1
if errorlevel 1 goto no_ps

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-python.ps1"
if errorlevel 1 goto fail
goto ok

:ok
if exist "_runtime\python\python.exe" (
  echo [OK] _runtime\python\python.exe
  "_runtime\python\python.exe" --version
) else (
  echo [OK] install finished
)
pause
exit /b 0

:no_ps
echo [ERROR] PowerShell required. See usage.txt
pause
exit /b 1

:fail
echo [ERROR] install failed. See usage.txt
pause
exit /b 1

:err
echo [ERROR] cannot cd
pause
exit /b 1
