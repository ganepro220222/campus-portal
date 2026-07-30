@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0.."
if errorlevel 1 exit /b 1

set "PORT=8199"
if not "%~1"=="" set "PORT=%~1"

call "%~dp0runtime.bat" find_runtime
if not defined SRV_CMD exit /b 2

call "%~dp0runtime.bat" port_listening %PORT%
if not errorlevel 1 (
  call "%~dp0runtime.bat" verify_identity %PORT% "%~dp0.."
  exit /b %errorlevel%
)

set "PORT=%PORT%"
start "ExhibitsServer" /min cmd /k "set PORT=%PORT%&& cd /d %~dp0.. && call _launch\start-bg.bat"
call "%~dp0runtime.bat" wait_port %PORT% 45
if errorlevel 1 exit /b 3
exit /b 0
