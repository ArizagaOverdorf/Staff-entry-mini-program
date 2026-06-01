@echo off
cd /d %~dp0
powershell -ExecutionPolicy Bypass -File "%~dp0verify-stage14-admin-role-message-fixes.ps1"

