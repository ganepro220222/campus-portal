@echo off
if /i "%~1"=="find_runtime" goto find_runtime
if /i "%~1"=="port_listening" goto port_listening
if /i "%~1"=="wait_port" goto wait_port
if /i "%~1"=="wait_port_file" goto wait_port_file
if /i "%~1"=="verify_identity" goto verify_identity
exit /b 1

:find_runtime
set "SRV_CMD="
set "RUNTIME=%~dp0..\_runtime"
if exist "%RUNTIME%\python\python.exe" goto rt_py_portable
if exist "%RUNTIME%\node\node.exe" goto rt_node_portable
where node >nul 2>&1
if not errorlevel 1 goto rt_node_system
if exist "%ProgramFiles%\nodejs\node.exe" goto rt_node_pf
if exist "%LocalAppData%\Programs\node\node.exe" goto rt_node_local
where python >nul 2>&1
if not errorlevel 1 goto rt_py_system
where py >nul 2>&1
if not errorlevel 1 goto rt_py_launcher
exit /b 1

:rt_py_portable
set "SRV_CMD="%RUNTIME%\python\python.exe" serve.py %PORT%"
exit /b 0

:rt_node_portable
set "SRV_CMD="%RUNTIME%\node\node.exe" _server\studio-server.mjs"
exit /b 0

:rt_node_system
set "SRV_CMD=node _server\studio-server.mjs"
exit /b 0

:rt_node_pf
set "SRV_CMD="%ProgramFiles%\nodejs\node.exe" _server\studio-server.mjs"
exit /b 0

:rt_node_local
set "SRV_CMD="%LocalAppData%\Programs\node\node.exe" _server\studio-server.mjs"
exit /b 0

:rt_py_system
set "SRV_CMD=python serve.py %PORT%"
exit /b 0

:rt_py_launcher
set "SRV_CMD=py -3 serve.py %PORT%"
exit /b 0

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

:wait_port_file
rem 服务启动后会把实际端口写进 studio-port.txt（首选端口被系统保留时会换一个）
setlocal EnableDelayedExpansion
set /a n=%~2
if "%n"=="" set /a n=45
:wait_file_loop
if exist "_runtime\studio-port.txt" endlocal & exit /b 0
ping -n 2 127.0.0.1 >nul
set /a n-=1
if !n! leq 0 endlocal & exit /b 1
goto wait_file_loop

:verify_identity
set "P=%~2"
set "ROOT=%~3"
set "RUNTIME=%~dp0..\_runtime"
if exist "%RUNTIME%\python\python.exe" goto verify_py_portable
where python >nul 2>&1
if not errorlevel 1 goto verify_py_system
where py >nul 2>&1
if not errorlevel 1 goto verify_py_launcher
if exist "%RUNTIME%\node\node.exe" goto verify_node_portable
where node >nul 2>&1
if not errorlevel 1 goto verify_node_system
exit /b 2

:verify_py_portable
"%RUNTIME%\python\python.exe" "%~dp0verify-identity.py" %P% "%ROOT%"
exit /b %errorlevel%

:verify_py_system
python "%~dp0verify-identity.py" %P% "%ROOT%"
exit /b %errorlevel%

:verify_py_launcher
py -3 "%~dp0verify-identity.py" %P% "%ROOT%"
exit /b %errorlevel%

:verify_node_portable
"%RUNTIME%\node\node.exe" "%~dp0verify-identity.mjs" %P% "%ROOT%"
exit /b %errorlevel%

:verify_node_system
node "%~dp0verify-identity.mjs" %P% "%ROOT%"
exit /b %errorlevel%
