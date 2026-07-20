@echo off
set PORT=%1
if "%PORT%"=="" set PORT=8199
echo Stopping processes listening on port %PORT% ...
set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
  echo   kill PID %%a
  taskkill /PID %%a /F >nul 2>&1
  set FOUND=1
)
if "%FOUND%"=="0" (
  echo No process found on port %PORT%.
) else (
  echo Done.
)
pause
