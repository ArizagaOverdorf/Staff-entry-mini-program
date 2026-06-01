@echo off
cd /d %~dp0
powershell -ExecutionPolicy Bypass -File "%~dp0verify-stage15-credential-field-rules.ps1"

