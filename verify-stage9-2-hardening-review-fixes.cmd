@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0verify-stage9-2-hardening-review-fixes.ps1"
exit /b %ERRORLEVEL%
