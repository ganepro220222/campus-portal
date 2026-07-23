@echo off
if /i "%~1"=="find_runtime" goto find_runtime
if /i "%~1"=="port_listening" goto port_listening
if /i "%~1"=="wait_port" goto wait_port
exit /b 1

:find_runtime
set "SRV_CMD="
set "RUNTIME=%~dp0..\_runtime"
if exist "%RUNTIME%\python\python.exe" (
  set "SRV_CMD="%RUNTIME%\python\python.exe" serve.py %PORT%"
  exit /b 0
)
if exist "%RUNTIME%\node\node.exe" (
  set "SRV_CMD="%RUNTIME%\node\node.exe" _server\studio-server.mjs"
  exit /b 0
)
where node >nul 2>&1
if not errorlevel 1 (
  set "SRV_CMD=node _server\studio-server.mjs"
  exit /b 0
)
if exist "%ProgramFiles%\nodejs\node.exe" (
  set "SRV_CMD="%ProgramFiles%\nodejs\node.exe" _server\studio-server.mjs"
  exit /b 0
)
if exist "%LocalAppData%\Programs\node\node.exe" (
  set "SRV_CMD="%LocalAppData%\Programs\node\node.exe" _server\studio-server.mjs"
  exit /b 0
)
where python >nul 2>&1
if not errorlevel 1 (
  set "SRV_CMD=python serve.py %PORT%"
  exit /b 0
)
where py >nul 2>&1
if not errorlevel 1 (
  set "SRV_CMD=py -3 serve.py %PORT%"
  exit /b 0
)
exit /b 1

:port_listening
set "P=%~2"
netstat -ano | findstr ":%P%" | findstr "LISTENING" >nul 2>&1
exit /b %errorlevel%

:wait_port
setlocal EnableDelayedExpansion
set "P=%~2"
set /a n=%~3
if "%n"=="" set /a n=45
:wait_loop
call "%~f0" port_listening %P%
if not errorlevel 1 exit /b 0
ping -n 2 127.0.0.1 >nul
set /a n-=1
if !n! leq 0 exit /b 1
goto wait_loop
