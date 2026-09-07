@echo off
title MitraScan AI Launcher
echo ========================================================
echo        Starting MitraScan AI (Backend + Frontend)
echo ========================================================
echo.
echo Backend running on:  http://localhost:5000
echo Frontend running on: http://localhost:5173
echo.
echo Press Ctrl+C anytime to stop both servers.
echo ========================================================
echo.

node run-dev.js
pause
