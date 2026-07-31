@echo off
set "ROOT=%~dp0.."
cd /d "%ROOT%"
if errorlevel 1 (
  echo [ERROR] cannot cd to exhibits root
  pause
  exit /b 1
)

set "RUNTIME=%~dp0..\_runtime"
if exist "%RUNTIME%\python\python.exe" (
  "%RUNTIME%\python\python.exe" "%~dp0new-exhibit.py" %*
  set "RC=%ERRORLEVEL%"
  goto done
)
where python >nul 2>&1
if not errorlevel 1 (
  python "%~dp0new-exhibit.py" %*
  set "RC=%ERRORLEVEL%"
  goto done
)
where py >nul 2>&1
if not errorlevel 1 (
  py -3 "%~dp0new-exhibit.py" %*
  set "RC=%ERRORLEVEL%"
  goto done
)
if exist "%RUNTIME%\node\node.exe" (
  "%RUNTIME%\node\node.exe" "%ROOT%\new-exhibit.mjs" %*
  set "RC=%ERRORLEVEL%"
  goto done
)
where node >nul 2>&1
if not errorlevel 1 (
  node "%ROOT%\new-exhibit.mjs" %*
  set "RC=%ERRORLEVEL%"
  goto done
)

echo [ERROR] need Python or Node - run 安装便携环境.bat first
pause
exit /b 2

:done
pause
exit /b %RC%
