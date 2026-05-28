@echo off
powershell.exe -ExecutionPolicy Bypass -File "%~dp0verify-stage6b1-draft-governance.ps1"
if %ERRORLEVEL% NEQ 0 (
  echo Stage 6B-1 draft governance verification FAILED.
  pause
  exit /b %ERRORLEVEL%
)
echo.
echo Stage 6B-1 draft governance verification finished. Press any key to close this window.
pause >nul
