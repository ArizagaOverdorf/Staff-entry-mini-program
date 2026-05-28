@echo off
powershell.exe -ExecutionPolicy Bypass -File "%~dp0verify-stage6b2-management-status.ps1"
if %ERRORLEVEL% NEQ 0 (
  echo Stage 6B-2 management status verification FAILED.
  pause
  exit /b %ERRORLEVEL%
)
echo.
echo Stage 6B-2 management status verification finished. Press any key to close this window.
pause >nul
