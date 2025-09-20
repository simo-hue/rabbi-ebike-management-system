@echo off
setlocal enabledelayedexpansion

REM =========================================================================
REM 🚴‍♂️ Rabbi E-Bike Management System - Autostart Script Windows
REM =========================================================================
REM Questo script avvia automaticamente l'applicazione all'avvio di Windows
REM =========================================================================

REM Importa configurazione
call "%~dp0autostart-config.bat"
if %errorlevel% neq 0 (
    echo [FATAL] Errore nel caricamento della configurazione
    exit /b 1
)

REM Crea directory log se non esiste
if not exist "%LOG_PATH%" mkdir "%LOG_PATH%"

REM Inizia logging
echo ========================================= >> "%STARTUP_LOG%"
echo [%date% %time%] AUTOSTART INITIATED >> "%STARTUP_LOG%"
echo ========================================= >> "%STARTUP_LOG%"

REM Funzione di log
call :log "INFO" "Starting Rabbi E-Bike Management System autostart"

REM Attendi che Windows sia completamente avviato
call :log "INFO" "Waiting %STARTUP_DELAY% seconds for Windows to fully boot..."
timeout /t %STARTUP_DELAY% /nobreak >nul

REM Verifica Node.js
call :log "INFO" "Checking Node.js installation..."
where node >nul 2>&1
if %errorlevel% neq 0 (
    call :log "ERROR" "Node.js not found in PATH"
    call :show_error "Node.js non trovato" "Installa Node.js versione 16+ e riavvia il computer"
    exit /b 1
)

REM Verifica npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    call :log "ERROR" "npm not found in PATH"
    call :show_error "npm non trovato" "Verifica l'installazione di Node.js"
    exit /b 1
)

call :log "INFO" "Node.js and npm detected successfully"

REM Cambia directory al progetto
cd /d "%PROJECT_PATH%"
if %errorlevel% neq 0 (
    call :log "ERROR" "Cannot access project directory: %PROJECT_PATH%"
    call :show_error "Directory non accessibile" "Verifica il percorso in autostart-config.bat"
    exit /b 1
)

call :log "INFO" "Changed to project directory: %PROJECT_PATH%"

REM Controlla se le dipendenze sono installate
call :log "INFO" "Checking frontend dependencies..."
if not exist "node_modules" (
    call :log "INFO" "Installing frontend dependencies..."
    call npm install >> "%STARTUP_LOG%" 2>&1
    if !errorlevel! neq 0 (
        call :log "ERROR" "Failed to install frontend dependencies"
        call :show_error "Errore installazione dipendenze frontend" "Controlla la connessione internet"
        exit /b 1
    )
)

call :log "INFO" "Checking server dependencies..."
cd /d "%SERVER_PATH%"
if not exist "node_modules" (
    call :log "INFO" "Installing server dependencies..."
    call npm install >> "%STARTUP_LOG%" 2>&1
    if !errorlevel! neq 0 (
        call :log "ERROR" "Failed to install server dependencies"
        call :show_error "Errore installazione dipendenze server" "Controlla la connessione internet"
        exit /b 1
    )
)

REM Crea directory necessarie
if not exist "backups" mkdir "backups"
if not exist "logs" mkdir "logs"

REM Torna alla directory principale
cd /d "%PROJECT_PATH%"

REM Build frontend per produzione (solo se non esiste già)
call :log "INFO" "Checking frontend build..."
if not exist "dist" (
    call :log "INFO" "Building frontend for production..."
    call npm run build >> "%STARTUP_LOG%" 2>&1
    if !errorlevel! neq 0 (
        call :log "ERROR" "Frontend build failed"
        call :show_error "Errore build frontend" "Controlla i log per dettagli"
        exit /b 1
    )
    call :log "INFO" "Frontend build completed successfully"
) else (
    call :log "INFO" "Frontend build already exists"
)

REM Avvia il server backend
call :log "INFO" "Starting backend server..."
cd /d "%SERVER_PATH%"

start /min cmd /c "title Rabbi E-Bike Backend & npm start >> "%STARTUP_LOG%" 2>&1"

REM Attendi che il server si avvii
call :log "INFO" "Waiting %SERVER_WAIT% seconds for server to start..."
timeout /t %SERVER_WAIT% /nobreak >nul

REM Verifica che il server sia avviato
call :check_server_health
if %errorlevel% neq 0 (
    call :log "ERROR" "Server failed to start or health check failed"
    call :show_error "Server non avviato" "Controlla i log del server"
    exit /b 1
)

call :log "INFO" "Backend server started successfully"

REM Torna alla directory principale per il frontend
cd /d "%PROJECT_PATH%"

REM Avvia il frontend
call :log "INFO" "Starting frontend server..."
start /min cmd /c "title Rabbi E-Bike Frontend & npm run preview >> "%STARTUP_LOG%" 2>&1"

REM Attendi che il frontend si avvii
call :log "INFO" "Waiting %FRONTEND_WAIT% seconds for frontend to start..."
timeout /t %FRONTEND_WAIT% /nobreak >nul

REM Verifica che il frontend sia avviato
call :check_frontend_health
if %errorlevel% neq 0 (
    call :log "WARNING" "Frontend health check failed, but continuing..."
)

call :log "INFO" "Frontend server started successfully"

REM Attendi un momento aggiuntivo per stabilizzazione
timeout /t 5 /nobreak >nul

REM Sistema avviato con successo
call :log "SUCCESS" "Rabbi E-Bike Management System started successfully!"
call :log "INFO" "Frontend: http://localhost:%FRONTEND_PORT%"
call :log "INFO" "Backend API: http://localhost:%SERVER_PORT%"

REM Mostra notifica di successo (opzionale, rimuovi se troppo invasiva)
call :show_success "Rabbi E-Bike Avviato!" "Sistema pronto su http://localhost:%FRONTEND_PORT%"

REM Termina script (i servizi continuano in background)
call :log "INFO" "Autostart script completed. Services running in background."
exit /b 0

REM =========================================================================
REM FUNZIONI HELPER
REM =========================================================================

:log
set level=%~1
set message=%~2
echo [%date% %time%] [%level%] %message% >> "%STARTUP_LOG%"
goto :eof

:show_error
set title=%~1
set message=%~2
echo [ERROR] %title%: %message%
REM Rimuovi la riga sotto se non vuoi popup di errore
msg "%USERNAME%" "%title%: %message%"
goto :eof

:show_success
set title=%~1
set message=%~2
echo [SUCCESS] %title%: %message%
REM Rimuovi la riga sotto se non vuoi popup di successo
msg "%USERNAME%" "%title%: %message%"
goto :eof

:check_server_health
REM Verifica semplice che il server risponda
timeout /t 2 /nobreak >nul
powershell -command "try { $response = Invoke-WebRequest -Uri 'http://localhost:%SERVER_PORT%/api/health' -TimeoutSec 5; exit 0 } catch { exit 1 }" >nul 2>&1
goto :eof

:check_frontend_health
REM Verifica semplice che il frontend risponda
timeout /t 2 /nobreak >nul
powershell -command "try { $response = Invoke-WebRequest -Uri 'http://localhost:%FRONTEND_PORT%' -TimeoutSec 5; exit 0 } catch { exit 1 }" >nul 2>&1
goto :eof