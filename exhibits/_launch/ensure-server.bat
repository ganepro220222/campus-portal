@echo off
cd /d "%~dp0.."
if errorlevel 1 exit /b 1

set "PORT=8888"
if not "%~1"=="" set "PORT=%~1"

call "%~dp0runtime.bat" find_runtime
if not defined SRV_CMD exit /b 2

call "%~dp0runtime.bat" port_listening %PORT%
if errorlevel 1 goto start_server

for %%I in ("%~dp0..") do call "%~dp0runtime.bat" verify_identity %PORT% "%%~fI"
exit /b %errorlevel%

:start_server
for %%I in ("%~dp0..") do start "ExhibitsServer" /min /D "%%~fI" cmd /k "set PORT=%PORT%&& call _launch\start-server.bat"
call "%~dp0runtime.bat" wait_port %PORT% 45
if errorlevel 1 exit /b 3
exit /b 0
