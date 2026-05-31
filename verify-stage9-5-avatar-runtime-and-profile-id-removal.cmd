@echo off
powershell.exe -ExecutionPolicy Bypass -File "%~dp0verify-stage9-5-avatar-runtime-and-profile-id-removal.ps1"
if %errorlevel% neq 0 (
  echo Stage 9.5 verification FAILED.
  pause
  exit /b 1
)
echo Stage 9.5 verification PASSED.
