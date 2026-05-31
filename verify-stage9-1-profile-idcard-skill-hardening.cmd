@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0verify-stage9-1-profile-idcard-skill-hardening.ps1"
if %errorlevel% neq 0 (
    echo Stage 9.1 profile, ID card, and skill credential hardening verification failed.
    pause
    exit /b %errorlevel%
)
echo Stage 9.1 profile, ID card, and skill credential hardening verification passed.
pause
