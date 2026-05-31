@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0verify-stage9-profile-idcard-skill-credentials.ps1"
echo.
echo Stage 9 profile, ID card, and skill credential verification finished. Press any key to close this window.
pause >nul
