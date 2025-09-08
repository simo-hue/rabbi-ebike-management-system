# Rabbi E-Bike Management System

Sistema completo per la gestione di un negozio di noleggio e-bike con interfaccia web intuitiva e database locale SQLite.

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

## 🎯 Come Utilizzare il Software

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

## 🗄️ Database e Backup

### **Database SQLite Locale**
- **File database**: `server/rabbi_ebike.db`
- **Backup automatici**: cartella `server/backups/`
- **Configurazione backup** nel Pannello Developer

### **Gestione Backup**
- **Automatico**: configurabile ogni N ore
- **Manuale**: click su "Crea Backup" nel pannello Developer
- **Ripristino**: sostituisci il file database con un backup precedente

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

## 🚨 Risoluzione Problemi

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

## 📱 Accesso

- **URL Locale**: `http://localhost:8080`
- **Accesso da altri dispositivi**: `http://[IP-TUO-COMPUTER]:8080`
- **Responsive**: utilizzabile da desktop, tablet e smartphone
