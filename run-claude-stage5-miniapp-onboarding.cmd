@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-claude-stage5-miniapp-onboarding.ps1"
if errorlevel 1 (
  echo.
  echo Claude Stage 5 miniapp task failed to start or exited with an error.
  pause
  exit /b 1
)
echo.
echo Claude Stage 5 miniapp task finished. Press any key to close this window.
pause >nul
