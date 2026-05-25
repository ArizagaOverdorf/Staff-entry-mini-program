@echo off
cd /d "%~dp0apps\server"
node prisma\seed-demo-staff.js
echo.
echo Demo staff seed finished. Press any key to close this window.
pause >nul
