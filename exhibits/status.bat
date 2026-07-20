@echo off
set PORT=%1
if "%PORT%"=="" set PORT=8199
echo Checking port %PORT% ...
echo.
netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul 2>&1
if errorlevel 1 (
  echo [NO] Port %PORT% is not listening - server is probably NOT running.
  echo      Run start.bat or: cd exhibits ^&^& bash start.sh
) else (
  echo [OK] Port %PORT% is listening - server may be running.
  echo      Open: http://127.0.0.1:%PORT%/craft-001/
  echo      Or:   http://127.0.0.1:%PORT%/studio.html
  echo.
  netstat -ano | findstr /R /C:":%PORT% .*LISTENING"
)
echo.
pause
