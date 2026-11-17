@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Ejecuta ABRIR-CRUZA.bat para preparar la aplicacion.
  pause
  exit /b 1
)
".venv\Scripts\python.exe" arrancar.py
if errorlevel 1 pause
