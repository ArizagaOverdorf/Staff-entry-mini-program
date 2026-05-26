@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0verify-stage5-miniapp.ps1"
if errorlevel 1 (
  echo.
  echo Stage 5 miniapp verification failed.
  pause
  exit /b 1
)
echo.
echo Stage 5 miniapp verification finished. Press any key to close this window.
pause >nul
