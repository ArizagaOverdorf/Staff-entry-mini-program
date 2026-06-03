@echo off
setlocal
powershell -ExecutionPolicy Bypass -File "%~dp0verify-stage18-home-message-audit-ui.ps1"
exit /b %ERRORLEVEL%
