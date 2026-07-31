@echo off
set "LAUNCH=%~dp0"
set "ROOT=%LAUNCH%.."
cd /d "%ROOT%"
if errorlevel 1 goto err

if exist "%ROOT%\_runtime\python\python.exe" goto ok

where powershell >nul 2>&1
if errorlevel 1 goto no_ps

if not exist "%LAUNCH%install-python.ps1" goto missing_ps1

powershell -NoProfile -ExecutionPolicy Bypass -File "%LAUNCH%install-python.ps1"
if errorlevel 1 goto fail
goto ok

:ok
if not exist "%ROOT%\_runtime\python\python.exe" goto missing_exe
echo [OK] _runtime\python\python.exe
"%ROOT%\_runtime\python\python.exe" --version
pause
exit /b 0

:missing_exe
echo [ERROR] install finished but python.exe not found under _runtime\python
pause
exit /b 1

:missing_ps1
echo [ERROR] missing: %LAUNCH%install-python.ps1
echo Check _launch folder is complete.
pause
exit /b 1

:no_ps
echo [ERROR] PowerShell required. See 使用说明.txt
pause
exit /b 1

:fail
echo [ERROR] install failed. See 使用说明.txt
pause
exit /b 1

:err
echo [ERROR] cannot cd to exhibits root: %ROOT%
pause
exit /b 1
