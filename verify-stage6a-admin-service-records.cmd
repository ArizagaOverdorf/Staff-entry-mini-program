@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0verify-stage6a-admin-service-records.ps1"
if errorlevel 1 (
  echo.
  echo Stage 6A admin service records verification failed.
  pause
  exit /b 1
)
echo.
echo Stage 6A admin service records verification finished. Press any key to close this window.
pause >nul
