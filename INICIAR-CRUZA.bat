@echo off
setlocal EnableExtensions
title CRUZA 3 - Edicion Expo 24.11
cd /d "%~dp0"
set "CRUZA_DEMO_MODE=1"
set "CRUZA_DB_PATH=%CD%\data\cruza.sqlite3"
set "CRUZA_HTTPS=0"
if not exist ".venv\Scripts\python.exe" (
 echo ERROR: No existe el entorno virtual. Ejecuta ABRIR-CRUZA.bat.
 pause
 exit /b 1
)
rem Evitar error silencioso si hay otro servidor antiguo usando el puerto.
".venv\Scripts\python.exe" -c "import socket,sys; s=socket.socket(); s.settimeout(.5); result=s.connect_ex(('127.0.0.1',8765)); s.close(); sys.exit(1 if result==0 else 0)"
if errorlevel 1 (
 echo.
 echo AVISO: El puerto 8765 ya esta ocupado.
 echo Deten el servidor anterior con Ctrl+C y vuelve a abrir CRUZA.
 echo No se cerraran procesos automaticamente para proteger tus datos.
 pause
 exit /b 1
)
echo.
echo ===================================================
echo   CRUZA 3 - EDICION PARA EXPOSICION
echo ===================================================
echo Abrira el navegador cuando FastAPI este listo.
echo Direccion: http://127.0.0.1:8765/
echo La base de datos local no se borra al iniciar.
echo Manten esta ventana abierta durante la exposicion.
echo.
rem Esperar una respuesta HTTP real, no una pausa fija de 3 segundos.
start "" powershell -NoProfile -WindowStyle Hidden -Command "$u='http://127.0.0.1:8765/api/session';for($i=0;$i -lt 80;$i++){try{$r=Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 1;if($r.StatusCode -eq 200){Start-Process 'http://127.0.0.1:8765/';break}}catch{};Start-Sleep -Milliseconds 500}"
".venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8765
echo.
echo El servidor se detuvo. Revisa cualquier error anterior.
pause
