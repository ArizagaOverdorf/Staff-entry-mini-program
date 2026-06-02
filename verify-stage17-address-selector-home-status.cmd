@echo off
cd /d %~dp0
powershell -ExecutionPolicy Bypass -File "%~dp0verify-stage17-address-selector-home-status.ps1"

