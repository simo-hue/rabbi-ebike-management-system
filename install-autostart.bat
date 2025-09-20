@echo off
setlocal enabledelayedexpansion

REM =========================================================================
REM 🚴‍♂️ Rabbi E-Bike Management System - Installazione Autostart Windows
REM =========================================================================
REM Questo script configura l'avvio automatico di Rabbi E-Bike all'avvio di Windows
REM =========================================================================

echo.
echo =========================================================================
echo 🚴‍♂️ RABBI E-BIKE MANAGEMENT SYSTEM - CONFIGURAZIONE AUTOSTART
echo =========================================================================
echo.

REM Verifica diritti amministratore
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Questo script richiede privilegi di amministratore.
    echo [INFO] Clicca con il tasto destro e seleziona "Esegui come amministratore"
    echo.
    pause
    exit /b 1
)

echo [INFO] Privilegi amministratore confermati ✓
echo.

REM Importa configurazione
if not exist "%~dp0autostart-config.bat" (
    echo [ERROR] File di configurazione non trovato: autostart-config.bat
    echo [INFO] Assicurati che tutti i file siano nella stessa cartella
    pause
    exit /b 1
)

call "%~dp0autostart-config.bat"
if %errorlevel% neq 0 (
    echo [ERROR] Errore nel caricamento della configurazione
    pause
    exit /b 1
)

echo [INFO] Configurazione caricata ✓
echo [INFO] Percorso progetto: %PROJECT_PATH%
echo.

REM Menu principale
:main_menu
echo =========================================================================
echo SCEGLI UN'OPZIONE:
echo =========================================================================
echo.
echo [1] Installa Autostart (avvio automatico all'accensione PC)
echo [2] Disinstalla Autostart
echo [3] Verifica stato Autostart
echo [4] Test manuale script autostart
echo [5] Esci
echo.
set /p choice="Inserisci la tua scelta (1-5): "

if "%choice%"=="1" goto install_autostart
if "%choice%"=="2" goto uninstall_autostart
if "%choice%"=="3" goto check_status
if "%choice%"=="4" goto test_script
if "%choice%"=="5" goto exit_script

echo [WARNING] Scelta non valida. Riprova.
echo.
goto main_menu

REM =========================================================================
REM INSTALLAZIONE AUTOSTART
REM =========================================================================
:install_autostart
echo.
echo [STEP] Installazione Autostart in corso...
echo.

REM Crea chiave di registro per autostart
set SCRIPT_PATH=%~dp0rabbi-autostart.bat
set REG_KEY=HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
set REG_VALUE=RabbiEBikeAutostart

echo [INFO] Registrazione nel registro di Windows...
reg add "%REG_KEY%" /v "%REG_VALUE%" /t REG_SZ /d "\"%SCRIPT_PATH%\"" /f >nul 2>&1

if %errorlevel% neq 0 (
    echo [ERROR] Errore nella registrazione del registro di Windows
    pause
    goto main_menu
)

REM Verifica registrazione
reg query "%REG_KEY%" /v "%REG_VALUE%" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Verifica fallita - autostart non registrato
    pause
    goto main_menu
)

echo [SUCCESS] Autostart installato con successo! ✓
echo.
echo [INFO] Dettagli installazione:
echo   • Script: %SCRIPT_PATH%
echo   • Registro: %REG_KEY%\%REG_VALUE%
echo   • L'applicazione si avvierà automaticamente al prossimo riavvio
echo.
echo [WARNING] IMPORTANTE:
echo   • NON spostare o rinominare la cartella del progetto
echo   • Se sposti il progetto, disinstalla e reinstalla l'autostart
echo   • I log di avvio saranno salvati in: %LOG_PATH%\autostart.log
echo.

pause
goto main_menu

REM =========================================================================
REM DISINSTALLAZIONE AUTOSTART
REM =========================================================================
:uninstall_autostart
echo.
echo [STEP] Disinstallazione Autostart in corso...
echo.

set REG_KEY=HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
set REG_VALUE=RabbiEBikeAutostart

REM Rimuovi dalla registry
echo [INFO] Rimozione dal registro di Windows...
reg delete "%REG_KEY%" /v "%REG_VALUE%" /f >nul 2>&1

if %errorlevel% neq 0 (
    echo [WARNING] Voce di registro non trovata (potrebbe essere già rimossa)
) else (
    echo [SUCCESS] Autostart disinstallato con successo! ✓
)

echo.
echo [INFO] L'applicazione non si avvierà più automaticamente al riavvio
echo [INFO] Per avviarla manualmente usa start-production.bat
echo.

pause
goto main_menu

REM =========================================================================
REM VERIFICA STATO
REM =========================================================================
:check_status
echo.
echo [STEP] Verifica stato Autostart...
echo.

set REG_KEY=HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
set REG_VALUE=RabbiEBikeAutostart

reg query "%REG_KEY%" /v "%REG_VALUE%" >nul 2>&1
if %errorlevel% equ 0 (
    echo [STATUS] ✓ AUTOSTART ATTIVO
    echo.
    echo [INFO] Dettagli:
    for /f "tokens=3*" %%a in ('reg query "%REG_KEY%" /v "%REG_VALUE%" 2^>nul ^| find "%REG_VALUE%"') do (
        echo   • Script registrato: %%b
    )
    echo   • L'applicazione si avvia automaticamente all'accensione del PC

    REM Verifica esistenza file script
    set SCRIPT_PATH=%~dp0rabbi-autostart.bat
    if exist "!SCRIPT_PATH!" (
        echo   • File script: TROVATO ✓
    ) else (
        echo   • File script: NON TROVATO ❌
        echo [WARNING] Il file script è stato spostato o eliminato!
    )

) else (
    echo [STATUS] ❌ AUTOSTART NON ATTIVO
    echo.
    echo [INFO] L'applicazione NON si avvia automaticamente
    echo [INFO] Usa l'opzione 1 per installare l'autostart
)

echo.
pause
goto main_menu

REM =========================================================================
REM TEST SCRIPT
REM =========================================================================
:test_script
echo.
echo [STEP] Avvio test manuale dello script autostart...
echo.
echo [WARNING] Questo test avvierà l'applicazione.
echo [WARNING] Se l'applicazione è già in esecuzione, potrebbero verificarsi conflitti.
echo.
set /p confirm="Continuare con il test? (s/n): "
if /i not "%confirm%"=="s" (
    echo [INFO] Test annullato
    echo.
    goto main_menu
)

echo.
echo [INFO] Avvio script autostart in modalità test...
echo [INFO] Controlla i log in: %LOG_PATH%\autostart.log
echo.

REM Avvia script in una nuova finestra per vedere l'output
start cmd /k ""%~dp0rabbi-autostart.bat""

echo [INFO] Script avviato in una nuova finestra
echo [INFO] Torna al menu quando hai finito il test
echo.

pause
goto main_menu

REM =========================================================================
REM USCITA
REM =========================================================================
:exit_script
echo.
echo [INFO] Configurazione autostart completata
echo [INFO] Grazie per aver usato Rabbi E-Bike Management System!
echo.
pause
exit /b 0