@echo off
setlocal
cd /d "%~dp0"
powershell.exe -ExecutionPolicy Bypass -File "%~dp0run-claude-stage11-profile-credential-merge.ps1"
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Claude Stage 11 task failed or was interrupted.
  pause
  exit /b %ERRORLEVEL%
)
echo.
echo Claude Stage 11 task finished. Press any key to close this window.
pause >nul
