@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Preparando CRUZA por primera vez...
  where py >nul 2>&1
  if not errorlevel 1 (
    py -3 -m venv .venv
  ) else (
    python -m venv .venv
  )
  if errorlevel 1 (
    echo Python no esta instalado o no esta disponible en PATH.
    echo Instala Python 3.10 o superior y vuelve a ejecutar este archivo.
    pause
    exit /b 1
  )
)
".venv\Scripts\python.exe" -c "import fastapi, uvicorn, jinja2, multipart" >nul 2>&1
if errorlevel 1 (
  echo Instalando dependencias necesarias. La primera vez requiere internet.
  ".venv\Scripts\python.exe" -m pip install -r requirements.txt
  if errorlevel 1 (
    echo No se pudieron instalar las dependencias.
    pause
    exit /b 1
  )
)
call INICIAR-CRUZA.bat
