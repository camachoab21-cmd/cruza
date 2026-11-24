@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0ABRIR-EXPOSICION.ps1"
if errorlevel 1 pause
