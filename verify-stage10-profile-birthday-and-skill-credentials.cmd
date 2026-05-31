@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0verify-stage10-profile-birthday-and-skill-credentials.ps1"
echo.
echo Stage 10 profile birthday and skill credential verification finished. Press any key to close this window.
pause >nul
