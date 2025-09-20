# 🚀 Guida Rapida - Rabbi E-Bike Management System

## 🎯 Avvio Rapido (Utenti)

### **🔥 AUTOSTART WINDOWS (Raccomandato):**
1. **Configura** percorso in `autostart-config.bat`
2. **Esegui** `install-autostart.bat` come amministratore
3. **Riavvia** PC → **App sempre pronta!**
4. **Dettagli completi:** Leggi `AUTOSTART-WINDOWS.md`

### **📱 Avvio Manuale:**

#### Per Windows:
1. **Doppio clic** su `start-production.bat`
2. **Aspetta** che il sistema si avvii (2-3 minuti)
3. **Accedi** all'app su http://localhost:8080

#### Per Mac/Linux:
1. **Apri Terminale** nella cartella del progetto
2. **Esegui** `./start-production.sh`
3. **Accedi** all'app su http://localhost:8080

---

## 📋 Istruzioni Uso Quotidiano

### 🏪 **Prima volta:**
1. **Apri** l'app → **Settings** (ingranaggio in alto)
2. **Configura** il nome del negozio e i prezzi
3. **Vai** al **Garage** → **Aggiungi** le tue biciclette
4. **Pronto** per le prenotazioni!

### 📅 **Gestione Prenotazioni:**
- **"Nuova Prenotazione"** → Calendario → Seleziona data/ora
- **Vista Giornaliera** → Timeline con tutte le prenotazioni
- **Vista Mensile** → Panoramica completa del mese

### 🚲 **Gestione Garage:**
- **"Garage"** → Lista completa biciclette e carrelli
- **"Dettagli"** → **"Modifica"** per aggiornare info bici
- **Manutenzione** → Traccia riparazioni e costi

### 📊 **Statistiche:**
- **"Statistiche"** → Panoramica guadagni giornalieri/mensili
- **Analytics** → Grafici dettagliati performance

---

## 🛠️ Risoluzione Problemi

### ❌ **App non si avvia:**
1. **Verifica** che Node.js sia installato (versione 16+)
2. **Riavvia** il computer
3. **Esegui** di nuovo lo script di avvio

### 🔄 **Errori di connessione:**
1. **Chiudi** l'app (Ctrl+C o chiudi finestra)
2. **Aspetta** 10 secondi
3. **Riavvia** con lo script

### 💾 **Backup dati:**
- **Automatico** ogni 24 ore in `server/backups/`
- **Manuale** → **Dev Panel** → **"Crea Backup"**

### 🔧 **Reset completo:**
- **Dev Panel** → **"Reset Applicazione"** (⚠️ cancella tutto!)

---

## 📱 **Accesso Multi-Dispositivo**

### 🖥️ **Computer Principale:**
- http://localhost:8080

### 📱 **Tablet/Smartphone del negozio:**
- http://[IP-COMPUTER]:8080
- **Esempio:** http://192.168.1.100:8080
- **Trova IP:** Pannello Dev → Sezione Network

---

## 🚨 **Supporto Urgente**

### 💾 **Salvataggio Emergency:**
1. **Dev Panel** → **"Esporta Tutti i Dati"**
2. **Salva** il file JSON in posto sicuro

### 📞 **Contatti:**
- **GitHub Issues:** https://github.com/simo-hue/rabbi-ebike-management-system/issues
- **Email Supporto:** [email supporto se disponibile]

---

## ⚡ **Shortcuts Utili**

| Azione | Shortcut |
|--------|----------|
| Nuova Prenotazione | **F1** |
| Vai al Garage | **F2** |
| Statistiche | **F3** |
| Settings | **F4** |
| Refresh Pagina | **F5** |

---

## 🔒 **Sicurezza**

- ✅ **Tutti i dati** salvati **localmente**
- ✅ **Backup automatici** ogni 24 ore
- ✅ **Zero dipendenze internet**
- ✅ **Accesso solo rete locale**

---

## 📈 **Performance**

- ⚡ **Avvio:** ~2-3 minuti prima volta, ~30s successivi
- 💾 **RAM:** ~200MB (leggerissimo)
- 🔄 **Sincronizzazione:** Istantanea tra dispositivi
- 📊 **Database:** SQLite ottimizzato per velocità

---

**🎉 Buon lavoro con Rabbi E-Bike Management System!**