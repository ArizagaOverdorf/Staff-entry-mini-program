@echo off
powershell.exe -ExecutionPolicy Bypass -File "%~dp0verify-stage9-6-avatar-runtime-final-fix.ps1"
if %errorlevel% neq 0 (
  echo Stage 9.6 verification FAILED.
  pause
  exit /b 1
)
echo Stage 9.6 verification PASSED.
