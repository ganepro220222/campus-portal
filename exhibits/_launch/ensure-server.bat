@echo off
cd /d "%~dp0.."
if errorlevel 1 exit /b 1

set "PORT=8888"
set "PORT_EXPLICIT="
rem 单行写法：带括号的 if 块在含「(」的路径（如 exhibits (2)\）下会被 cmd 解析错
if not "%~1"=="" set "PORT=%~1"
if not "%~1"=="" set "PORT_EXPLICIT=1"

rem 没指定端口时，沿用上次服务实际绑到的端口：Windows 上首选端口可能被系统
rem 保留，服务会自动换一个并把它写进 studio-port.txt。
if not defined PORT_EXPLICIT if exist "_runtime\studio-port.txt" set /p PORT=<"_runtime\studio-port.txt"

call "%~dp0runtime.bat" find_runtime
if not defined SRV_CMD exit /b 2

call "%~dp0runtime.bat" port_listening %PORT%
if errorlevel 1 goto start_server

for %%I in ("%~dp0..") do call "%~dp0runtime.bat" verify_identity %PORT% "%%~fI"
exit /b %errorlevel%

:start_server
rem 端口文件是上一次的结果，先删掉，免得等待时读到过期值
del /q "_runtime\studio-port.txt" >nul 2>&1
for %%I in ("%~dp0..") do start "ExhibitsServer" /min /D "%%~fI" cmd /k "set PORT=%PORT%&& set PORT_EXPLICIT=%PORT_EXPLICIT%&& call _launch\start-server.bat"
call "%~dp0runtime.bat" wait_port_file 45
if errorlevel 1 exit /b 3
set /p PORT=<"_runtime\studio-port.txt"
call "%~dp0runtime.bat" wait_port %PORT% 15
if errorlevel 1 exit /b 3
exit /b 0
