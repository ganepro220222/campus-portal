@echo off
cd /d %~dp0
if errorlevel 1 (
  echo [ERROR] Cannot enter directory: %~dp0
  goto :fail
)

set PORT=%1
if "%PORT%"=="" set PORT=8199

echo.
echo ============================================
echo   exhibits local server  port %PORT%
echo ============================================
echo   craft-001: http://127.0.0.1:%PORT%/craft-001/
echo   studio:    http://127.0.0.1:%PORT%/studio.html
echo   Stop with Ctrl+C in this window
echo ============================================
echo.

where node >nul 2>&1
if %ERRORLEVEL%==0 (
  echo [start] node _server/studio-server.mjs
  set PORT=%PORT%
  node _server/studio-server.mjs
  if errorlevel 1 (
    echo.
    echo [ERROR] Server failed. Is port %PORT% already in use?
  )
  goto :done
)

where python >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Neither node nor python found in PATH.
  echo Install Node.js or Python, or run from Git Bash: bash start.sh
  goto :fail
)

echo [start] python serve.py %PORT%
python serve.py %PORT%
if errorlevel 1 (
  echo.
  echo [ERROR] Server failed. Is port %PORT% already in use?
)
goto :done

:fail
echo.
pause
exit /b 1

:done
echo.
echo Server stopped.
pause
