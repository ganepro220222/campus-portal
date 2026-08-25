@echo off
cd /d "%~dp0.."
if errorlevel 1 exit /b 1
if "%PORT%"=="" set "PORT=8888"
rem 便携工作台：无 STUDIO_PASS 时仅本机无鉴权（与 _dev/start.sh 一致；在线部署勿设此变量）
if not defined STUDIO_PASS set "STUDIO_ALLOW_INSECURE=1"
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
