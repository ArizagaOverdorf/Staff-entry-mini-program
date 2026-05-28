@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0verify-stage8-support.ps1"
echo.
echo Stage 8 support verification finished. Press any key to close this window.
pause >nul
