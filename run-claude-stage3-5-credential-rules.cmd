@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-claude-stage3-5-credential-rules.ps1"
echo.
echo Claude Code session ended. Press any key to close this window.
pause >nul
