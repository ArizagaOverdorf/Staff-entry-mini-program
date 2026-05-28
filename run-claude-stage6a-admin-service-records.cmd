@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-claude-stage6a-admin-service-records.ps1"
echo.
echo Claude Code session ended. Press any key to close this window.
pause >nul
