@echo off
cd /d %~dp0
powershell -ExecutionPolicy Bypass -File "%~dp0verify-stage16-phone-login-account-reuse.ps1"

