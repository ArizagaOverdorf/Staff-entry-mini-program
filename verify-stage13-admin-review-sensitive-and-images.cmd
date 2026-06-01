@echo off
cd /d %~dp0
powershell -ExecutionPolicy Bypass -File "%~dp0verify-stage13-admin-review-sensitive-and-images.ps1"
exit /b %ERRORLEVEL%
