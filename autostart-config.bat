@echo off
REM =========================================================================
REM 🚴‍♂️ Rabbi E-Bike Management System - Configurazione Autostart Windows
REM =========================================================================
REM
REM IMPORTANTE: Modifica solo la variabile PROJECT_PATH qui sotto!
REM

REM ==================== CONFIGURAZIONE UTENTE ====================
REM
REM Sostituisci questo percorso con la posizione del tuo progetto:
REM Esempio: SET PROJECT_PATH=C:\Users\TuoNome\Desktop\rabbi-ebike-management-system
REM Esempio: SET PROJECT_PATH=D:\Progetti\rabbi-ebike-management-system
REM
SET PROJECT_PATH=C:\Users\%USERNAME%\Downloads\rabbi-ebike-management-system

REM ==================== NON MODIFICARE SOTTO ====================
REM (Configurazione automatica - non toccare)

REM Percorsi automatici
SET SERVER_PATH=%PROJECT_PATH%\server
SET FRONTEND_PATH=%PROJECT_PATH%
SET LOG_PATH=%PROJECT_PATH%\logs
SET STARTUP_LOG=%LOG_PATH%\autostart.log

REM Configurazione porte
SET SERVER_PORT=3001
SET FRONTEND_PORT=8080

REM Tempo di attesa per avvio servizi (secondi)
SET STARTUP_DELAY=30
SET SERVER_WAIT=10
SET FRONTEND_WAIT=5

REM Configurazione finestre
SET WINDOW_STYLE=minimized
SET SHOW_CONSOLE=false

REM Verifica configurazione
if not exist "%PROJECT_PATH%" (
    echo [ERROR] Il percorso del progetto non esiste: %PROJECT_PATH%
    echo [INFO] Modifica la variabile PROJECT_PATH in questo file
    pause
    exit /b 1
)

if not exist "%SERVER_PATH%" (
    echo [ERROR] La cartella server non esiste: %SERVER_PATH%
    echo [INFO] Verifica che il percorso del progetto sia corretto
    pause
    exit /b 1
)

echo [INFO] Configurazione validata con successo
echo [INFO] Progetto: %PROJECT_PATH%
echo [INFO] Server: %SERVER_PATH%
echo [INFO] Frontend: %FRONTEND_PATH%
echo [INFO] Log: %LOG_PATH%