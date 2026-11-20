@echo off
setlocal EnableExtensions
title CRUZA 3 - Actualizar y abrir
if exist "%~dp0\.git\HEAD" (
  cd /d "%~dp0"
) else (
  cd /d "%USERPROFILE%\Documents\CRUZA-PUBLICACION"
)
if errorlevel 1 (
  echo ERROR: No se encontro la carpeta del proyecto CRUZA-PUBLICACION.
  pause
  exit /b 1
)
echo =======================================================
echo   CRUZA 3 - ACTUALIZACION SEGURA Y APERTURA
echo =======================================================
echo.
if not exist ".git\HEAD" (
  echo ERROR: Esta carpeta no es una copia Git del proyecto.
  echo Descarga o clona el repositorio oficial antes de actualizar.
  pause
  exit /b 1
)
where git >nul 2>&1
if errorlevel 1 (
  echo ERROR: No se encontro Git en PATH.
  pause
  exit /b 1
)
for /f "delims=" %%B in ('git branch --show-current') do set "RAMA=%%B"
if /i not "%RAMA%"=="main" (
  echo ERROR: Estas en la rama %RAMA%. No se cambiara de rama automaticamente.
  echo Conserva tus cambios y utiliza una copia de CRUZA-PUBLICACION en main.
  pause
  exit /b 1
)
echo Consultando la version nueva...
git fetch origin main
if errorlevel 1 (
  echo ERROR: Sin acceso a GitHub. No se modificaron tus archivos.
  pause
  exit /b 1
)
echo Guardando cualquier cambio local, sin borrar tu base SQLite...
git stash push -m "Respaldo CRUZA antes de actualizar"
if errorlevel 1 (
  echo ERROR: No se pudieron guardar los cambios locales. Actualizacion cancelada.
  pause
  exit /b 1
)
git merge --ff-only origin/main
if errorlevel 1 (
  echo ERROR: El historial local no permite una actualizacion directa.
  echo Se conserva el respaldo Git stash y la base de datos SQLite.
  pause
  exit /b 1
)
if not exist "app\static\cruza-ux.js" (
  echo ERROR: La nueva version no contiene el modulo visual esperado.
  pause
  exit /b 1
)
echo.
echo VERSION ACTUALIZADA:
git log -1 --format="%%h %%s"
echo.
echo IMPORTANTE: deja esta ventana abierta mientras usas CRUZA.
echo Si hay otra ventana con Uvicorn abierto, detenla primero con Ctrl+C.
echo.
call "ABRIR-CRUZA.bat"
