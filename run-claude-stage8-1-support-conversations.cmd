@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-claude-stage8-1-support-conversations.ps1"
echo.
echo Claude Code session ended. Press any key to close this window.
pause >nul
