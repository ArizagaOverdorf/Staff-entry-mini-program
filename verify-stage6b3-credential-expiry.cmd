@echo off
powershell.exe -ExecutionPolicy Bypass -File "%~dp0verify-stage6b3-credential-expiry.ps1"
if %ERRORLEVEL% NEQ 0 (
  echo Stage 6B-3 credential expiry verification FAILED.
  pause
  exit /b %ERRORLEVEL%
)
echo.
echo Stage 6B-3 credential expiry verification finished. Press any key to close this window.
pause >nul