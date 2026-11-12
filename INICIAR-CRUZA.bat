@echo off
setlocal
cd /d "%~dp0"
set CRUZA_DEMO_MODE=1
set CRUZA_DB_PATH=%CD%\data\cruza.sqlite3
set CRUZA_HTTPS=0
if not exist ".venv\Scripts\python.exe" (
  echo Falta el entorno local. Ejecuta INSTALAR.bat primero.
  pause
  exit /b 1
)
echo.
echo CRUZA 3.0 - demostracion local con servidor y base de datos
 echo Abre en el navegador: http://127.0.0.1:8765
 echo Cierra esta ventana para detener el servidor.
rem Abre el navegador cuando el servidor haya tenido tiempo de iniciar.
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://127.0.0.1:8765'"
".venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8765
pause
