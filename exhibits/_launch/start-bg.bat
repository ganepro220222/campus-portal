@echo off
cd /d "%~dp0.."
if errorlevel 1 exit /b 1
if "%PORT%"=="" set "PORT=8888"
rem Keep rem ASCII. cmd treats byte 0x85 as a line break; UTF-8 CJK often contains it.
rem No STUDIO_PASS: local insecure only (same as _dev/start.sh). Do not set this on a public host.
if not defined STUDIO_PASS set "STUDIO_ALLOW_INSECURE=1"
rem Local: if the preferred port is in a Hyper-V/WSL excluded range, try the next candidate.
rem Explicit PORT from the command line does not fall back; a public host must not set this.
if defined PORT_EXPLICIT goto port_no_fallback
set "STUDIO_PORT_FALLBACK=1"
goto port_fallback_done
:port_no_fallback
set "STUDIO_PORT_FALLBACK="
:port_fallback_done
set "RUNTIME=%~dp0..\_runtime"
if exist "%RUNTIME%\python\python.exe" goto run_py_portable
where python >nul 2>&1
if not errorlevel 1 goto run_py_system
where py >nul 2>&1
if not errorlevel 1 goto run_py_launcher
if exist "%RUNTIME%\node\node.exe" goto run_node_portable
where node >nul 2>&1
if not errorlevel 1 goto run_node_system
exit /b 1

:run_py_portable
"%RUNTIME%\python\python.exe" serve.py %PORT%
exit /b %errorlevel%

:run_py_system
python serve.py %PORT%
exit /b %errorlevel%

:run_py_launcher
py -3 serve.py %PORT%
exit /b %errorlevel%

:run_node_portable
"%RUNTIME%\node\node.exe" _server\studio-server.mjs
exit /b %errorlevel%

:run_node_system
node _server\studio-server.mjs
exit /b %errorlevel%
