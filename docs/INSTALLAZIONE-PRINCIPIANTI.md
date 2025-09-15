# 🚴‍♂️ Guida Completa all'Installazione per Principianti

## 📚 Indice
- [Prima di iniziare](#-prima-di-iniziare)
- [Passo 1: Installare Node.js](#-passo-1-installare-nodejs)
- [Passo 2: Scaricare Rabbi E-Bike](#-passo-2-scaricare-rabbi-e-bike)
- [Passo 3: Preparare il Sistema](#-passo-3-preparare-il-sistema)
- [Passo 4: Installare l'Applicazione](#-passo-4-installare-lapplicazione)
- [Passo 5: Prima Configurazione](#-passo-5-prima-configurazione)
- [Come utilizzare quotidianamente](#-come-utilizzare-quotidianamente)
- [Risoluzione Problemi](#-risoluzione-problemi)

---

## 🎯 Prima di iniziare

**Benvenuto!** Questa guida è pensata per proprietari di negozi di noleggio bici che vogliono installare Rabbi E-Bike sul **computer del negozio** per uso **permanente**.

### ⏱️ Tempo necessario: 30-45 minuti
### 🧑‍💻 Livello: Principiante assoluto  
### 💻 Target: **Computer del negozio (Windows/Mac/Linux)**

### ✅ Cosa otterrai:
- **Sistema gestionale permanente** per il tuo noleggio biciclette
- **Funziona offline** - non serve internet per l'uso quotidiano
- **Dati salvati localmente** sul tuo computer in sicurezza
- **Si avvia automaticamente** quando accendi il computer
- **Accessibile da altri dispositivi** nella tua rete locale (tablet, smartphone)
- **Backup automatici** per non perdere mai i dati

---

## 🟢 Passo 1: Installare Node.js

Node.js è il "motore" che fa funzionare Rabbi E-Bike.

### **Per Windows:**

1. **Vai su** [nodejs.org](https://nodejs.org/)
2. **Scarica** la versione **LTS** (versione stabile) 
   - Vedrai due pulsanti verdi, scegli quello con scritto "LTS"
3. **Esegui** il file scaricato (di solito in `Downloads`)
4. **Segui l'installazione** cliccando sempre "Avanti" e "Accetto"
5. **Riavvia il computer** quando richiesto

### **Per macOS:**

1. **Vai su** [nodejs.org](https://nodejs.org/)
2. **Scarica** la versione **LTS** per macOS
3. **Apri** il file `.pkg` scaricato
4. **Segui l'installazione** (inserisci password quando richiesta)
5. **Riavvia il computer**

### **✅ Verifica installazione:**

1. **Apri il terminale:**
   - **Windows:** Premi `Win + R`, scrivi `cmd` e premi Invio
   - **macOS:** Premi `Cmd + Spazio`, scrivi `terminale` e premi Invio

2. **Scrivi questo comando** e premi Invio:
   ```
   node --version
   ```

3. **Dovresti vedere** qualcosa come: `v18.17.0` o simile
   - Se vedi un numero di versione = ✅ **Installazione riuscita!**
   - Se vedi un errore = ❌ **Ripeti l'installazione**

---

## 🟢 Passo 2: Scaricare Rabbi E-Bike

### **Metodo 1: Download diretto (Più facile)**

1. **Vai alla pagina** del progetto su GitHub
2. **Clicca** il pulsante verde **"Code"**
3. **Clicca** **"Download ZIP"**
4. **Salva il file** sul Desktop
5. **Estrai** il file ZIP sul Desktop
   - **Windows:** Tasto destro → "Estrai tutto"
   - **macOS:** Doppio click sul file ZIP

### **Metodo 2: Con Git (Se lo hai già installato)**

1. **Apri il terminale**
2. **Vai sul Desktop:**
   ```bash
   cd Desktop
   ```
3. **Scarica il progetto:**
   ```bash
   git clone https://github.com/simo-hue/rabbi-ebike-management-system.git rabbieebike
   ```

---

## 🟢 Passo 3: Preparare il Sistema

### **Aprire il terminale nella cartella giusta:**

#### **Windows:**
1. **Apri Esplora File**
2. **Vai sul Desktop** e trova la cartella `rabbieebike`
3. **Tasto destro** nella cartella vuota (non su un file)
4. **Scegli** "Apri in Terminale" o "Apri finestra PowerShell qui"

#### **macOS:**
1. **Apri Finder**
2. **Vai sul Desktop** e trova la cartella `rabbieebike`
3. **Tasto destro** sulla cartella
4. **Scegli** "Servizi" → "Nuovo terminale nella cartella"

### **📍 Verifica di essere nella cartella giusta:**
Nel terminale, scrivi:
```bash
ls
```
(Su Windows puoi anche scrivere `dir`)

**Dovresti vedere** questi file/cartelle:
- `package.json`
- `src/`
- `server/`
- `README.md`

Se non li vedi, sei nella cartella sbagliata! Torna al passo precedente.

---

## 🟢 Passo 4: Installare l'Applicazione

### **Step 4A: Installare il Frontend**

Nel terminale, scrivi questo comando e premi Invio:
```bash
npm install
```

**⏳ Cosa succede:**
- Il computer scaricherà tutte le componenti necessarie
- Vedrà molte righe di testo scorrere velocemente
- Durata: 2-5 minuti (dipende dalla connessione internet)

**✅ Installazione riuscita** se alla fine non vedi errori rossi.

### **Step 4B: Installare il Server**

1. **Entra nella cartella server:**
   ```bash
   cd server
   ```

2. **Installa le dipendenze del server:**
   ```bash
   npm install
   ```

**⏳ Durata:** 1-2 minuti

---

## 🟢 Passo 5: Avviare l'Applicazione

### **Step 5A: Avviare il Server (Terminale 1)**

Nel terminale dove sei (dentro la cartella `server`), scrivi:
```bash
npm start
```

**✅ Server avviato** se vedi:
```
Server running on http://localhost:3001
Database created successfully
```

**⚠️ IMPORTANTE: Lascia questo terminale aperto! Non chiuderlo.**

### **Step 5B: Avviare il Frontend (Terminale 2)**

**Apri un NUOVO terminale** (lascia l'altro aperto):

#### **Windows:**
- Premi `Win + R`, scrivi `cmd`, premi Invio
- Vai nella cartella: `cd Desktop\rabbieebike`

#### **macOS:**
- Premi `Cmd + Spazio`, scrivi `terminale`, premi Invio
- Vai nella cartella: `cd Desktop/rabbieebike`

**Nel nuovo terminale, scrivi:**
```bash
npm run dev
```

**✅ Frontend avviato** se vedi:
```
Local:   http://localhost:8080
```

---

## 🟢 Step 6: Aprire l'Applicazione

1. **Apri il browser** (Chrome, Firefox, Safari...)
2. **Vai su:** `http://localhost:8080`
3. **Dovresti vedere** la dashboard di Rabbi E-Bike! 🎉

---

## 🟢 Passo 7: Prima Configurazione

### **7A: Configura il Negozio**

1. **Clicca** sull'icona ⚙️ **"Impostazioni"** in alto
2. **Modifica i dati del negozio:**
   - Nome del tuo negozio
   - Telefono reale
   - Email reale
   - Orari di apertura e chiusura
3. **Configura i prezzi:**
   - Tariffa oraria (esempio: 15€)
   - Mezza giornata (esempio: 45€)
   - Giornata intera (esempio: 70€)
   - Servizio guida (esempio: 25€/ora)
4. **Clicca "Salva"**

### **7B: Configura l'Inventario Biciclette**

1. **Clicca** su **"Garage"** in alto
2. **Elimina** le biciclette di esempio che non hai
3. **Aggiungi** le tue biciclette reali:
   - Clicca "+ Aggiungi Bicicletta"
   - Scegli tipo (Adulto/Bambino/Carrello/Trailer)
   - Imposta taglia (S/M/L/XL)
   - Seleziona sospensioni
   - Indica se ha gancio carrello
   - **IMPORTANTE:** Metti la quantità giusta che possiedi
4. **Salva ogni bicicletta**

### **7C: Test Funzionalità**

1. **Crea una prenotazione di test:**
   - Clicca "+ Nuova Prenotazione"
   - Inserisci dati fittizi
   - Scegli una data futura
   - Seleziona una bicicletta
   - Salva
2. **Verifica** che appaia nel calendario
3. **Elimina** la prenotazione di test

### **7D: Primo Backup**

1. **Clicca** su **"Developer"** in alto
2. **Clicca** **"Crea Backup Completo"**
3. **Verifica** che sia stato creato (vedrai la conferma)

---

## 🚀 Passo 8: Configurazione Avvio Automatico

**IMPORTANTE:** Invece di avviare manualmente ogni giorno, configuriamo il sistema per partire **automaticamente** quando accendi il computer del negozio.

### **Per Windows (Più comune nei negozi):**

**Creiamo uno script che si avvia automaticamente:**

1. **Crea file `avvia-rabbi-ebike.bat`** nella cartella `rabbieebike`:
   ```batch
   @echo off
   title Rabbi E-Bike - Gestione Noleggio
   cd /d "%~dp0"
   
   echo 🚴‍♂️ Avviando Rabbi E-Bike per il negozio...
   
   REM Avvia server in background
   start /MIN cmd /c "cd server && npm start"
   
   REM Aspetta 10 secondi
   timeout /t 10 /nobreak >nul
   
   REM Avvia frontend
   npm run dev
   ```

2. **Metti lo script in avvio automatico:**
   - Premi `Win + R`
   - Scrivi `shell:startup` e premi Invio
   - Copia il file `avvia-rabbi-ebike.bat` in questa cartella
   - **Ora si avvierà automaticamente all'accensione del PC!**

### **Per macOS:**

1. **Crea file `avvia-rabbi-ebike.command`** nella cartella `rabbieebike`:
   ```bash
   #!/bin/bash
   cd "$(dirname "$0")"
   echo "🚴‍♂️ Avviando Rabbi E-Bike..."
   
   # Avvia server in background
   (cd server && npm start) &
   
   # Aspetta e avvia frontend
   sleep 10
   npm run dev
   ```

2. **Rendi eseguibile:** Apri Terminale e scrivi:
   ```bash
   chmod +x avvia-rabbi-ebike.command
   ```

3. **Avvio automatico:**
   - Vai in Preferenze Sistema → Utenti e Gruppi → Elementi Login
   - Clicca "+" e seleziona `avvia-rabbi-ebike.command`

## 💡 Utilizzo Quotidiano del Negozio

### **🌅 Routine Mattina (Automatica!):**
1. **Accendi il computer** del negozio
2. **Rabbi E-Bike si avvia da solo** (se hai configurato l'avvio automatico)
3. **Aspetta 30 secondi** che si carichi tutto
4. **Apri browser** e vai su `http://localhost:8080`
5. **Inizia a lavorare!** 

### **📱 Accesso da Altri Dispositivi:**
- **Dal tuo tablet/smartphone:** Trova l'IP del computer (es: 192.168.1.100)
- **Vai su:** `http://192.168.1.100:8080` 
- **Puoi gestire le prenotazioni anche dal tablet!**

### **🌙 Routine Sera:**
- **Chiudi solo il browser** - il sistema può restare attivo
- **Oppure spegni il computer normalmente** - i dati sono salvati automaticamente

### **📱 Funzioni Principali per il Negozio:**
- **Dashboard:** Prenotazioni di oggi, incassi giornalieri
- **+ Nuova Prenotazione:** Cliente arriva → registra subito
- **Calendario:** Pianifica e vedi disponibilità settimane future  
- **Garage:** Controlla quali bici sono disponibili ora
- **Statistiche:** Ricavi mensili, bici più richieste
- **Costi Fissi:** Monitora profittabilità del negozio

---

## 🚨 Risoluzione Problemi

### **❌ "npm non è riconosciuto" (Windows)**

**Causa:** Node.js non installato correttamente

**Soluzione:**
1. Disinstalla Node.js dal Pannello di Controllo
2. Riavvia il computer
3. Reinstalla Node.js da [nodejs.org](https://nodejs.org/)
4. **Importante:** Durante l'installazione, spunta "Add to PATH"
5. Riavvia il computer

### **❌ "Command not found: npm" (macOS)**

**Soluzione:**
1. Reinstalla Node.js da [nodejs.org](https://nodejs.org/)
2. Riavvia il terminale
3. Prova di nuovo

### **❌ Server non si avvia - "Port 3001 already in use"**

**Causa:** Un altro programma sta usando la porta 3001

**Soluzione:**
1. **Chiudi tutti i terminali**
2. **Riavvia il computer**
3. **Riprova ad avviare il server**

### **❌ "Cannot connect to server"**

**Causa:** Il server non è avviato

**Soluzione:**
1. Verifica che il terminale del server sia aperto
2. Dovresti vedere "Server running on http://localhost:3001"
3. Se non lo vedi, riavvia il server con `npm start`

### **❌ Pagina bianca nel browser**

**Causa:** Frontend non avviato

**Soluzione:**
1. Verifica che il secondo terminale mostri "Local: http://localhost:8080"
2. Se non lo vedi, vai nella cartella principale e lancia `npm run dev`

### **❌ "Permission denied" (macOS/Linux)**

**Soluzione:**
```bash
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### **❌ Errori durante npm install**

**Soluzione:**
```bash
# Pulisce e reinstalla tutto
rm -rf node_modules
rm package-lock.json
npm install
```

---

## 📞 Hai ancora problemi?

### **🔍 Prima di chiedere aiuto:**

1. **Rileggi** la sezione specifica che ti da problemi
2. **Prova** a riavviare il computer e ricominciare
3. **Verifica** di aver seguito tutti i passaggi nell'ordine giusto

### **🆘 Informazioni da fornire quando chiedi aiuto:**

- Sistema operativo (Windows 10/11, macOS, Linux)
- Versione Node.js (risultato di `node --version`)
- Quale passo non funziona
- Messaggio di errore completo (copia e incolla)
- Screenshot dell'errore

---

## 🎉 Congratulazioni!

Se sei arrivato fin qui, hai installato con successo Rabbi E-Bike! 

**Il tuo sistema è ora pronto per:**
- ✅ Gestire prenotazioni biciclette
- ✅ Monitorare inventario
- ✅ Visualizzare statistiche
- ✅ Salvare tutti i dati automaticamente

**🔗 Link utili:**
- [Guida all'uso quotidiano](../README.md#-come-utilizzare-il-software-guida-operativa)
- [Funzionalità avanzate](../README.md#-funzionalità-principali)
- [Guida per sviluppatori](./INSTALLAZIONE-SVILUPPATORI.md)

---

**Made with ❤️ by Simone Mattioli** | Rabbi E-Bike Management System v1.0.0