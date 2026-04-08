@echo off
title HealTrip ML Services

echo ================================================
echo   HealTrip ML Services Launcher
echo ================================================
echo.

:: Kill any processes already on these ports to avoid EADDRINUSE
echo Clearing ports 8000, 8001, 8002...

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8000 "') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8001 "') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8002 "') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo Ports cleared. Starting services...
echo.

:: Hotels ML (port 8000)
start "Hotels ML :8000" cmd /k "cd /d %~dp0backend\ml\hotels && python main.py"
timeout /t 2 /nobreak > nul

:: Hospitals ML (port 8001)
start "Hospitals ML :8001" cmd /k "cd /d %~dp0backend\ml\hospitals && python main.py"
timeout /t 2 /nobreak > nul

:: Flights ML (port 8002)
start "Flights ML :8002" cmd /k "cd /d %~dp0backend\ml\flights && python main.py"

echo.
echo ================================================
echo   All 3 ML services started in new windows!
echo.
echo   Hotels:    http://localhost:8000
echo   Hospitals: http://localhost:8001
echo   Flights:   http://localhost:8002
echo ================================================
echo.
echo NOTE: Wait ~5 seconds for "Application startup complete"
echo       Then refresh your HealTrip app.
echo.
pause
