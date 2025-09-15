# 🪟 Guida Completa Windows - Rabbi E-Bike

## 📚 Indice
- [Windows Desktop (Uso Personale)](#-windows-desktop-uso-personale)
- [Windows Server (Produzione)](#-windows-server-produzione)
- [Windows con Docker](#-windows-con-docker)
- [Configurazione IIS](#-configurazione-iis)
- [Servizi Windows](#-servizi-windows)
- [PowerShell Scripts](#-powershell-scripts)
- [Troubleshooting Windows](#-troubleshooting-windows)

---

## 🏪 Windows Desktop (Computer Negozio)

### **Windows 10/11 - Installazione Completa**

#### **Passo 1: Prerequisiti Windows**

**Abilitare WSL2 (Raccomandato per sviluppatori):**
```powershell
# Esegui PowerShell come Amministratore
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform

# Riavvia il computer
# Installa Ubuntu dal Microsoft Store
```

**Installazione Node.js su Windows:**
```powershell
# Opzione 1: Download diretto
# Vai su https://nodejs.org/
# Scarica "Windows Installer (.msi)" LTS
# Esegui installer (spunta "Add to PATH")

# Opzione 2: Con Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
choco install nodejs

# Opzione 3: Con Winget
winget install OpenJS.NodeJS

# Verifica installazione
node --version
npm --version
```

#### **Passo 2: Installazione Git per Windows**
```powershell
# Download da https://git-scm.com/download/win
# Oppure con package manager
choco install git
# OR
winget install Git.Git

# Configura Git
git config --global user.name "Il Tuo Nome"
git config --global user.email "tua@email.com"
```

#### **Passo 3: Setup Progetto**
```cmd
# Apri Command Prompt (cmd) o PowerShell
# Vai sul Desktop
cd %USERPROFILE%\Desktop

# Clone repository
git clone https://github.com/simo-hue/rabbi-ebike-management-system.git rabbieebike
cd rabbieebike

# Install dependencies
npm install
cd server
npm install
cd ..
```

#### **Passo 4: Installazione per Uso Permanente Negozio**

**Setup PM2 per Gestione Professionale:**
```cmd
REM Installa PM2 globalmente per gestione servizi
npm install -g pm2
npm install -g pm2-windows-startup

REM Crea configurazione permanente
cd %USERPROFILE%\Desktop\rabbieebike
echo module.exports = { > ecosystem.config.js
echo   apps: [{ >> ecosystem.config.js
echo     name: 'rabbi-ebike-server', >> ecosystem.config.js
echo     script: 'server.js', >> ecosystem.config.js
echo     cwd: './server', >> ecosystem.config.js
echo     instances: 1, >> ecosystem.config.js
echo     autorestart: true, >> ecosystem.config.js
echo     watch: false, >> ecosystem.config.js
echo     max_memory_restart: '500M', >> ecosystem.config.js
echo     env: { NODE_ENV: 'production', PORT: 3001 } >> ecosystem.config.js
echo   }] >> ecosystem.config.js
echo } >> ecosystem.config.js

REM Avvia con PM2
pm2 start ecosystem.config.js
pm2 save

REM Configura avvio automatico con Windows
pm2-startup install
```

#### **Passo 5: Script per Gestione Quotidiana Negozio**

**Crea `start-negozio.bat` (Avvio giornaliero):**
```batch
@echo off
title Rabbi E-Bike - Negozio
color 0A
echo.
echo 🚴‍♂️ BENVENUTO IN RABBI E-BIKE MANAGEMENT
echo =====================================
echo.

cd /d "%~dp0"

REM Controlla se PM2 è installato
pm2 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installando PM2 per la prima volta...
    npm install -g pm2
    npm install -g pm2-windows-startup
)

REM Verifica stato servizi
echo 🔍 Verificando stato sistema...
pm2 describe rabbi-ebike-server >nul 2>&1
if %errorlevel% neq 0 (
    echo 🚀 Prima configurazione - avvio servizi...
    pm2 start ecosystem.config.js
    pm2 save
    pm2-startup install
) else (
    echo 🔄 Sistema già configurato - verifica servizi...
    pm2 restart rabbi-ebike-server
)

echo.
echo ✅ RABBI E-BIKE PRONTO PER IL NEGOZIO!
echo.
echo 💻 Computer negozio: http://localhost:8080
echo 📱 Tablet/smartphone: http://%COMPUTERNAME%.local:8080
echo.
echo 📊 Monitora: pm2 status
echo 📋 Log: pm2 logs
echo.

REM Apri automaticamente il browser
timeout /t 3 >nul
start http://localhost:8080

echo Premi un tasto per chiudere (il sistema continuerà a funzionare)
pause >nul
```

**Crea `gestione-negozio.bat` (Menu di controllo):**
```batch
@echo off
title Rabbi E-Bike - Gestione Negozio
color 0E

:menu
cls
echo.
echo 🚴‍♂️ RABBI E-BIKE - GESTIONE NEGOZIO
echo =====================================
echo.
echo 1. ✅ Avvia sistema
echo 2. 🛑 Ferma sistema  
echo 3. 🔄 Riavvia sistema
echo 4. 📊 Stato servizi
echo 5. 📋 Visualizza log
echo 6. 💾 Backup manuale
echo 7. 🌐 Apri nel browser
echo 8. ❌ Esci
echo.
set /p choice="Scegli opzione (1-8): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop  
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto backup
if "%choice%"=="7" goto browser
if "%choice%"=="8" goto exit
goto menu

:start
echo 🚀 Avviando Rabbi E-Bike...
pm2 start ecosystem.config.js
pm2 save
goto menu

:stop
echo 🛑 Fermando Rabbi E-Bike...
pm2 stop all
goto menu

:restart
echo 🔄 Riavviando Rabbi E-Bike...
pm2 restart all
goto menu

:status
echo 📊 Stato servizi:
pm2 status
pause
goto menu

:logs
echo 📋 Log sistema:
pm2 logs --lines 20
pause
goto menu

:backup
echo 💾 Creando backup...
if not exist "backups" mkdir backups
copy "server\rabbi_ebike.db" "backups\backup_%date:~6,4%%date:~3,2%%date:~0,2%.db"
echo ✅ Backup completato!
pause
goto menu

:browser
start http://localhost:8080
goto menu

:exit
exit
```

---

## 🖥️ Windows Server (Produzione)

### **Windows Server 2019/2022 Setup**

#### **Installazione Ambiente Server**

**1. Installa IIS (Internet Information Services):**
```powershell
# PowerShell come Amministratore
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpRedirect
Enable-WindowsOptionalFeature -Online -FeatureName IIS-StaticContent
Enable-WindowsOptionalFeature -Online -FeatureName IIS-DefaultDocument
Enable-WindowsOptionalFeature -Online -FeatureName IIS-DirectoryBrowsing
```

**2. Installa URL Rewrite Module:**
```powershell
# Download da Microsoft
# https://www.iis.net/downloads/microsoft/url-rewrite
# Oppure con Chocolatey
choco install urlrewrite
```

**3. Installa Node.js per produzione:**
```powershell
# Download Node.js LTS per Windows Server
# https://nodejs.org/en/download/
# Scegli "Windows Installer (.msi)" per x64

# Verifica installazione
node --version
npm --version

# Installa PM2 per gestione processi
npm install -g pm2
npm install -g pm2-windows-startup
npm install -g pm2-windows-service
```

#### **Deploy Applicazione su Windows Server**

**1. Setup Directory:**
```cmd
REM Crea directory applicazione
mkdir C:\inetpub\wwwroot\rabbieebike
cd C:\inetpub\wwwroot\rabbieebike

REM Clone repository
git clone https://github.com/simo-hue/rabbi-ebike-management-system.git .

REM Install dependencies
npm install --production
cd server
npm install --production
cd ..

REM Build frontend per produzione
npm run build
```

**2. Configurazione PM2 per Windows:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'rabbi-ebike-server',
    script: 'server.js',
    cwd: 'C:\\inetpub\\wwwroot\\rabbieebike\\server',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: 'C:\\Logs\\rabbi-ebike\\error.log',
    out_file: 'C:\\Logs\\rabbi-ebike\\out.log',
    log_file: 'C:\\Logs\\rabbi-ebike\\combined.log',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
```

**3. Setup PM2 come Servizio Windows:**
```cmd
REM Install PM2 service
pm2-service-install

REM Start applicazione
pm2 start ecosystem.config.js --env production
pm2 save

REM Setup startup
pm2-startup install
```

#### **Configurazione IIS come Reverse Proxy**

**1. Crea web.config:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <!-- Remove default handlers -->
    <handlers>
      <clear />
      <add name="iisnode" path="*" verb="*" modules="iisnode" />
    </handlers>
    
    <!-- URL Rewrite rules -->
    <rewrite>
      <rules>
        <!-- Static files (frontend) -->
        <rule name="StaticFiles" stopProcessing="true">
          <match url="^(.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot))$" />
          <action type="Rewrite" url="dist/{R:1}" />
        </rule>
        
        <!-- API requests to Node.js -->
        <rule name="ApiProxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:3001/api/{R:1}" />
        </rule>
        
        <!-- Frontend SPA routes -->
        <rule name="Frontend" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="dist/index.html" />
        </rule>
      </rules>
    </rewrite>
    
    <!-- Compression -->
    <urlCompression doDynamicCompression="true" doStaticCompression="true" />
    
    <!-- Static files caching -->
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
    </staticContent>
    
    <!-- Security headers -->
    <httpProtocol>
      <customHeaders>
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-Frame-Options" value="DENY" />
        <add name="X-XSS-Protection" value="1; mode=block" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

**2. Configurazione SSL Certificate:**
```powershell
# Genera self-signed certificate per test
New-SelfSignedCertificate -DnsName "yourdomain.com" -CertStoreLocation "cert:\LocalMachine\My"

# Bind certificate a IIS site
# Usa IIS Manager GUI oppure PowerShell:
Import-Module WebAdministration
New-WebBinding -Name "Default Web Site" -Protocol https -Port 443
```

---

## 🐳 Windows con Docker

### **Docker Desktop su Windows**

**1. Installazione Docker Desktop:**
```powershell
# Download Docker Desktop per Windows
# https://www.docker.com/products/docker-desktop

# Oppure con Chocolatey
choco install docker-desktop

# Verifica installazione
docker --version
docker-compose --version
```

**2. Dockerfile ottimizzato per Windows:**
```dockerfile
# Frontend Dockerfile (Windows)
FROM node:18-windowsservercore AS builder
WORKDIR C:/app
COPY package*.json ./
RUN npm install --frozen-lockfile
COPY . .
RUN npm run build

FROM mcr.microsoft.com/windows/servercore/iis
WORKDIR C:/inetpub/wwwroot
COPY --from=builder C:/app/dist .
```

```dockerfile
# Backend Dockerfile (Windows)
FROM node:18-windowsservercore
WORKDIR C:/app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

**3. Docker Compose per Windows:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend.windows
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - rabbi-network

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile.windows
    ports:
      - "3001:3001"
    volumes:
      - type: bind
        source: ./server/rabbi_ebike.db
        target: C:/app/rabbi_ebike.db
      - type: bind
        source: ./server/backups
        target: C:/app/backups
    environment:
      - NODE_ENV=production
      - PORT=3001
    networks:
      - rabbi-network
    restart: unless-stopped

networks:
  rabbi-network:
    driver: bridge
```

---

## 🔧 Configurazione IIS (Approfondimento)

### **Setup Completo IIS per Rabbi E-Bike**

**1. Installa iisnode:**
```powershell
# Download iisnode per Windows
# https://github.com/Azure/iisnode/releases

# Installa MSI package
```

**2. Configurazione Application Pool:**
```powershell
# Crea Application Pool dedicato
Import-Module WebAdministration
New-WebAppPool -Name "RabbiEBikePool" -Force
Set-ItemProperty -Path "IIS:\AppPools\RabbiEBikePool" -Name processModel.identityType -Value ApplicationPoolIdentity
Set-ItemProperty -Path "IIS:\AppPools\RabbiEBikePool" -Name recycling.periodicRestart.time -Value "00:00:00"
```

**3. Crea IIS Site:**
```powershell
# Crea sito IIS
New-Website -Name "RabbiEBike" -ApplicationPool "RabbiEBikePool" -PhysicalPath "C:\inetpub\wwwroot\rabbieebike" -Port 80
```

**4. Configurazione avanzata web.config:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <appSettings>
    <add key="NODE_ENV" value="production" />
  </appSettings>
  
  <system.webServer>
    <!-- iisnode configuration -->
    <iisnode 
      node_env="production"
      nodeProcessCountPerApplication="1"
      maxConcurrentRequestsPerProcess="1024"
      maxNamedPipeConnectionRetry="3"
      namedPipeConnectionRetryDelay="2000"
      maxNamedPipeConnectionPoolSize="512"
      maxNamedPipePooledConnectionAge="30000"
      asyncCompletionThreadCount="0"
      initialRequestBufferSize="4096"
      maxRequestBufferSize="65536"
      watchedFiles="*.js"
      uncFileChangesPollingInterval="5000"
      gracefulShutdownTimeout="60000"
      loggingEnabled="true"
      logDirectoryNameSuffix="logs"
      debuggingEnabled="false"
      debuggerPortRange="5058-6058"
      debuggerPathSegment="debug"
      maxLogFileSizeInKB="128"
      appendToExistingLog="false"
      logFileFlushInterval="5000"
      devErrorsEnabled="false"
      flushResponse="false"
      enableXFF="false"
      promoteServerVars="" />
    
    <defaultDocument>
      <files>
        <clear />
        <add value="index.html" />
      </files>
    </defaultDocument>
    
    <handlers>
      <add name="iisnode-api" path="api/*" verb="*" modules="iisnode" />
    </handlers>
    
    <rewrite>
      <rules>
        <!-- Don't interfere with node-inspector debugging -->
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        
        <!-- Static files -->
        <rule name="StaticContent" stopProcessing="true">
          <match url="^(css|js|images|fonts)/.*" />
          <action type="Rewrite" url="dist/{R:0}" />
        </rule>
        
        <!-- API routes to Node.js -->
        <rule name="DynamicContent" stopProcessing="false">
          <match url="^api/(.*)" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server/server.js"/>
        </rule>
        
        <!-- Everything else to index.html (SPA) -->
        <rule name="SPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="dist/index.html" />
        </rule>
      </rules>
    </rewrite>
    
    <!-- Compression -->
    <httpCompression directory="%SystemDrive%\inetpub\temp\IIS Temporary Compressed Files">
      <scheme name="gzip" dll="%Windir%\system32\inetsrv\gzip.dll" />
      <dynamicTypes>
        <add mimeType="text/*" enabled="true" />
        <add mimeType="message/*" enabled="true" />
        <add mimeType="application/javascript" enabled="true" />
        <add mimeType="application/json" enabled="true" />
      </dynamicTypes>
      <staticTypes>
        <add mimeType="text/*" enabled="true" />
        <add mimeType="message/*" enabled="true" />
        <add mimeType="application/javascript" enabled="true" />
        <add mimeType="application/json" enabled="true" />
      </staticTypes>
    </httpCompression>
    
    <urlCompression doStaticCompression="true" doDynamicCompression="true" />
  </system.webServer>
</configuration>
```

---

## 🔄 Servizi Windows

### **Creazione Servizio Windows Nativo**

**1. Usando node-windows:**
```javascript
// create-service.js
var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name: 'Rabbi E-Bike Server',
  description: 'Rabbi E-Bike Management System Backend Server',
  script: 'C:\\inetpub\\wwwroot\\rabbieebike\\server\\server.js',
  env: {
    name: 'NODE_ENV',
    value: 'production'
  }
});

// Listen for the "install" event, which indicates the process is available as a service.
svc.on('install', function() {
  console.log('✅ Servizio installato con successo!');
  svc.start();
});

svc.on('start', function() {
  console.log('✅ Servizio avviato!');
});

// Install the service
svc.install();
```

**2. Gestione Servizio:**
```cmd
REM Verifica servizio
sc query "Rabbi E-Bike Server"

REM Start servizio
sc start "Rabbi E-Bike Server"

REM Stop servizio
sc stop "Rabbi E-Bike Server"

REM Rimuovi servizio
sc delete "Rabbi E-Bike Server"
```

**3. Script PowerShell per gestione:**
```powershell
# manage-service.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$Action
)

$ServiceName = "Rabbi E-Bike Server"

switch ($Action.ToLower()) {
    "start" {
        Write-Host "🚀 Avviando $ServiceName..."
        Start-Service -Name $ServiceName
        Write-Host "✅ Servizio avviato!"
    }
    "stop" {
        Write-Host "🛑 Fermando $ServiceName..."
        Stop-Service -Name $ServiceName
        Write-Host "✅ Servizio fermato!"
    }
    "restart" {
        Write-Host "🔄 Riavviando $ServiceName..."
        Restart-Service -Name $ServiceName
        Write-Host "✅ Servizio riavviato!"
    }
    "status" {
        Get-Service -Name $ServiceName | Format-Table -AutoSize
    }
    default {
        Write-Host "Azioni disponibili: start, stop, restart, status"
    }
}
```

---

## 📜 PowerShell Scripts

### **Script di Automazione Completi**

**1. Deploy Automatico:**
```powershell
# deploy-rabbi-ebike.ps1
param(
    [string]$InstallPath = "C:\inetpub\wwwroot\rabbieebike",
    [string]$Environment = "production"
)

Write-Host "🚴‍♂️ Deploy Rabbi E-Bike su Windows Server" -ForegroundColor Green

# Controlla prerequisiti
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js non trovato! Installare da https://nodejs.org/"
    exit 1
}

if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git non trovato! Installare Git per Windows"
    exit 1
}

# Crea directory se non esiste
if (!(Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force
    Write-Host "📁 Creata directory $InstallPath" -ForegroundColor Yellow
}

# Clone repository
Set-Location $InstallPath
if (Test-Path ".git") {
    Write-Host "📡 Aggiornando repository esistente..." -ForegroundColor Yellow
    git pull origin main
} else {
    Write-Host "📡 Clonando repository..." -ForegroundColor Yellow
    git clone https://github.com/simo-hue/rabbi-ebike-management-system.git .
}

# Install dependencies
Write-Host "📦 Installando dipendenze frontend..." -ForegroundColor Yellow
npm install --production

Write-Host "📦 Installando dipendenze server..." -ForegroundColor Yellow
Set-Location "server"
npm install --production
Set-Location ".."

# Build frontend
Write-Host "🏗️ Building frontend..." -ForegroundColor Yellow
npm run build

# Setup PM2 se non esiste
if (!(Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installando PM2..." -ForegroundColor Yellow
    npm install -g pm2
    npm install -g pm2-windows-startup
}

# Crea ecosystem config
$EcosystemConfig = @"
module.exports = {
  apps: [{
    name: 'rabbi-ebike-server',
    script: 'server.js',
    cwd: '$InstallPath\\server',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: '$Environment',
      PORT: 3001
    }
  }]
}
"@

$EcosystemConfig | Out-File -FilePath "ecosystem.config.js" -Encoding utf8

# Start con PM2
Write-Host "🚀 Avviando server con PM2..." -ForegroundColor Yellow
pm2 start ecosystem.config.js --env $Environment
pm2 save

Write-Host "✅ Deploy completato!" -ForegroundColor Green
Write-Host "🌍 Server disponibile su http://localhost:3001" -ForegroundColor Cyan
Write-Host "📊 Controlla PM2: pm2 status" -ForegroundColor Cyan
```

**2. Backup Script:**
```powershell
# backup-rabbi-ebike.ps1
param(
    [string]$DatabasePath = "C:\inetpub\wwwroot\rabbieebike\server\rabbi_ebike.db",
    [string]$BackupPath = "C:\Backups\RabbiEBike",
    [int]$RetentionDays = 30
)

$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupPath\backup_$Date.db"

# Crea directory backup
if (!(Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force
}

# Backup database
Write-Host "📦 Creando backup: $BackupFile" -ForegroundColor Yellow
Copy-Item $DatabasePath $BackupFile

# Cleanup vecchi backup
Write-Host "🧹 Pulizia backup vecchi (>${RetentionDays} giorni)..." -ForegroundColor Yellow
Get-ChildItem -Path $BackupPath -Name "backup_*.db" | 
    Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-$RetentionDays) } |
    Remove-Item -Force

Write-Host "✅ Backup completato!" -ForegroundColor Green

# Opzionale: Upload a Azure Blob Storage
if ($env:AZURE_STORAGE_CONNECTION_STRING) {
    Write-Host "☁️ Upload backup ad Azure..." -ForegroundColor Blue
    az storage blob upload --file $BackupFile --name "backup_$Date.db" --container-name "rabbieebike-backups"
}
```

**3. Monitoraggio Health Check:**
```powershell
# health-check.ps1
param(
    [string]$ApiUrl = "http://localhost:3001/api/health",
    [string]$SlackWebhook = $null
)

try {
    $Response = Invoke-RestMethod -Uri $ApiUrl -TimeoutSec 10
    
    if ($Response.status -eq "OK") {
        Write-Host "✅ API Health Check OK" -ForegroundColor Green
        exit 0
    } else {
        throw "API returned: $($Response.status)"
    }
} catch {
    Write-Host "❌ API Health Check FAILED: $($_.Exception.Message)" -ForegroundColor Red
    
    # Send alert to Slack
    if ($SlackWebhook) {
        $Body = @{
            text = "🚨 Rabbi E-Bike API Down! Error: $($_.Exception.Message)"
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri $SlackWebhook -Method Post -Body $Body -ContentType "application/json"
    }
    
    # Restart PM2 process
    Write-Host "🔄 Tentativo restart servizio..." -ForegroundColor Yellow
    pm2 restart rabbi-ebike-server
    
    exit 1
}
```

---

## 🚨 Troubleshooting Windows

### **Problemi Comuni e Soluzioni**

#### **❌ "npm non è riconosciuto"**
```cmd
REM Verifica PATH
echo %PATH%

REM Aggiungi Node.js al PATH
setx PATH "%PATH%;C:\Program Files\nodejs"

REM Riapri CMD/PowerShell
```

#### **❌ Errori di permessi**
```powershell
# Esegui PowerShell come Amministratore
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Cambia ownership cartella
takeown /f "C:\inetpub\wwwroot\rabbieebike" /r /d y
icacls "C:\inetpub\wwwroot\rabbieebike" /grant Users:(F) /t
```

#### **❌ Porta 3001 occupata**
```cmd
REM Trova processo che usa porta 3001
netstat -ano | findstr :3001

REM Termina processo
taskkill /PID [PID_NUMBER] /F
```

#### **❌ IIS non serve file statici**
```powershell
# Abilita static content in IIS
Enable-WindowsOptionalFeature -Online -FeatureName IIS-StaticContent
Enable-WindowsOptionalFeature -Online -FeatureName IIS-DefaultDocument

# Restart IIS
iisreset
```

#### **❌ Database locked errors**
```cmd
REM Ferma tutti i processi Node
taskkill /f /im node.exe

REM Verifica che il file non sia in uso
handle.exe rabbi_ebike.db

REM Riavvia servizio
pm2 restart rabbi-ebike-server
```

#### **❌ PM2 non funziona come servizio**
```cmd
REM Disinstalla e reinstalla PM2 service
pm2-service-uninstall
pm2 kill
npm uninstall -g pm2-windows-service
npm install -g pm2-windows-service
pm2-service-install
pm2 resurrect
```

### **Log e Diagnostica**

```powershell
# Event Viewer logs
Get-WinEvent -LogName Application | Where-Object { $_.ProviderName -like "*Node*" } | Select-Object -First 10

# PM2 logs
pm2 logs rabbi-ebike-server --lines 50

# IIS logs
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\*.log" | Select-Object -Last 20

# Sistema performance
Get-Counter "\Process(node)\% Processor Time"
Get-Counter "\Process(node)\Working Set"
```

### **Performance Tuning Windows**

```powershell
# Ottimizzazione TCP/IP
netsh int tcp set global autotuninglevel=normal
netsh int tcp set global chimney=enabled
netsh int tcp set global rss=enabled

# IIS Performance
Import-Module WebAdministration
Set-ItemProperty -Path "IIS:\AppPools\RabbiEBikePool" -Name recycling.periodicRestart.memory -Value 512000
Set-ItemProperty -Path "IIS:\AppPools\RabbiEBikePool" -Name processModel.maxProcesses -Value 2
```

---

## 🎯 Checklist Deployment Windows

### ✅ **Prerequisiti Sistema:**
- [ ] Windows 10/11 (Desktop) o Windows Server 2019+ (Produzione)
- [ ] Node.js LTS installato e in PATH
- [ ] Git per Windows installato
- [ ] PowerShell ExecutionPolicy configurato
- [ ] Account Administrator per installazione servizi

### ✅ **Installazione Base:**
- [ ] Repository clonato correttamente
- [ ] Dipendenze frontend installate (`npm install`)
- [ ] Dipendenze server installate (`cd server && npm install`)
- [ ] Build frontend completata (`npm run build`)
- [ ] Test server funzionante (`npm start` nella cartella server)

### ✅ **Produzione Windows Server:**
- [ ] IIS installato e configurato
- [ ] PM2 installato globalmente
- [ ] Servizio Windows creato
- [ ] SSL certificate configurato
- [ ] Firewall Windows configurato
- [ ] Backup automatici schedulati

### ✅ **Verifica Funzionamento:**
- [ ] API health check risponde (`http://localhost:3001/api/health`)
- [ ] Frontend accessibile (`http://localhost:8080`)
- [ ] Database viene creato automaticamente
- [ ] PM2 status mostra processo attivo
- [ ] Log files vengono generati correttamente

---

**🎉 Ora hai una guida completa per ogni scenario Windows!**

**Per supporto specifico Windows:** Apri issue su GitHub con tag `windows` e includi versione Windows, log errori, e output `pm2 status`.

**Made with ❤️ by Simone Mattioli** | Rabbi E-Bike Management System v1.0.0