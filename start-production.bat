@echo off
REM 🚴‍♂️ Rabbi E-Bike Management System - Production Start Script for Windows
REM Questo script avvia l'applicazione in modalità produzione su Windows

setlocal enabledelayedexpansion

echo 🚴‍♂️ Starting Rabbi E-Bike Management System in Production Mode
echo ================================================================

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js version 16 or higher.
    pause
    exit /b 1
)

echo [INFO] Node.js detected ✓

REM Check if npm is installed
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo [INFO] npm detected ✓

REM Install frontend dependencies if needed
echo [STEP] Checking frontend dependencies...
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install frontend dependencies!
        pause
        exit /b 1
    )
) else (
    echo [INFO] Frontend dependencies already installed ✓
)

REM Build frontend for production
echo [STEP] Building frontend for production...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b 1
)

echo [INFO] Frontend built successfully ✓

REM Install server dependencies if needed
echo [STEP] Checking server dependencies...
cd server

if not exist "node_modules" (
    echo [INFO] Installing server dependencies...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install server dependencies!
        pause
        exit /b 1
    )
) else (
    echo [INFO] Server dependencies already installed ✓
)

REM Create directories if they don't exist
if not exist "backups" (
    mkdir backups
    echo [INFO] Created backups directory ✓
)

if not exist "logs" (
    mkdir logs
    echo [INFO] Created logs directory ✓
)

if not exist "rabbi_ebike.db" (
    echo [INFO] Database will be created on first startup ✓
) else (
    echo [INFO] Database found ✓
)

cd ..

echo [INFO] All checks completed successfully!
echo.
echo ================================================================
echo 🚀 STARTING RABBI E-BIKE MANAGEMENT SYSTEM
echo ================================================================
echo.
echo [INFO] Server will start on: http://localhost:3001
echo [INFO] Frontend will be served from: http://localhost:8080
echo [INFO] Access the app at: http://localhost:8080
echo.
echo [INFO] Features enabled:
echo   ✓ Automatic backups (every 24 hours)
echo   ✓ Database optimization (nightly at 3:00 AM)
echo   ✓ Performance monitoring
echo   ✓ Error logging
echo.
echo [WARNING] To stop the system, close this window or press Ctrl+C
echo.

REM Start server
echo [STEP] Starting backend server...
cd server
start /b cmd /c "npm start"
cd ..

REM Wait for server to start
timeout /t 3 /nobreak >nul

echo [INFO] Backend server started ✓

REM Start frontend production server
echo [STEP] Starting frontend server...
start /b cmd /c "npm run preview"

REM Wait for frontend to start
timeout /t 3 /nobreak >nul

echo [INFO] Frontend server started ✓

echo.
echo ================================================================
echo 🎉 SYSTEM READY!
echo ================================================================
echo.
echo 📱 Access your Rabbi E-Bike Management System at:
echo    http://localhost:8080
echo.
echo 🔧 Server API is running at:
echo    http://localhost:3001
echo.
echo 💾 Backups are automatically saved to:
echo    .\server\backups\
echo.
echo Press any key to open the application in your browser...
pause >nul

REM Open browser
start http://localhost:8080

echo.
echo The system is now running in the background.
echo To stop the system, close this window.
echo.
pause