@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0verify-stage4-2.ps1"
set EXIT_CODE=%ERRORLEVEL%
echo.
if not "%EXIT_CODE%"=="0" (
  echo Stage 4.2 verification failed. Press any key to close this window.
  pause >nul
  exit /b %EXIT_CODE%
)
echo Stage 4.2 verification finished. Press any key to close this window.
pause >nul

