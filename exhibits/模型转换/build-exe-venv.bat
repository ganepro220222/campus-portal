@echo off
cd /d "%~dp0"

set "VENV=%~dp0.venv-build"

echo Step 1/4: create venv if missing
if exist "%VENV%\Scripts\python.exe" goto deps
python -m venv "%VENV%"
if errorlevel 1 goto fail

:deps
echo Step 2/4: install trimesh pillow numpy pyinstaller
"%VENV%\Scripts\python.exe" -m pip install --upgrade pip
"%VENV%\Scripts\python.exe" -m pip install trimesh pillow numpy pyinstaller
if errorlevel 1 goto fail

echo Step 3/4: pyinstaller onefile windowed
"%VENV%\Scripts\pyinstaller.exe" --noconfirm --clean --onefile --windowed --name OBJ2GLB-Converter --collect-submodules trimesh --collect-data trimesh --hidden-import PIL._tkinter_finder obj2glb_gui.py
if errorlevel 1 goto fail

echo Step 4/4: done
echo dist\OBJ2GLB-Converter.exe
pause
exit /b 0

:fail
echo Build failed
pause
exit /b 1
