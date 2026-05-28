@echo off
powershell.exe -ExecutionPolicy Bypass -File "%~dp0verify-stage7-regression.ps1"
if %ERRORLEVEL% NEQ 0 (
  echo Stage 7 regression verification FAILED.
  pause
  exit /b %ERRORLEVEL%
)
echo.
echo Stage 7 regression verification finished. Press any key to close this window.
pause >nul
