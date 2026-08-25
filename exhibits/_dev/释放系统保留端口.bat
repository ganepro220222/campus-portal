@echo off
setlocal
REM Emergency only: if port 8888 cannot bind (Win/Hyper-V excluded ranges). Admin required.
cd /d "%~dp0.."

net session >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ERROR] Need Administrator. Right-click this file - Run as administrator
  echo.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  [Emergency] Release Windows reserved TCP ports for 8888
echo  Stops winnat/hns, shows ranges before/after, tests bind 8888
echo  Normal use: just run open workbench bat in exhibits root
echo ============================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\_launch\release-winnat.ps1" -Port 8888
set "RC=%ERRORLEVEL%"

echo.
if "%RC%"=="0" (
  echo Done. Go to exhibits folder and run open workbench bat
) else (
  echo Failed. Check: netsh interface ipv4 show excludedportrange protocol=tcp
)
echo.
pause
exit /b %RC%
