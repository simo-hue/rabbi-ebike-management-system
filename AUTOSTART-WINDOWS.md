# 🖥️ Autostart Windows - Rabbi E-Bike Management System

## 🎯 Panoramica

Questo sistema ti permette di avviare automaticamente Rabbi E-Bike Management System ogni volta che accendi il tuo computer Windows. L'applicazione sarà pronta all'uso senza dover fare nulla manualmente.

---

## 🚀 Installazione Rapida (3 Passi)

### **Passo 1: Configura il Percorso**
1. **Apri** il file `autostart-config.bat`
2. **Modifica** la riga con il tuo percorso:
   ```batch
   SET PROJECT_PATH=C:\Users\TuoNome\Desktop\rabbi-ebike-management-system
   ```
3. **Salva** il file

### **Passo 2: Installa Autostart**
1. **Clicca destro** su `install-autostart.bat`
2. **Seleziona** "Esegui come amministratore"
3. **Scegli** opzione `1` (Installa Autostart)

### **Passo 3: Riavvia e Testa**
1. **Riavvia** il computer
2. **Aspetta** 2-3 minuti dopo l'accesso
3. **Apri browser** su http://localhost:8080

🎉 **Fatto!** L'app si avvierà automaticamente ad ogni accensione.

---

## 📋 Istruzioni Dettagliate

### 🔧 **Configurazione Percorso**

Il file `autostart-config.bat` contiene la configurazione principale:

```batch
REM Sostituisci questo percorso con la posizione del tuo progetto:
SET PROJECT_PATH=C:\Users\%USERNAME%\Downloads\rabbi-ebike-management-system
```

**Esempi di percorsi comuni:**
- `C:\Users\Mario\Desktop\rabbi-ebike-management-system`
- `D:\Progetti\rabbi-ebike-management-system`
- `C:\Negozio\Software\rabbi-ebike-management-system`

**⚠️ IMPORTANTE:**
- Usa **backslash** `\` (non forward slash `/`)
- **NON** mettere virgolette se non ci sono spazi
- Se il percorso ha **spazi**, usa virgolette: `"C:\Cartella con spazi\progetto"`

### 🛠️ **Installazione Autostart**

1. **Apri Esplora File** e vai alla cartella del progetto
2. **Trova** il file `install-autostart.bat`
3. **Clicca destro** → **"Esegui come amministratore"**
4. **Apparirà** il menu:
   ```
   [1] Installa Autostart
   [2] Disinstalla Autostart
   [3] Verifica stato Autostart
   [4] Test manuale script autostart
   [5] Esci
   ```
5. **Digita** `1` e premi Invio
6. **Attendi** la conferma di successo

### ✅ **Verifica Installazione**

Usa l'**opzione 3** nel menu per verificare:
```
[STATUS] ✓ AUTOSTART ATTIVO
• Script registrato: C:\...\rabbi-autostart.bat
• L'applicazione si avvia automaticamente all'accensione del PC
• File script: TROVATO ✓
```

---

## 🔄 Come Funziona

### **Sequenza di Avvio:**
1. **Windows si accende** → Accesso utente
2. **Attesa 30 secondi** (per stabilizzazione sistema)
3. **Verifica Node.js** e dipendenze
4. **Installa dipendenze** (se necessario)
5. **Build frontend** (se necessario)
6. **Avvia server backend** (porta 3001)
7. **Avvia frontend** (porta 8080)
8. **Verifica salute** dei servizi
9. **✅ Sistema pronto** su http://localhost:8080

### **Tempo Totale:**
- **Prima volta:** 3-5 minuti (build + dipendenze)
- **Successivi:** 1-2 minuti

### **Finestre:**
- Script gira **in background** (minimizzato)
- **Nessuna interruzione** del lavoro normale
- **Popup di conferma** quando pronto (opzionale)

---

## 📊 Monitoraggio e Log

### **File di Log:**
- **Posizione:** `[progetto]\logs\autostart.log`
- **Contenuto:** Tutti i passaggi dell'avvio automatico
- **Formato:** `[data ora] [LIVELLO] messaggio`

### **Log di Esempio:**
```
[2024-01-15 08:30:15] [INFO] Starting Rabbi E-Bike autostart
[2024-01-15 08:30:45] [INFO] Node.js and npm detected successfully
[2024-01-15 08:31:30] [INFO] Backend server started successfully
[2024-01-15 08:31:35] [INFO] Frontend server started successfully
[2024-01-15 08:31:40] [SUCCESS] System ready at http://localhost:8080
```

### **Verifica Stato:**
- **Processi attivi:** Apri Task Manager → cerca "node"
- **Accesso web:** http://localhost:8080
- **API backend:** http://localhost:3001/api/health

---

## 🛠️ Gestione e Manutenzione

### **🔄 Disinstallare Autostart:**
1. **Esegui** `install-autostart.bat` come amministratore
2. **Scegli** opzione `2` (Disinstalla Autostart)
3. **Conferma** la rimozione

### **🧪 Test Manuale:**
1. **Esegui** `install-autostart.bat` come amministratore
2. **Scegli** opzione `4` (Test manuale)
3. **Osserva** l'output in tempo reale

### **📂 Spostare il Progetto:**
Se sposti la cartella del progetto:
1. **Disinstalla** l'autostart (opzione 2)
2. **Aggiorna** il percorso in `autostart-config.bat`
3. **Reinstalla** l'autostart (opzione 1)

### **🔧 Aggiornare il Progetto:**
L'autostart è compatibile con gli aggiornamenti:
- **Nuove dipendenze:** Installate automaticamente
- **Nuovo build:** Generato automaticamente
- **Configurazione:** Preservata

---

## ❌ Risoluzione Problemi

### **🚫 Script non parte:**
```bash
[ERROR] Node.js not found in PATH
```
**Soluzione:** Installa Node.js 16+ e riavvia PC

### **📁 Errore percorso:**
```bash
[ERROR] Cannot access project directory
```
**Soluzione:** Verifica percorso in `autostart-config.bat`

### **🔌 Conflitto porte:**
```bash
[ERROR] Server failed to start
```
**Soluzione:**
- Chiudi altre app su porta 3001/8080
- Riavvia il computer

### **⏱️ Avvio lento:**
**Possibili cause:**
- Computer lento → Aumenta `STARTUP_DELAY` in config
- Primo avvio → Normale (build + dipendenze)
- Antivirus → Aggiungi eccezioni per Node.js

### **💻 Prestazioni:**
**Per computer più lenti, modifica in `autostart-config.bat`:**
```batch
SET STARTUP_DELAY=60    REM Da 30 a 60 secondi
SET SERVER_WAIT=20      REM Da 10 a 20 secondi
```

---

## 🔒 Sicurezza

### **Privilegi Richiesti:**
- **Amministratore:** Solo per installazione/disinstallazione
- **Utente normale:** Per esecuzione quotidiana

### **Registro Windows:**
- **Chiave:** `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run`
- **Valore:** `RabbiEBikeAutostart`
- **Comando:** Percorso al file `rabbi-autostart.bat`

### **Sicurezza Dati:**
- **Database locale:** Sempre protetto
- **Nessun accesso esterno:** Solo rete locale
- **Backup automatici:** Preservati

---

## 📞 Supporto

### **⚠️ Se qualcosa non funziona:**

1. **Controlla log:** `logs\autostart.log`
2. **Test manuale:** Opzione 4 nel menu
3. **Disinstalla e reinstalla:** Opzioni 2 + 1
4. **Avvio manuale:** Usa `start-production.bat`

### **🆘 Supporto Emergency:**
- **Disabilita autostart:** Opzione 2 nel menu
- **Avvio normale:** `start-production.bat`
- **Backup dati:** Dev Panel → "Esporta Tutti i Dati"

---

## ✅ Checklist Finale

- [ ] ✅ Percorso configurato in `autostart-config.bat`
- [ ] ✅ Autostart installato come amministratore
- [ ] ✅ Test effettuato e superato
- [ ] ✅ Computer riavviato e verificato
- [ ] ✅ App accessibile su http://localhost:8080
- [ ] ✅ Log controllati per errori

**🎉 Se tutti i punti sono ✅, l'autostart è configurato correttamente!**

---

*Rabbi E-Bike Management System si avvierà automaticamente ad ogni accensione del PC. Buon lavoro! 🚴‍♂️*