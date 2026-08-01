@echo off
setlocal DisableDelayedExpansion
cd /d "%~dp0.."
if errorlevel 1 goto cd_fail

set "RUNTIME=%~dp0..\_runtime"
if exist "%RUNTIME%\python\python.exe" goto run_py_portable
where python >nul 2>&1
if not errorlevel 1 goto run_py_system
where py >nul 2>&1
if not errorlevel 1 goto run_py_launcher
if exist "%RUNTIME%\node\node.exe" goto run_node_portable
where node >nul 2>&1
if not errorlevel 1 goto run_node_system
goto no_runtime

:run_py_portable
"%RUNTIME%\python\python.exe" "%~dp0new-exhibit.py" %*
set "RC=%ERRORLEVEL%"
goto done

:run_py_system
python "%~dp0new-exhibit.py" %*
set "RC=%ERRORLEVEL%"
goto done

:run_py_launcher
py -3 "%~dp0new-exhibit.py" %*
set "RC=%ERRORLEVEL%"
goto done

:run_node_portable
"%RUNTIME%\node\node.exe" "%~dp0..\new-exhibit.mjs" %*
set "RC=%ERRORLEVEL%"
goto done

:run_node_system
node "%~dp0..\new-exhibit.mjs" %*
set "RC=%ERRORLEVEL%"
goto done

:cd_fail
echo [ERROR] cannot cd to exhibits root
set "RC=1"
goto done

:no_runtime
echo [ERROR] need Python or Node - run 安装便携环境.bat first
set "RC=2"
goto done

:done
exit /b %RC%
