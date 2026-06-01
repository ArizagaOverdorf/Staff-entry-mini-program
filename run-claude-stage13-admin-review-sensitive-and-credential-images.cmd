@echo off
cd /d %~dp0
powershell -ExecutionPolicy Bypass -File "%~dp0run-claude-stage13-admin-review-sensitive-and-credential-images.ps1"
