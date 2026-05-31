@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0verify-stage9-3-id-card-profile-sync-final.ps1"
exit /b %ERRORLEVEL%
