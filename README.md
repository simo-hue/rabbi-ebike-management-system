# 🚴‍♂️ Rabbi E-Bike Management System

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.3.1-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.8.3-blue.svg)

![GitHub stars](https://img.shields.io/github/stars/username/rabbi-ebike-management-system?style=social)
![GitHub forks](https://img.shields.io/github/forks/username/rabbi-ebike-management-system?style=social)
![GitHub issues](https://img.shields.io/github/issues/username/rabbi-ebike-management-system)
![GitHub last commit](https://img.shields.io/github/last-commit/username/rabbi-ebike-management-system)
![GitHub repo size](https://img.shields.io/github/repo-size/username/rabbi-ebike-management-system)
![GitHub language count](https://img.shields.io/github/languages/count/username/rabbi-ebike-management-system)
![GitHub top language](https://img.shields.io/github/languages/top/username/rabbi-ebike-management-system)

**Sistema gestionale professionale completo per noleggio biciclette elettriche** con interfaccia web moderna, database locale SQLite e funzionalità avanzate di booking, inventario e statistiche.

## 🌟 **Perché Scegliere Rabbi E-Bike Management**

✨ **Facile da Usare**: Interfaccia intuitiva progettata per operatori non tecnici  
⚡ **Veloce**: Database locale SQLite per performance immediate  
🔒 **Sicuro**: Tutti i dati salvati localmente, controllo totale  
📱 **Responsive**: Funziona perfettamente su desktop, tablet e smartphone  
🆓 **Open Source**: Completamente gratuito e personalizzabile  
🚀 **Pronto all'Uso**: Setup in 5 minuti, dati preconfigurati inclusi

## 🚴‍♂️ Funzionalità Principali

### 📅 **Gestione Prenotazioni**
- **Calendario interattivo** per visualizzare e gestire le prenotazioni
- **Prenotazioni in tempo reale** con controllo disponibilità biciclette
- **Categorie flessibili**: oraria, mezza giornata, giornata intera
- **Servizio guida opzionale** con tariffazione separata
- **Stati prenotazione**: confermata, in corso, completata, cancellata

### 🏪 **Configurazione Negozio**
- **Impostazioni generali**: nome negozio, telefono, email, orari
- **Gestione prezzi**: tariffe orarie, giornaliere, servizio guida
- **Inventario biciclette**: gestione completa del garage virtuale

### 🚲 **Garage Virtuale**
- **Gestione inventario** con tipi, taglie e sospensioni
- **Tipi supportati**: Adulto, Bambino, Carrello porta-bimbi, Trailer
- **Taglie**: S, M, L, XL
- **Sospensioni**: Solo anteriore, Full-suspension
- **Indicatori ganci carrello** per bici compatibili

### 📊 **Statistiche e Monitoraggio**
- **Dashboard** con statistiche giornaliere, settimanali, mensili
- **Grafici ricavi** e utilizzo biciclette
- **Monitoraggio performance** server
- **Sistema di backup** automatico e manuale

### ⚙️ **Pannello Sviluppatore**
- **Configurazione server**: porta, backup, debug
- **Gestione database**: backup, ripristino, statistiche
- **Log sistema** per troubleshooting
- **Import/Export** dati completi

## 🗄️ Come Funziona il Salvataggio dei Dati

### **Database SQLite Locale Automatico**
Il sistema utilizza un database SQLite che viene **creato automaticamente** al primo avvio del server:

```
rabbieebike/
├── server/
│   ├── rabbi_ebike.db     ← File database (creato automaticamente)
│   ├── backups/           ← Cartella backup (creata automaticamente)
│   │   ├── backup_2024-01-15_10-30-00.db
│   │   ├── backup_2024-01-16_10-30-00.db
│   │   └── ...
│   ├── server.js
│   └── package.json
```

### **Cosa Succede al Primo Avvio del Server**

**✅ Creazione Automatica:**
1. **Database SQLite** (`rabbi_ebike.db`)
2. **Tutte le tabelle necessarie**:
   - `settings` - Impostazioni negozio
   - `bikes` - Inventario biciclette
   - `bookings` - Prenotazioni
   - `booking_bikes` - Relazione prenotazioni-biciclette
   - `server_config` - Configurazione server

**📋 Dati Preconfigurati di Default:**

🏪 **Impostazioni Negozio:**
- Nome: "Rabbi E-Bike Rent Go & Fun"
- Telefono: "+39 123 456 7890"
- Email: "info@ecoride.it"
- Orari: 09:00 - 19:00
- Prezzi: 15€/ora, 45€/mezza giornata, 70€/giornata intera, 25€/ora guida

🚲 **Inventario Biciclette Default:**
- 2 bici adulto taglia S (sospensioni solo anteriori)
- 3 bici adulto taglia M (sospensioni solo anteriori)
- 2 bici adulto taglia L (sospensioni solo anteriori)
- 2 bici adulto taglia M (full-suspension)
- 1 bici bambino taglia S (sospensioni solo anteriori)

### **Come Funziona il Salvataggio Continuo**

**💾 Salvataggio Automatico in Tempo Reale:**
- **Ogni modifica** viene salvata immediatamente nel database
- **Non serve cliccare "Salva"** - tutto è automatico
- **Prenotazioni, impostazioni, inventario** salvati istantaneamente

**🔒 Persistenza dei Dati:**
- **Spegni/accendi PC:** i dati rimangono salvati
- **Riavvii server:** ricarica tutti i dati dal database
- **Crash applicazione:** nessun dato perso
- **Zero configurazione:** riapre tutto come lo avevi lasciato

**📦 Sistema Backup Integrato:**
- **Automatici:** ogni 24 ore (configurabile)
- **Manuali:** quando necessario dal pannello Developer
- **Ripristino:** sostituisci il file database con un backup

## 🔧 Installazione e Setup (Guida Completa)

### **Prerequisiti**
Prima di iniziare, assicurati di avere installato:

1. **Node.js** (versione 16 o superiore)
   - Scarica da [nodejs.org](https://nodejs.org/)
   - Per verificare l'installazione: `node --version` e `npm --version`

### **Passo 1: Preparazione Files**
1. Scarica o clona il progetto sul tuo computer
2. Apri il **Terminale** (su Mac) o **Prompt dei comandi** (su Windows)
3. Naviga nella cartella del progetto:
   ```bash
   cd /percorso/alla/cartella/rabbieebike
   ```

### **Passo 2: Installazione Dipendenze Frontend**
```bash
# Installa le dipendenze del frontend
npm install
```

### **Passo 3: Installazione e Avvio Server Backend**
```bash
# Vai nella cartella server
cd server

# Installa le dipendenze del server
npm install

# Avvia il server (lascia aperto questo terminale)
npm start
```
**✅ Il server sarà disponibile su:** `http://localhost:3001`

### **Passo 4: Avvio Frontend (Nuovo Terminale)**
Apri un **nuovo terminale** e:
```bash
# Torna nella cartella principale del progetto
cd /percorso/alla/cartella/rabbieebike

# Avvia il frontend
npm run dev
```
**✅ L'applicazione sarà disponibile su:** `http://localhost:8080`

### **Utilizzo Quotidiano**
Dopo la prima installazione, per utilizzare il software:

1. **Avvia il server** (terminale 1):
   ```bash
   cd server
   npm start
   ```

2. **Avvia il frontend** (terminale 2):
   ```bash
   npm run dev
   ```

3. **Apri il browser** su `http://localhost:8080`

### **🔄 Tenere il Server Sempre in Background**

#### **Opzione 1: PM2 (Raccomandato per Uso Professionale)**

**Installazione PM2:**
```bash
# Installa PM2 globalmente
npm install -g pm2
```

**Configurazione PM2 per il server:**
```bash
# Vai nella cartella server
cd server

# Avvia il server con PM2
pm2 start server.js --name "rabbi-ebike-server"

# Verifica che sia in esecuzione
pm2 status

# Configura PM2 per avviarsi automaticamente al boot del sistema
pm2 startup
pm2 save
```

**Comandi Utili PM2:**
```bash
pm2 status                    # Visualizza stato processi
pm2 logs rabbi-ebike-server   # Visualizza log in tempo reale
pm2 restart rabbi-ebike-server # Riavvia il server
pm2 stop rabbi-ebike-server    # Ferma il server
pm2 delete rabbi-ebike-server  # Elimina processo da PM2
```

#### **Opzione 2: Terminale in Background (macOS/Linux)**

**Con nohup:**
```bash
# Avvia server in background
cd server
nohup npm start > server.log 2>&1 &

# Trova il processo per fermarlo
ps aux | grep node
kill [PID_DEL_PROCESSO]
```

#### **Opzione 3: Windows - Servizio Windows**

**Usando node-windows:**
```bash
# Installa node-windows
npm install -g node-windows

# Crea script per servizio Windows (da eseguire come amministratore)
node-windows install --name "Rabbi E-Bike Server" --script "C:\\percorso\\server\\server.js"
```

#### **Opzione 4: Docker (Avanzato)**

**Crea Dockerfile nella cartella server:**
```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

**Comandi Docker:**
```bash
# Build immagine
docker build -t rabbi-ebike-server .

# Esegui container
docker run -d -p 3001:3001 -v $(pwd)/rabbi_ebike.db:/app/rabbi_ebike.db --name rabbi-server rabbi-ebike-server
```

3. **Apri il browser** su `http://localhost:8080`

## 🚀 Prima Configurazione Completa (Step-by-Step)

### **FASE 1: Verifica Installazione**

**1. Testa la connessione server:**
```bash
# Controlla che il server risponda
curl http://localhost:3001/api/health
# Risposta attesa: {"status":"OK","timestamp":"..."}
```

**2. Testa l'applicazione web:**
- Apri `http://localhost:8080` nel browser
- Dovresti vedere la dashboard principale
- **Se vedi errori di connessione:** verifica che il server sia avviato sulla porta 3001

### **FASE 2: Configurazione Iniziale nell'App**

**📋 Checklist Configurazione Obbligatoria:**

#### **1. ⚙️ Personalizza Impostazioni Negozio**
- **Accedi:** Click sull'icona ingranaggio "Impostazioni"
- **Modifica dati negozio:**
  - Nome del tuo negozio
  - Telefono e email reali
  - Orari di apertura e chiusura
- **Configura prezzi reali:**
  - Tariffa oraria (€)
  - Tariffa mezza giornata (€)
  - Tariffa giornata intera (€)
  - Tariffa guida oraria (€)
- **Salva le modifiche**

#### **2. 🚲 Configura il Tuo Inventario Reale**
- **Accedi:** Click su "Garage"
- **Elimina bici di default** che non possiedi
- **Aggiungi le tue biciclette reali:**
  - Tipo: Adulto/Bambino/Carrello porta-bimbi/Trailer
  - Taglia: S/M/L/XL
  - Sospensioni: Solo anteriore/Full-suspension
  - Gancio carrello: Sì/No
  - **Quantità disponibile** (IMPORTANTE)

#### **3. 🧪 Test Funzionalità**
- **Crea una prenotazione di test:**
  - Click "+ Nuova Prenotazione"
  - Compila tutti i campi
  - Verifica che le bici disponibili corrispondano al tuo inventario
  - Salva e controlla che appaia nel calendario
- **Elimina la prenotazione di test**

#### **4. 🔒 Primo Backup di Sicurezza**
- **Accedi:** Click su "Developer" (pannello in alto)
- **Click "Crea Backup"** per salvare la configurazione iniziale
- **Verifica:** controlla che sia apparso un nuovo file nella cartella `server/backups/`

### **FASE 3: Configurazione Avanzata (Opzionale)**

#### **⚙️ Pannello Developer - Configurazione Server**
- **Porta server:** cambia da 3001 se necessario
- **Backup automatici:** configura frequenza (default 24h)
- **Numero max backup:** quanti backup tenere (default 30)
- **Modalità debug:** attiva per log dettagliati

#### **🌐 Accesso da Altri Dispositivi**
- **Trova il tuo IP locale:**
  ```bash
  # macOS/Linux
  ifconfig | grep inet
  
  # Windows
  ipconfig
  ```
- **Accesso da tablet/smartphone:** `http://[TUO-IP]:8080`
- **Esempio:** `http://192.168.1.100:8080`

## 🎯 Come Utilizzare il Software (Guida Operativa)

### **Prima Configurazione**
1. **Apri l'applicazione** nel browser
2. **Vai in Impostazioni** (icona ingranaggio)
3. **Configura i dati del negozio**:
   - Nome negozio
   - Telefono e email
   - Orari di apertura
   - Tariffe (oraria, mezza giornata, giornata intera, guida)

### **Configurazione Garage**
1. **Vai nella sezione "Garage"**
2. **Aggiungi le tue biciclette**:
   - Seleziona tipo (Adulto/Bambino/Carrello/Trailer)
   - Scegli taglia (S/M/L/XL)
   - Imposta sospensioni (Solo anteriore/Full-suspension)
   - Indica se ha gancio carrello
   - Specifica la quantità disponibile

### **Gestione Prenotazioni**
1. **Visualizza il calendario** nella dashboard principale
2. **Crea nuova prenotazione**:
   - Clicca su "+ Nuova Prenotazione"
   - Inserisci dati cliente (nome, telefono, email)
   - Seleziona data e orari
   - Scegli categoria (oraria/mezza giornata/giornata intera)
   - Seleziona biciclette dal garage disponibile
   - Aggiungi servizio guida se necessario
   - Salva prenotazione

### **Gestione Quotidiana**
- **Dashboard**: monitora prenotazioni del giorno
- **Calendario**: visualizza prenotazioni future
- **Statistiche**: analizza performance e ricavi
- **Backup**: salva periodicamente i dati (sezione Developer)

### **🔄 Gestione Quotidiana del Server**

#### **Routine di Avvio (Modalità Manuale)**
```bash
# Mattina - Avvia il sistema completo
# Terminale 1: Server
cd server
npm start

# Terminale 2: Frontend (nuova finestra terminale)
cd /percorso/rabbieebike  # cartella principale
npm run dev

# Apri browser: http://localhost:8080
```

#### **Routine di Chiusura**
```bash
# Sera - Chiudi tutto
# In entrambi i terminali:
Ctrl+C (o Cmd+C su Mac)
```

#### **Controllo Stato Sistema**
```bash
# Verifica che il server sia attivo
curl http://localhost:3001/api/health

# Verifica processi attivi
# macOS/Linux:
ps aux | grep node

# Windows:
tasklist | findstr node
```

#### **Gestione Automatica con PM2 (Raccomandato)**
```bash
# Una volta configurato PM2, basta:
pm2 start rabbi-ebike-server  # Avvia
pm2 stop rabbi-ebike-server   # Ferma
pm2 restart rabbi-ebike-server # Riavvia

# Il frontend va sempre avviato manualmente:
npm run dev
```

## 🗄️ Database e Backup Completo

### **Database SQLite Locale**
- **File database**: `server/rabbi_ebike.db`
- **Backup automatici**: cartella `server/backups/`
- **Configurazione backup** nel Pannello Developer

### **Gestione Backup**
- **Automatico**: configurabile ogni N ore
- **Manuale**: click su "Crea Backup" nel pannello Developer
- **Ripristino**: sostituisci il file database con un backup precedente

### **🔧 Gestione Backup Avanzata**

#### **Backup Manuale Completo**
```bash
# 1. Ferma il server per sicurezza
# Nel terminale del server: Ctrl+C

# 2. Copia il database
cd server
cp rabbi_ebike.db "backup_manuale_$(date +%Y%m%d_%H%M%S).db"

# 3. Riavvia il server
npm start
```

#### **Ripristino da Backup**
```bash
# 1. Ferma il server
# Nel terminale del server: Ctrl+C

# 2. Sostituisci il database
cd server
cp backups/backup_YYYYMMDD_HHMMSS.db rabbi_ebike.db

# 3. Riavvia il server
npm start
```

#### **Backup Programmato (Cron - Linux/macOS)**
```bash
# Apri crontab
crontab -e

# Aggiungi riga per backup ogni notte alle 2:00
0 2 * * * cp /percorso/rabbieebike/server/rabbi_ebike.db /percorso/backup/backup_$(date +\%Y\%m\%d).db
```

#### **Migrazione Database**
```bash
# Esporta tutti i dati in formato SQL
sqlite3 rabbi_ebike.db .dump > export_completo.sql

# Importa in nuovo database
sqlite3 nuovo_database.db < export_completo.sql
```

### **🔍 Ispezione Database**

#### **Accesso Diretto al Database**
```bash
# Installa sqlite3 se necessario
# macOS: brew install sqlite
# Ubuntu: sudo apt install sqlite3

# Accedi al database
cd server
sqlite3 rabbi_ebike.db

# Comandi utili SQLite:
.tables              # Mostra tutte le tabelle
.schema settings     # Struttura tabella settings
SELECT * FROM settings;  # Mostra impostazioni
SELECT COUNT(*) FROM bookings;  # Conta prenotazioni
.quit                # Esci
```

#### **Statistiche Database**
```bash
# Dimensione database
ls -lh server/rabbi_ebike.db

# Numero record per tabella
sqlite3 server/rabbi_ebike.db "SELECT 'settings', COUNT(*) FROM settings UNION ALL SELECT 'bikes', COUNT(*) FROM bikes UNION ALL SELECT 'bookings', COUNT(*) FROM bookings;"
```

## 🛠️ Tecnologie Utilizzate

### **Frontend**
- **React 18** con **TypeScript**
- **Vite** come build tool
- **shadcn/ui** per i componenti UI
- **Tailwind CSS** per lo styling
- **React Query** per la gestione stato server
- **React Hook Form** per i form

### **Backend**
- **Node.js** con **Express**
- **SQLite3** come database
- **CORS** per comunicazione frontend-backend

## 🚨 Risoluzione Problemi Completa

### **Server non si avvia**
- Verifica che Node.js sia installato: `node --version`
- Controlla che la porta 3001 sia libera
- Verifica i permessi di scrittura nella cartella

### **Frontend non si connette**
- Assicurati che il server sia avviato su `localhost:3001`
- Controlla la console del browser per errori
- Verifica la configurazione nel Pannello Developer

### **Database corrotto**
- Ripristina da un backup precedente
- Elimina `rabbi_ebike.db` per ricrearlo con dati default

### **Supporto**
Per problemi tecnici o domande:
- Controlla i **log** nel Pannello Developer
- Verifica le **statistiche database**
- Consulta la documentazione tecnica in `CLAUDE.md`

### **🔧 Problemi Specifici e Soluzioni**

#### **"Cannot connect to server" o "Network Error"**
```bash
# 1. Verifica che il server sia avviato
ps aux | grep node    # macOS/Linux
tasklist | findstr node  # Windows

# 2. Testa la connessione diretta
curl http://localhost:3001/api/health

# 3. Verifica la porta
netstat -an | grep 3001  # macOS/Linux
netstat -an | findstr 3001  # Windows

# 4. Riavvia il server
cd server
npm start
```

#### **"Port 3001 already in use"**
```bash
# Trova il processo che usa la porta
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Termina il processo
kill -9 [PID]  # macOS/Linux
taskkill /PID [PID] /F  # Windows

# Oppure cambia porta nel codice server
# Modifica server.js: const PORT = process.env.PORT || 3002;
```

#### **"Permission denied" o "EACCES"**
```bash
# Verifica permessi cartella
ls -la server/

# Correggi permessi (macOS/Linux)
chmod 755 server/
chmod 644 server/*

# Su Windows: esegui come amministratore
```

#### **Database corrotto o "SQLITE_CORRUPT"**
```bash
# 1. Ferma il server
# 2. Verifica integrità database
cd server
sqlite3 rabbi_ebike.db "PRAGMA integrity_check;"

# 3. Se corrotto, ripristina da backup
cp backups/backup_[DATA_PIU_RECENTE].db rabbi_ebike.db

# 4. Se nessun backup, ricrea database
rm rabbi_ebike.db
npm start  # Ricreerà il database con dati default
```

#### **Frontend si avvia ma non carica**
```bash
# 1. Controlla console browser (F12)
# 2. Verifica che Vite sia attivo
ps aux | grep vite

# 3. Pulisci cache e reinstalla
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### **"Module not found" o errori di dipendenze**
```bash
# Frontend
rm -rf node_modules package-lock.json
npm install

# Server
cd server
rm -rf node_modules package-lock.json
npm install
```

#### **Performance lente o timeout**
```bash
# 1. Controlla log server per errori
tail -f server/server.log  # Se usi nohup
pm2 logs rabbi-ebike-server  # Se usi PM2

# 2. Verifica dimensione database
ls -lh server/rabbi_ebike.db

# 3. Ottimizza database
cd server
sqlite3 rabbi_ebike.db "VACUUM;"
sqlite3 rabbi_ebike.db "ANALYZE;"
```

### **🆘 Ripristino Completo Sistema**

#### **Reset Totale (Cancella Tutto)**
```bash
# ⚠️ ATTENZIONE: Questo cancella TUTTI i dati!

# 1. Ferma server e frontend
# 2. Backup di sicurezza (se vuoi conservare qualcosa)
cp server/rabbi_ebike.db backup_pre_reset.db

# 3. Cancella database
rm server/rabbi_ebike.db

# 4. Riavvia server (ricreerà tutto)
cd server
npm start
```

### **📊 Monitoraggio e Logging**

#### **Log Dettagliati**
```bash
# Abilita debug mode nel pannello Developer
# Oppure modifica server.js per log più dettagliati

# Visualizza log in tempo reale
tail -f server/server.log  # Con nohup
pm2 logs rabbi-ebike-server --lines 100  # Con PM2
```

#### **Metriche Performance**
```bash
# Accedi a: http://localhost:3001/api/monitoring/metrics
# Mostra: numero richieste, errori, tempo risposta, uptime

# Log sistema: http://localhost:3001/api/monitoring/logs
```

### **🔄 Aggiornamenti e Manutenzione**

#### **Aggiornamento Codice**
```bash
# 1. Backup database
cp server/rabbi_ebike.db backup_pre_update.db

# 2. Ferma sistema
# 3. Aggiorna codice (git pull, download, etc.)
# 4. Aggiorna dipendenze
npm install
cd server && npm install

# 5. Riavvia sistema
```

#### **Manutenzione Database**
```bash
# Ogni settimana - ottimizza database
cd server
sqlite3 rabbi_ebike.db "VACUUM; ANALYZE;"

# Ogni mese - pulisci backup vecchi
find backups/ -name "backup_*.db" -mtime +30 -delete
```

## 📱 Accesso e URL

- **URL Locale**: `http://localhost:8080`
- **Accesso da altri dispositivi**: `http://[IP-TUO-COMPUTER]:8080`
- **Responsive**: utilizzabile da desktop, tablet e smartphone

## 📋 Checklist Completa Setup

### **✅ Installazione Iniziale**
- [ ] Node.js installato (versione 16+)
- [ ] Dipendenze frontend installate (`npm install`)
- [ ] Dipendenze server installate (`cd server && npm install`)
- [ ] Server avviato senza errori
- [ ] Frontend avviato e accessibile su http://localhost:8080
- [ ] Connessione server-frontend funzionante

### **✅ Configurazione Base**
- [ ] Impostazioni negozio personalizzate
- [ ] Prezzi configurati correttamente
- [ ] Orari apertura/chiusura impostati
- [ ] Inventario biciclette configurato
- [ ] Primo backup di sicurezza creato

### **✅ Test Funzionalità**
- [ ] Prenotazione di test creata e salvata
- [ ] Prenotazione visibile nel calendario
- [ ] Modifica prenotazione funzionante
- [ ] Cancellazione prenotazione funzionante
- [ ] Statistiche visualizzate correttamente
- [ ] Pannello Developer accessibile

### **✅ Configurazione Avanzata (Opzionale)**
- [ ] PM2 installato e configurato
- [ ] Server configurato per avvio automatico
- [ ] Backup automatici configurati
- [ ] Accesso da altri dispositivi testato
- [ ] Monitoraggio log attivato

## 🎓 Guide Avanzate

### **🔧 Personalizzazione Avanzata**

#### **Modifica Porte Predefinite**
```bash
# Server (default: 3001)
# Modifica server/server.js:
const PORT = process.env.PORT || 3002;

# Frontend (default: 8080)
# Modifica vite.config.ts:
server: {
  port: 8081,
  host: "::"
}
```

#### **Configurazione Sicurezza Rete**
```bash
# Limita accesso solo localhost (server/server.js)
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});

# Abilita accesso da tutta la rete
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
```

### **📱 Configurazione Mobile/Tablet**

#### **PWA (Progressive Web App)**
L'applicazione è ottimizzata per mobile e può essere "installata" su smartphone:
1. **Android Chrome:** Menu → "Aggiungi alla schermata Home"
2. **iOS Safari:** Condividi → "Aggiungi alla schermata Home"
3. **Desktop:** Icona "installa" nella barra indirizzi

### **🔒 Backup e Sicurezza Avanzata**

#### **Backup Remoto Automatico**
```bash
# Script backup su Google Drive (richiede rclone)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp server/rabbi_ebike.db "backup_$DATE.db"
rclone copy "backup_$DATE.db" gdrive:rabbi-ebike-backups/
```

#### **Cifratura Database**
```bash
# Backup cifrato
tar -czf - server/rabbi_ebike.db | openssl enc -aes-256-cbc -out backup_cifrato.tar.gz.enc

# Ripristino
openssl enc -aes-256-cbc -d -in backup_cifrato.tar.gz.enc | tar -xzf -
```

## 📞 Supporto e Community

### **🆘 Richiesta Aiuto**
Per ottenere supporto, includi sempre:
1. **Sistema operativo** (Windows/macOS/Linux)
2. **Versione Node.js** (`node --version`)
3. **Messaggio errore completo**
4. **Log del server** (ultimi 20 righe)
5. **Passi per riprodurre il problema**

### **📝 Segnalazione Bug**
Prima di segnalare un bug:
1. **Controlla** la sezione "Risoluzione Problemi"
2. **Testa** con database pulito
3. **Verifica** log per errori
4. **Documenta** i passi per riprodurre

---

**🎉 Il tuo sistema Rabbi E-Bike è ora completamente configurato e pronto all'uso professionale!**

---

## ⭐ **Ti Piace il Progetto?**

Se questo sistema ti è utile:
- ⭐ **Lascia una stella** su GitHub
- 🍴 **Fai un fork** per personalizzarlo
- 🐛 **Segnala bug** o **richiedi funzionalità**
- 📢 **Condividi** con altri proprietari di bike rental

## 🏷️ **Tag e Keywords**

`bike-rental` `ebike-management` `booking-system` `react-typescript` `nodejs-sqlite` `rental-dashboard` `inventory-management` `bicycle-rental` `electric-bike` `booking-calendar` `business-management` `open-source` `responsive-web-app` `local-database` `pwa-ready`

---

**Made with ❤️ by Simone Mattioli** | **License: MIT** | **Version: 1.0.0**
