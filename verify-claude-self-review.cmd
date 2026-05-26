@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0verify-claude-self-review.ps1"
if errorlevel 1 (
  echo.
  echo Claude self-review protocol verification failed.
  pause
  exit /b 1
)
echo.
echo Claude self-review protocol verification finished. Press any key to close this window.
pause >nul
