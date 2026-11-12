@echo off
setlocal
cd /d "%~dp0"
where python >nul 2>&1
if errorlevel 1 (
  echo No se encontro Python 3.10 o superior. Instala Python desde python.org.
  pause
  exit /b 1
)
python -m venv .venv
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 (
  echo Fallo la instalacion. Es necesaria conexion inicial o paquetes locales.
  pause
  exit /b 1
)
echo Dependencias instaladas. Ahora ejecuta INICIAR-CRUZA.bat
pause
