@echo off
setlocal
cd /d "%~dp0"
powershell.exe -ExecutionPolicy Bypass -File "%~dp0run-claude-stage9-6-avatar-runtime-final-fix.ps1"
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Claude Stage 9.6 task failed or was interrupted.
  pause
  exit /b %ERRORLEVEL%
)
echo.
echo Claude Stage 9.6 task finished. Press any key to close this window.
pause >nul
