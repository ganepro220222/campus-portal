@echo off
cd /d "%~dp0"

echo [1/3] Installing deps and PyInstaller...
python -m pip install --upgrade pip
python -m pip install trimesh pillow numpy pyinstaller
if errorlevel 1 goto fail

echo [2/3] Building one-file windowed exe...
echo Tip: Anaconda users should use build-exe-venv.bat instead.
pyinstaller --noconfirm --clean --onefile --windowed --name OBJ2GLB-Converter --collect-submodules trimesh --collect-data trimesh --hidden-import PIL._tkinter_finder --exclude-module PyQt5 --exclude-module PyQt6 --exclude-module PySide2 --exclude-module PySide6 --exclude-module matplotlib --exclude-module IPython --exclude-module sphinx --exclude-module dask --exclude-module zmq --exclude-module pytest --exclude-module black --exclude-module jupyter --exclude-module notebook obj2glb_gui.py
if errorlevel 1 goto fail

echo [3/3] Done.
echo Output: %~dp0dist\OBJ2GLB-Converter.exe
echo Rename to OBJ转GLB转换器.exe if needed.
pause
exit /b 0

:fail
echo.
echo Build failed. On Anaconda, run build-exe-venv.bat instead.
pause
exit /b 1
