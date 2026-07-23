@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0.."
if "%PORT%"=="" set "PORT=8199"
call "%~dp0runtime.bat" find_runtime
if not defined SRV_CMD exit /b 1
!SRV_CMD!
