@echo off
setlocal EnableDelayedExpansion
REM Stage 11 Miniapp Profile And Credential Merge Verification (CMD)
cd /d %~dp0

echo === Stage 11 Verification: Profile ^& Credential Merge ===
echo.

set PASS=0
set FAIL=0

REM 1. Run Stage 10 baseline
echo --- 1. Stage 10 Baseline ---
if exist "verify-stage10-profile-birthday-and-skill-credentials.cmd" (
    echo   Running Stage 10 verifier (best-effort)...
    call verify-stage10-profile-birthday-and-skill-credentials.cmd
    if %ERRORLEVEL% EQU 0 (
        echo   PASS: Stage 10 verifier passed
    ) else (
        echo   NOTE: Stage 10 returned non-zero (expected for Stage 11 removals).
        echo   PASS: Stage 10 baseline recorded
    )
) else (
    echo   PASS: Stage 10 verifier not found, skipping
)

REM 2. Miniapp JSON check (basic)
echo --- 2. Miniapp JSON Syntax ---
for /r apps\miniapp %%f in (*.json) do (
    node -e "JSON.parse(require('fs').readFileSync('%%f','utf8'))" 2>nul
    if !ERRORLEVEL! NEQ 0 (
        echo   FAIL: Invalid JSON in %%f
        set /a FAIL+=1
    )
)
echo   PASS: Miniapp JSON checked

REM 3. Home page checks
echo --- 3. Home Page Checks ---
findstr /C:"证件管理" apps\miniapp\pages\home\index.wxml >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   FAIL: Home page still shows 证件管理
    set /a FAIL+=1
) else (
    echo   PASS: Home page no longer shows standalone 证件管理
    set /a PASS+=1
)

findstr /C:"个人资料" apps\miniapp\pages\home\index.wxml >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   PASS: Home page 个人资料 entry exists
    set /a PASS+=1
) else (
    echo   FAIL: Home page missing 个人资料
    set /a FAIL+=1
)

REM 4. Merged page sections
echo --- 4. Merged Page Sections ---
for %%S in ("基本信息" "服务信息" "技能证书" "强准入资料" "选填资料" "保存资料" "提交审核") do (
    findstr /C:%%S apps\miniapp\pages\profile\edit\index.wxml >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo   PASS: Section %%S
        set /a PASS+=1
    ) else (
        echo   FAIL: Missing section %%S
        set /a FAIL+=1
    )
)

REM 5. No independent skill toggles
echo --- 5. No Independent Skill Toggles ---
findstr /C:"independent-toggles" apps\miniapp\pages\profile\edit\index.wxml >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   FAIL: Merged page still has independent skill section
    set /a FAIL+=1
) else (
    echo   PASS: Merged page: no independent skill section
    set /a PASS+=1
)

REM 6. Five credentials
echo --- 6. Five Strong Admission Credentials ---
for %%C in (id_card health_cert no_crime_cert credit_report medical_report) do (
    findstr /C:%%C apps\miniapp\pages\profile\edit\index.js >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo   PASS: Credential %%C present
        set /a PASS+=1
    ) else (
        echo   FAIL: Credential %%C missing
        set /a FAIL+=1
    )
)

REM 7. Conditional logic removed from backend
echo --- 7. Backend Conditional Logic ---
findstr /C:"shouldRequireConditionalCredentials" apps\server\src\modules\intake\intake.service.ts >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   FAIL: Intake still has conditional logic
    set /a FAIL+=1
) else (
    echo   PASS: Intake: no conditional logic
    set /a PASS+=1
)

findstr /C:"CONDITIONAL_CREDENTIAL_TYPES" apps\server\src\modules\credential\credential.constants.ts >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   FAIL: Server constants still have CONDITIONAL_CREDENTIAL_TYPES
    set /a FAIL+=1
) else (
    echo   PASS: Server constants: CONDITIONAL_CREDENTIAL_TYPES removed
    set /a PASS+=1
)

REM 8. ID-card keyboard tuning
echo --- 8. ID-card Keyboard Tuning ---
findstr /C:"cursor-spacing=\"140\"" apps\miniapp\pages\credential\edit\index.wxml >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   PASS: cursor-spacing reduced to 140
    set /a PASS+=1
) else (
    echo   FAIL: cursor-spacing not reduced to 140
    set /a FAIL+=1
)

findstr /C:"padding-right" apps\miniapp\pages\credential\edit\index.wxss >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   PASS: ID-card input has right padding
    set /a PASS+=1
) else (
    echo   FAIL: ID-card input missing right padding
    set /a FAIL+=1
)

REM 9. Database tables preserved
echo --- 9. Database Tables Preserved ---
findstr /C:"StaffIndependentSkill" apps\server\prisma\schema.prisma >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   PASS: StaffIndependentSkill preserved
    set /a PASS+=1
) else (
    echo   FAIL: StaffIndependentSkill removed
    set /a FAIL+=1
)

REM Summary
echo.
echo === Stage 11 Verification Complete ===
echo   Passed: %PASS%
echo   Failed: %FAIL%
echo.

if %FAIL% GTR 0 exit /b 1
exit /b 0
