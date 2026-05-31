@echo off
powershell.exe -ExecutionPolicy Bypass -File "%~dp0verify-stage9-4-avatar-date-picker.ps1"
if %errorlevel% neq 0 (
  echo Stage 9.4 verification FAILED.
  pause
  exit /b 1
)
echo Stage 9.4 verification PASSED.
