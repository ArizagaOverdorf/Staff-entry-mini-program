@echo off
setlocal EnableDelayedExpansion
cd /d %~dp0

echo === Stage 12 Verification: Login, Autosave, Required Images ===

powershell -ExecutionPolicy Bypass -File .\verify-stage12-login-autosave-required-images.ps1
exit /b %ERRORLEVEL%
